import { useState } from 'react';
import { useCartStore } from '@/features/cart/store/useCartStore';
import { useCheckoutStore } from '@/features/checkout/store/useCheckoutStore';
import { toast } from 'sonner';
import axios from 'axios';
import { paymentApi } from '../api/checkout-api';
import { useNavigate } from 'react-router-dom';

export const useCheckoutFlow = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const { step, setStep, nextStep, prevStep, shippingData, paymentMethod, bankInfo } =
    useCheckoutStore();
  const { items, clearCart } = useCartStore();
  const hasPreOrderItems = items.some((item) => item.orderType === 'pre-order');

  const submitOrder = async () => {
    const toastId = toast.loading('Đang khởi tạo đơn hàng...');

    try {
      setIsSubmitting(true);

      // --- VALIDATION NHANH ---
      if (!shippingData.phone || !shippingData.address || !shippingData.name) {
        toast.error('Thiếu thông tin giao hàng', {
          id: toastId,
          description: 'Vui lòng kiểm tra lại họ tên, số điện thoại và địa chỉ, cũng như thông tin ngân hàng nếu chọn thanh toán chuyển khoản.',
        });
        setIsSubmitting(false);
        setStep(1);
        return;
      }

      const isValueEmpty = (val: unknown) => {
        if (val === null || val === undefined) return true;
        const strVal = String(val).trim().toLowerCase();
        return ['', '0', '0.00', '+0.00', '-0.00', '0.0', 'plan', 'none'].includes(strVal);
      };

      const hasPrescriptionData = (prescription: (typeof items)[number]['prescription']) => {
        if (!prescription) return false;
        if (prescription.imageFile) return true;
        if (prescription.imageUrl) return true;
        if (prescription.notes && String(prescription.notes).trim() !== '') return true;

        const odHasData = Boolean(
          prescription.od && Object.values(prescription.od).some((val) => !isValueEmpty(val)),
        );
        const osHasData = Boolean(
          prescription.os && Object.values(prescription.os).some((val) => !isValueEmpty(val)),
        );

        return odHasData || osHasData;
      };

      const hasLensButMissingPrescription = items.some(
        (item) => item.lensId && !hasPrescriptionData(item.prescription),
      );

      if (hasLensButMissingPrescription) {
        toast.error('Thiếu đơn bác sĩ', {
          id: toastId,
          description: 'Khi chọn tròng kính, bạn cần nhập thông số mắt hoặc tải lên ảnh đơn thuốc trước khi thanh toán.',
        });
        setIsSubmitting(false);
        setStep(3);
        return;
      }

      if (hasPreOrderItems && paymentMethod !== 'VNPAY') {
        toast.error('Đơn đặt trước phải thanh toán qua VNPay', {
          id: toastId,
          description: 'Sản phẩm đặt trước không hỗ trợ COD. Vui lòng chọn VNPay để thanh toán 100% trước khi đặt hàng.',
        });
        setIsSubmitting(false);
        setStep(2);
        return;
      }

      // --- BƯỚC 1: CHUẨN BỊ DATA ---
      const deliveryAddress = `${shippingData.address || ''}`.trim();

      const finiteOrZero = (v: unknown) => {
        const n = typeof v === 'number' ? v : parseFloat(String(v ?? '').trim());
        return Number.isFinite(n) ? n : 0;
      };

      /** Trục (độ): backend lưu int; tránh gửi số lẻ gây lỗi deserialize. */
      const axisDegrees = (v: unknown) => Math.round(finiteOrZero(v));

      const orderItems = items.map((item) => {
        let mappedPrescription = null;
        if (item.prescription) {
          const p = item.prescription;
          mappedPrescription = {
            odSphere: finiteOrZero(p.od?.sphere),
            odCylinder: finiteOrZero(p.od?.cylinder),
            odAxis: axisDegrees(p.od?.axis),
            odAdd: finiteOrZero(p.od?.add),
            odPd: finiteOrZero(p.od?.pd),
            osSphere: finiteOrZero(p.os?.sphere),
            osCylinder: finiteOrZero(p.os?.cylinder),
            osAxis: axisDegrees(p.os?.axis),
            osAdd: finiteOrZero(p.os?.add),
            osPd: finiteOrZero(p.os?.pd),
            note: p.notes || '',
          };
        }
        return {
          productVariantId: item.productId,
          quantity: item.quantity,
          lensId: item.lensId || null,
          prescription: mappedPrescription,
        };
      });

      const validBankInfo =
        bankInfo?.bankName && bankInfo?.bankAccountNumber && bankInfo?.accountHolderName
          ? bankInfo
          : null;

      const orderInfo = {
        deliveryAddress: deliveryAddress,
        recipientName: shippingData.name,
        phoneNumber: shippingData.phone,
        items: orderItems,
        bankInfo: validBankInfo,
      };

      const formData = new FormData();
      formData.append('orderInfo', JSON.stringify(orderInfo));

      // --- BƯỚC 2: TẠO ĐƠN HÀNG (SỬ DỤNG API ĐÃ TÁCH) ---
      const orderResponseData = await paymentApi.createOrder(formData, paymentMethod);
      const createdOrder = orderResponseData?.result ?? orderResponseData;
      const actualOrderId = createdOrder?.orderId;

      if (!actualOrderId) throw new Error('Không lấy được mã đơn hàng.');

      // --- BƯỚC 2.1: Upload ảnh đơn khám cho từng dòng hàng (nếu có) ---
      type CreatedOrderItem = {
        orderItemId: string;
        productVariantId: string | null;
        lensId: string | null;
        quantity: number;
      };

      const createdItems: CreatedOrderItem[] = Array.isArray(createdOrder?.items)
        ? createdOrder.items
            .filter((it: unknown): it is Record<string, unknown> => typeof it === 'object' && it !== null)
            .map((it: Record<string, unknown>) => ({
              orderItemId: String(it.orderItemId ?? ''),
              productVariantId: it.productVariantId ? String(it.productVariantId) : null,
              lensId: it.lensId ? String(it.lensId) : null,
              quantity: Number(it.quantity ?? 0),
            }))
            .filter((it: CreatedOrderItem) => !!it.orderItemId)
        : [];

      const uploadedOrderItemIds = new Set<string>();
      let uploadFailedCount = 0;

      const normalizeNullable = (value: unknown): string | null => {
        if (value === null || value === undefined) return null;
        const text = String(value).trim();
        return text === '' ? null : text;
      };

      const toUploadFile = async (
        prescription: (typeof items)[number]['prescription'],
      ): Promise<{ file: File | Blob; fileName?: string } | null> => {
        if (!prescription) return null;

        if (prescription.imageFile && prescription.imageFile instanceof File) {
          if (prescription.imageFile.size > 5 * 1024 * 1024) {
            throw new Error('Ảnh đơn khám mắt không được vượt quá 5MB');
          }
          return { file: prescription.imageFile, fileName: prescription.imageFile.name };
        }

        const imageUrl = prescription.imageUrl;
        if (imageUrl && (imageUrl.startsWith('data:image/') || imageUrl.startsWith('blob:'))) {
          const response = await fetch(imageUrl);
          const blobData = await response.blob();
          if (blobData.size > 5 * 1024 * 1024) {
            throw new Error('Ảnh đơn khám mắt không được vượt quá 5MB');
          }
          return { file: blobData, fileName: 'prescription.jpg' };
        }

        return null;
      };

      for (const cartItem of items) {
        const uploadPayload = await toUploadFile(cartItem.prescription);
        if (!uploadPayload) continue;

        const cartVariantId = normalizeNullable(cartItem.productId);
        const cartLensId = normalizeNullable(cartItem.lensId);
        const cartQty = Number(cartItem.quantity ?? 0);

        const exactMatch = createdItems.find(
          (it) =>
            !uploadedOrderItemIds.has(it.orderItemId) &&
            normalizeNullable(it.productVariantId) === cartVariantId &&
            normalizeNullable(it.lensId) === cartLensId &&
            Number(it.quantity) === cartQty,
        );

        const fallbackMatch = exactMatch
          ? null
          : createdItems.find(
              (it) =>
                !uploadedOrderItemIds.has(it.orderItemId) &&
                normalizeNullable(it.productVariantId) === cartVariantId &&
                normalizeNullable(it.lensId) === cartLensId,
            );

        const targetItem = exactMatch ?? fallbackMatch;
        if (!targetItem) {
          uploadFailedCount += 1;
          continue;
        }

        try {
          await paymentApi.uploadPrescriptionImage(
            targetItem.orderItemId,
            uploadPayload.file,
            uploadPayload.fileName,
          );
          uploadedOrderItemIds.add(targetItem.orderItemId);
        } catch {
          uploadFailedCount += 1;
        }
      }

      if (uploadFailedCount > 0) {
        toast.warning('Một số ảnh đơn khám chưa gắn được vào từng sản phẩm.', {
          id: `${toastId}-prescription-upload-warning`,
        });
      }

      // --- BƯỚC 3: XỬ LÝ THANH TOÁN (SỬ DỤNG API ĐÃ TÁCH) ---
      if (paymentMethod === 'VNPAY') {
        toast.loading('Đang kết nối cổng thanh toán VNPay...', { id: toastId });

        const paymentResponseData = await paymentApi.checkoutVnpay(actualOrderId);
        const paymentUrl = paymentResponseData?.result || paymentResponseData;

        if (paymentUrl && typeof paymentUrl === 'string') {
          clearCart();
          setTimeout(() => {
            window.location.href = paymentUrl;
          }, 1000);
        } else {
          toast.error('Lỗi cổng thanh toán VNPay', { id: toastId });
          setIsSubmitting(false);
        }
      } else {
        clearCart();
        toast.success('Đặt hàng thành công!', {
          id: toastId,
          description: 'Cảm ơn bạn đã mua hàng. Chúng tôi sẽ sớm liên hệ!',
        });

        setTimeout(() => {
          setIsSubmitting(false);
          navigate(`/checkout/success?orderId=${encodeURIComponent(String(actualOrderId))}`);
        }, 2000);
      }
    } catch (error: unknown) {
      console.error('Checkout Error:', error);

      let errorMessage = 'Có lỗi xảy ra, vui lòng thử lại sau.';

      if (axios.isAxiosError(error)) {
        errorMessage = error.response?.data?.message || error.response?.data?.Message || errorMessage;
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }

      toast.error('Đặt hàng thất bại', {
        id: toastId,
        description: errorMessage,
      });
      setIsSubmitting(false);
    }
  };

  const handleContinue = () => {
    if (step < 3) {
      nextStep();
    } else {
      submitOrder();
    }
  };

  return {
    step,
    setStep,
    handleContinue,
    handleBack: prevStep,
    isSubmitting,
  };
};
