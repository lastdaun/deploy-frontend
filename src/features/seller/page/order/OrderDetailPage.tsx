import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { orderApi, type Order } from '../../api/order-api';
import { SellerCancelOrderReasonModal } from '@/features/seller/components/SellerCancelOrderReasonModal';
import { effectivePrescriptionImageUrl, getRawPrescriptionImageSource } from '@/lib/prescriptionImageUrl';
import { notifyError, notifySuccess } from '@/lib/notifyError';
import { formatOrderDisplayNameFromOrder } from '@/lib/orderDisplayName';
import { OrderShippingDetails } from '@/components/order/OrderShippingDetails';
import {
  canSellerRejectOrder,
  canSellerVerifyOrder,
  orderHasPreorderItem,
  canSellerActOnOnHoldOrder,
} from '@/features/seller/utils/orderGuards';

export default function OrderDetailPage() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [order, setOrder] = useState<Order | null>(null);
  const [processing, setProcessing] = useState(false);
  const [rejectLoading, setRejectLoading] = useState(false);
  const [resumeHoldLoading, setResumeHoldLoading] = useState(false);
  const [cancelReasonModalOpen, setCancelReasonModalOpen] = useState(false);

  useEffect(() => {
    if (!orderId) return;
    const fetchDetail = async () => {
      const data = await orderApi.getOrderDetail(orderId);
      setOrder(data);
    };
    fetchDetail();
  }, [orderId]);

  if (!order) {
    return <div className="p-6">Đang tải chi tiết đơn...</div>;
  }

  const handleRejectOpen = () => {
    if (!orderId) return;
    setCancelReasonModalOpen(true);
  };

  const handleRejectConfirm = async (reason: string) => {
    if (!orderId) return;

    setRejectLoading(true);
    try {
      await orderApi.rejectOrder(orderId, reason);
      try {
        const fresh = await orderApi.getOrderDetail(orderId);
        setOrder(fresh);
      } catch {
        /* list refetch vẫn chạy */
      }
      await queryClient.invalidateQueries({ queryKey: ['orders'] });
      await queryClient.refetchQueries({ queryKey: ['orders'] });
      setCancelReasonModalOpen(false);
      notifySuccess('Đã hủy đơn thành công.');
      setTimeout(() => navigate(-1), 1500);
    } catch (error) {
      notifyError(error, 'Có lỗi xảy ra, vui lòng thử lại.');
    } finally {
      setRejectLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!orderId) return;
    const isPreorderFlow = orderHasPreorderItem(order);
    setProcessing(true);
    try {
      await orderApi.verifyOrder(orderId, true);
      try {
        const fresh = await orderApi.getOrderDetail(orderId);
        setOrder(fresh);
      } catch {
        /* ignore */
      }
      await queryClient.invalidateQueries({ queryKey: ['orders'] });
      await queryClient.refetchQueries({ queryKey: ['orders'] });
      notifySuccess(
        isPreorderFlow
          ? 'Đã xác nhận preorder — đơn chuyển sang đã xác nhận preorder.'
          : 'Đã xác nhận đơn thành công.',
      );
      setTimeout(() => navigate(-1), 1500);
    } catch (error) {
      notifyError(error, 'Có lỗi xảy ra, vui lòng thử lại.');
    } finally {
      setProcessing(false);
    }
  };

  const handleResumeFromHold = async () => {
    if (!orderId) return;
    setResumeHoldLoading(true);
    try {
      await orderApi.resumeFromOperationalHold(orderId);
      try {
        const fresh = await orderApi.getOrderDetail(orderId);
        setOrder(fresh);
      } catch {
        /* ignore */
      }
      await queryClient.invalidateQueries({ queryKey: ['orders'] });
      await queryClient.refetchQueries({ queryKey: ['orders'] });
      notifySuccess('Đã tiếp tục xử lý đơn — vận hành có thể làm tiếp.');
    } catch (error) {
      notifyError(error, 'Có lỗi xảy ra, vui lòng thử lại.');
    } finally {
      setResumeHoldLoading(false);
    }
  };

  const showApprove = canSellerVerifyOrder(order);
  const showReject = canSellerRejectOrder(order);
  const showOnHoldActions = canSellerActOnOnHoldOrder(order);

  const busy = processing || rejectLoading || resumeHoldLoading;

  return (
    <>
    <div className="p-6 space-y-6">
      <button onClick={() => navigate(-1)} className="text-sm text-gray-500 hover:underline">
        ← Quay lại
      </button>

      <div className="grid grid-cols-12 gap-6">
        {/* LEFT */}
        <div className="col-span-4 space-y-4">
          <div className="bg-white p-4 rounded-xl border space-y-3">
            <h2 className="text-lg font-bold text-gray-900">
              {formatOrderDisplayNameFromOrder(order)}
            </h2>
            <p className="text-[11px] font-mono text-gray-400 break-all">{order.orderId}</p>
            <h3 className="font-semibold mb-3 text-gray-900">Thông tin giao hàng</h3>
            <OrderShippingDetails
              recipientName={order.recipientName}
              phoneNumber={order.phoneNumber}
              deliveryAddress={order.deliveryAddress}
              valueClassName="text-gray-800"
            />
          </div>
        </div>

        {/* RIGHT */}
        <div className="col-span-8 bg-white p-6 rounded-xl border">
          <h3 className="font-semibold mb-4">Order Items</h3>

          {order.items.map((item) => {
            const p = item.prescription;
            const fromLine = (item as { prescriptionImageUrl?: string | null }).prescriptionImageUrl;
            const prescriptionImg = p
              ? effectivePrescriptionImageUrl({ ...p, imageUrl: getRawPrescriptionImageSource(p) || p.imageUrl })
              : fromLine
                ? effectivePrescriptionImageUrl({ imageUrl: fromLine })
                : '';

            return (
              <div key={item.orderItemId} className="border rounded-lg p-4 mb-6 space-y-4">
                {/* ITEM INFO */}
                <div>
                  <p className="font-medium">Variant ID: {item.productVariantId}</p>
                  <p className="text-sm text-gray-500">Quantity: {item.quantity}</p>
                  <p className="text-sm text-gray-500">Unit Price: {item.unitPrice}</p>
                  <p className="text-sm text-gray-500">Total: {item.totalPrice}</p>
                </div>

                {/* PRESCRIPTION / ảnh đơn khám */}
                {(p || prescriptionImg) && (
                  <>
                    {prescriptionImg && (
                      <div>
                        <p className="font-medium mb-2">Ảnh đơn khám mắt (bác sĩ)</p>
                        <img
                          src={prescriptionImg}
                          alt="Ảnh đơn kính"
                          className="w-full max-w-md rounded-lg border"
                        />
                      </div>
                    )}

                    {p && (
                      <div>
                        <h4 className="font-medium mt-2">Mắt phải (OD)</h4>
                        <p>
                          SPH: {p.odSphere} | CYL: {p.odCylinder} | AXIS: {p.odAxis}
                        </p>

                        <h4 className="font-medium mt-2">Mắt trái (OS)</h4>
                        <p>
                          SPH: {p.osSphere} | CYL: {p.osCylinder} | AXIS: {p.osAxis}
                        </p>

                        <p className="text-sm text-gray-500 mt-2">Note: {p.note}</p>
                      </div>
                    )}
                  </>
                )}
              </div>
            );
          })}

          {showOnHoldActions && (
            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={handleRejectOpen}
                disabled={busy}
                className="flex-1 py-2 border border-orange-300 text-orange-600 rounded-lg hover:bg-orange-50 transition-colors disabled:opacity-50"
              >
                {rejectLoading ? 'Đang xử lý...' : 'Huỷ đơn'}
              </button>
              <button
                type="button"
                onClick={() => void handleResumeFromHold()}
                disabled={busy}
                className="flex-1 py-2 bg-amber-600 text-white rounded-lg font-medium hover:bg-amber-700 transition-colors disabled:opacity-50"
              >
                {resumeHoldLoading ? 'Đang xử lý...' : 'Tiếp tục xử lý'}
              </button>
            </div>
          )}

          {(showApprove || showReject) && !showOnHoldActions && (
            <div className={`flex gap-3 mt-6 ${showReject ? '' : 'justify-end'}`}>
              {showReject && (
                <button
                  type="button"
                  onClick={handleRejectOpen}
                  disabled={busy}
                  className="flex-1 py-2 border border-orange-300 text-orange-600 rounded-lg hover:bg-orange-50 transition-colors disabled:opacity-50"
                >
                  {rejectLoading || processing ? 'Đang xử lý...' : 'Huỷ đơn'}
                </button>
              )}

              {showApprove && (
                <button
                  type="button"
                  onClick={handleApprove}
                  disabled={busy}
                  className={
                    showReject
                      ? 'flex-1 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors disabled:opacity-50'
                      : 'w-full sm:max-w-md py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors disabled:opacity-50'
                  }
                >
                  {processing
                    ? 'Đang xử lý...'
                    : orderHasPreorderItem(order)
                      ? 'Xác nhận preorder'
                      : 'Xác nhận đơn'}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
      </div>
      <SellerCancelOrderReasonModal
        open={cancelReasonModalOpen}
        onOpenChange={(open) => {
          if (!open && rejectLoading) return;
          setCancelReasonModalOpen(open);
        }}
        orderSubtitle={formatOrderDisplayNameFromOrder(order)}
        loading={rejectLoading}
        onConfirm={handleRejectConfirm}
      />
    </>
  );
}
