import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { ReactNode } from 'react';

import { formatOrderDisplayNameFromOrder } from '@/lib/orderDisplayName';

import {
  MapPin,
  Receipt,
  Calendar,
  Package,
  Glasses,
  Info,
  ClipboardList,
  FileText,
  ImageIcon,
} from 'lucide-react';
import {
  STATUS_CONFIG,
  type Order,
  type OrderItem,
  type Prescription,
} from '../../types/order-type';
import { fmt } from '@/lib/utils';
import { effectivePrescriptionImageUrl, getRawPrescriptionImageSource, resolvePrescriptionImageUrl } from '@/lib/prescriptionImageUrl';
import { formatOrderCreatedAtLabel } from '@/lib/formatOrderCreatedAt';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { OrderShippingDetails } from '@/components/order/OrderShippingDetails';

// ─── SUB-COMPONENT: ĐIỂM SỐ ĐO MẮT ───────────────────────────
function PrescriptionPoint({
  label,
  sph,
  cyl,
  axis,
}: {
  label: string;
  sph: number;
  cyl: number;
  axis: number;
}) {
  return (
    <div className="space-y-0.5">
      <p className="text-[9px] font-black text-blue-600 uppercase tracking-tighter">{label}</p>
      <p className="text-xs font-bold text-slate-800">
        S: {sph > 0 ? `+${sph}` : sph} | C: {cyl} | A: {axis}°
      </p>
    </div>
  );
}

function displayPrescriptionForItem(item: OrderItem): Prescription | null {
  const p = item.prescription;
  const fromLine = item.prescriptionImageUrl?.trim() || null;
  const fromNested = p ? getRawPrescriptionImageSource(p) ?? p.imageUrl : null;
  const imageUrl = (fromLine || fromNested) ?? null;
  if (p) {
    return {
      ...p,
      imageUrl: getRawPrescriptionImageSource(p) ?? p.imageUrl ?? fromLine ?? null,
    };
  }
  if (imageUrl) {
    return {
      id: '',
      imageUrl,
      odSphere: 0,
      odCylinder: 0,
      odAxis: 0,
      odAdd: 0,
      odPd: 0,
      osSphere: 0,
      osCylinder: 0,
      osAxis: 0,
      osAdd: 0,
      osPd: 0,
      note: '',
    };
  }
  return null;
}

// ─── SUB-COMPONENT: HIỂN THỊ ĐƠN THUỐC (DATA + IMAGE) ────────
function PrescriptionDisplay({ prescription }: { prescription: Prescription }) {
  const hasData = prescription.odSphere !== 0 || prescription.osSphere !== 0;
  const imageSrc = effectivePrescriptionImageUrl(prescription);
  const hasImage = !!imageSrc;

  return (
    <div className="mt-4 pt-4 border-t border-dashed border-slate-200">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-400">
          <FileText size={12} /> Thông số đơn thuốc
        </div>

        {hasImage && (
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-[10px] font-bold text-blue-600 hover:text-blue-700 hover:bg-blue-50 gap-1.5 rounded-lg"
              >
                <ImageIcon size={12} /> Phóng to ảnh
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-1 border-none shadow-2xl rounded-2xl overflow-hidden bg-white">
              <img
                src={imageSrc}
                alt="Prescription"
                className="w-full h-auto object-contain max-h-[400px]"
              />
              <div className="p-2 bg-slate-50 text-[10px] font-bold text-center text-slate-500 uppercase">
                Ảnh đơn khám mắt (bác sĩ) do khách hàng gửi
              </div>
            </PopoverContent>
          </Popover>
        )}
      </div>

      <div className="mb-3 rounded-xl border border-slate-200 bg-slate-50/60 p-3">
        <p className="text-[10px] font-black uppercase tracking-wide text-slate-500 mb-2">
          Ảnh đơn khám mắt (bác sĩ) — khách hàng tải lên
        </p>
        {hasImage ? (
          <button
            type="button"
            onClick={() => window.open(imageSrc, '_blank', 'noopener,noreferrer')}
            className="block w-full text-left"
          >
            <img
              src={imageSrc}
              alt="Ảnh đơn khám mắt từ khách hàng"
              className="max-h-52 w-full object-contain rounded-lg border border-white shadow-sm"
            />
          </button>
        ) : (
          <p className="text-sm text-slate-500">Chưa có ảnh đơn khám mắt</p>
        )}
      </div>

      {hasData ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-50/80 p-3 rounded-xl border border-slate-100">
          <PrescriptionPoint
            label="Mắt Phải (OD)"
            sph={prescription.odSphere}
            cyl={prescription.odCylinder}
            axis={prescription.odAxis}
          />
          <PrescriptionPoint
            label="Mắt Trái (OS)"
            sph={prescription.osSphere}
            cyl={prescription.osCylinder}
            axis={prescription.osAxis}
          />
          <div className="space-y-0.5">
            <p className="text-[9px] font-black text-slate-400 uppercase">ADD / PD</p>
            <p className="text-xs font-bold text-slate-700">
              {prescription.odAdd || 0} / {prescription.odPd || 0}
            </p>
          </div>
          <div className="space-y-0.5">
            <p className="text-[9px] font-black text-slate-400 uppercase">Ghi chú</p>
            <p className="text-[10px] font-medium text-slate-600 truncate">
              {prescription.note || '---'}
            </p>
          </div>
        </div>
      ) : (
        <p className="text-[10px] text-slate-400 italic font-medium">
          Không có thông số đo mắt trực tiếp
        </p>
      )}
    </div>
  );
}

// ─── SUB-COMPONENT: DÒNG SẢN PHẨM ───────────────────────────
function ProductItemRow({ item }: { item: OrderItem }) {
  const isPreOrder = ['PRE_ORDER', 'PREORDER'].includes(item.orderItemType);
  const displayPresc = displayPrescriptionForItem(item);

  return (
    <div className="group bg-white border rounded-[1.5rem] p-4 hover:border-blue-200 hover:shadow-md transition-all">
      <div className="flex flex-col md:flex-row gap-4">
        {/* Thumbnail & Info */}
        <div className="flex flex-1 gap-4">
          <div className="w-16 h-16 rounded-xl bg-slate-100 flex items-center justify-center shrink-0 border overflow-hidden">
            {item.productImage ? (
              <img src={item.productImage} alt="Product" className="w-full h-full object-cover" />
            ) : (
              <Glasses className="text-slate-300" />
            )}
          </div>
          <div className="space-y-1">
            <h4 className="font-bold text-slate-900 text-sm leading-tight">
              {item.productName || item.itemName}
            </h4>
            <div className="flex flex-wrap gap-2">
              <Badge
                variant="outline"
                className="text-[10px] px-2 py-0 border-slate-200 text-slate-500 font-bold uppercase"
              >
                {item.variantName || 'Mặc định'}
              </Badge>
              {isPreOrder && (
                <Badge
                  variant="outline"
                  className="text-[10px] px-2 py-0 border-orange-200 text-orange-700 bg-orange-50 font-bold uppercase"
                >
                  Đặt trước
                </Badge>
              )}
              <Badge
                variant="outline"
                className="text-[10px] px-2 py-0 border-blue-100 text-blue-600 bg-blue-50/50 font-bold uppercase"
              >
                SL: {item.quantity}
              </Badge>
            </div>
          </div>
        </div>

        {/* Pricing */}
        <div className="md:text-right flex flex-col justify-center min-w-[140px]">
          <p className="text-sm font-black text-slate-900">{fmt(item.totalPrice)}</p>
          {item.lensName && (
            <p className="text-[10px] font-bold text-blue-500 uppercase flex items-center md:justify-end gap-1 mt-0.5">
              <Info size={10} /> {item.lensName}
            </p>
          )}
        </div>
      </div>

      {displayPresc && <PrescriptionDisplay prescription={displayPresc} />}
    </div>
  );
}

function displayCancelledByLabel(role: string | null | undefined): string {
  const r = String(role ?? '').trim();
  if (!r) return '—';
  const u = r.toUpperCase();
  const map: Record<string, string> = {
    CUSTOMER: 'Khách hàng',
    SALE: 'Sale',
    ADMIN: 'Quản trị',
    MANAGER: 'Quản lý',
    SHIPPER: 'Vận chuyển',
  };
  return map[u] ?? r;
}

// ─── MAIN COMPONENT: MODAL CHI TIẾT ĐƠN HÀNG ────────────────
export function OrderDetailModal({
  order,
  onClose,
  extraFooter,
  displayOrderStatus,
}: {
  order: Order;
  onClose: () => void;
  extraFooter?: ReactNode;
  /** Trạng thái badge (vd. seller map preorder + PENDING → PAID) */
  displayOrderStatus?: string;
}) {
  const statusKey = displayOrderStatus ?? order.orderStatus;
  const statusInfo = STATUS_CONFIG[statusKey] || {
    label: statusKey,
    className: 'bg-slate-100',
  };
  const cancelReasonTrimmed = String(order.cancellationReason ?? '').trim();
  const showCancelledOrderDetail =
    String(order.orderStatus ?? '').toUpperCase() === 'CANCELLED';
  const holdReasonTrimmed = String(order.operationalHoldReason ?? '').trim();
  const showOnHoldDetail = String(order.orderStatus ?? '').toUpperCase() === 'ON_HOLD';
  const deliveredImageSrc = resolvePrescriptionImageUrl(order.deliveredImageUrl);

  return (
    <Dialog open={!!order} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[850px] p-0 overflow-hidden border-none rounded-[2.5rem] shadow-2xl">
        {/* Header Section */}
        <div className="bg-slate-50/80 px-8 py-6 border-b shrink-0">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <Badge
                className={`${statusInfo.className} px-4 py-1 rounded-full uppercase text-[10px] font-black tracking-widest`}
              >
                {statusInfo.label}
              </Badge>
              <div className="flex flex-col items-end">
                <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">
                  Mã đơn hàng
                </span>
                <span className="text-sm font-black text-slate-800 tracking-tight">
                  {formatOrderDisplayNameFromOrder(order)}
                </span>
                <span className="text-[10px] font-mono text-slate-400 font-medium mt-0.5">{order.orderId}</span>
              </div>
            </div>
            <DialogTitle className="text-2xl font-black text-slate-900 mt-2 flex items-center gap-2">
              <ClipboardList className="text-blue-600" size={28} /> Chi tiết đơn hàng
            </DialogTitle>
            <DialogDescription className="sr-only">
              Thông tin chi tiết đơn hàng, khách hàng, tài chính và danh sách sản phẩm.
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* Content Section */}
        <ScrollArea className="max-h-[75vh]">
          <div className="p-8 space-y-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Cột 1: Giao hàng & liên hệ khách */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-slate-900 font-black uppercase tracking-widest text-[11px]">
                  <MapPin size={16} className="text-blue-600" /> Thông tin giao hàng
                </div>
                <div className="bg-white border rounded-[1.5rem] p-5 shadow-sm">
                  <OrderShippingDetails
                    recipientName={order.recipientName}
                    phoneNumber={order.phoneNumber}
                    deliveryAddress={order.deliveryAddress}
                  />
                </div>
              </div>

              {/* Cột 2: Tài chính */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-slate-900 font-black uppercase tracking-widest text-[11px]">
                  <Receipt size={16} className="text-blue-600" /> Tài chính
                </div>
                <Card className="bg-slate-900 text-white border-none shadow-xl rounded-[1.5rem] overflow-hidden">
                  <CardContent className="p-5 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] text-slate-400 font-black uppercase">
                        Tổng giá trị
                      </span>
                      <span className="font-bold">{fmt(order.totalAmount)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] text-emerald-400 font-black uppercase">
                        Đã thanh toán
                      </span>
                      <span className="text-emerald-400 font-bold">{fmt(order.paidAmount)}</span>
                    </div>
                    <Separator className="bg-white/10" />
                    <div className="flex justify-between items-center pt-1">
                      <span className="text-[10px] font-black uppercase text-blue-400 tracking-widest">
                        Cần thu thêm
                      </span>
                      <span className="text-2xl font-black text-blue-400">
                        {fmt(order.remainingAmount || 0)}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Row: Danh sách sản phẩm */}
            {deliveredImageSrc ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-slate-900 font-black uppercase tracking-widest text-[11px]">
                  <ImageIcon size={16} className="text-emerald-600" /> Ảnh xác nhận giao hàng
                </div>
                <a href={deliveredImageSrc} target="_blank" rel="noreferrer" className="block">
                  <img
                    src={deliveredImageSrc}
                    alt="Ảnh xác nhận giao hàng"
                    className="max-h-80 w-full rounded-[1.25rem] border border-emerald-100 bg-slate-50 object-contain"
                  />
                </a>
              </div>
            ) : null}

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-900 font-black uppercase tracking-widest text-[11px]">
                  <Package size={16} className="text-blue-600" /> Danh mục sản phẩm
                </div>
                <Badge variant="secondary" className="rounded-lg font-bold">
                  {order.items.length} món
                </Badge>
              </div>
              <div className="space-y-4">
                {order.items.map((item) => (
                  <ProductItemRow key={item.orderItemId} item={item} />
                ))}
              </div>
            </div>

            {showOnHoldDetail ? (
              <div className="rounded-[1.25rem] border border-amber-200 bg-amber-50/80 p-5 space-y-3">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-amber-800 mb-1.5">
                    Lý do tạm giữ (vận hành)
                  </p>
                  <p className="text-sm text-slate-800 font-medium leading-relaxed whitespace-pre-wrap">
                    {holdReasonTrimmed || '—'}
                  </p>
                </div>
              </div>
            ) : null}

            {showCancelledOrderDetail ? (
              <div className="rounded-[1.25rem] border border-rose-100 bg-rose-50/70 p-5 space-y-4">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-rose-700 mb-1.5">
                    Lý do huỷ
                  </p>
                  <p className="text-sm text-slate-800 font-medium leading-relaxed whitespace-pre-wrap">
                    {cancelReasonTrimmed || '—'}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-rose-700 mb-1.5">
                    Huỷ bởi
                  </p>
                  <p className="text-sm text-slate-800 font-medium">
                    {displayCancelledByLabel(order.cancelledBy)}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-rose-700 mb-1.5">
                    Huỷ lúc
                  </p>
                  <p className="text-sm text-slate-800 font-medium tabular-nums">
                    {formatOrderCreatedAtLabel(order.cancelledAt)}
                  </p>
                </div>
              </div>
            ) : null}
          </div>
        </ScrollArea>

        {/* Footer Section */}
        <DialogFooter className="bg-slate-50/80 px-8 py-5 flex flex-col gap-4 border-t shrink-0">
          {extraFooter ? (
            <div className="w-full">{extraFooter}</div>
          ) : (
            <div className="hidden md:flex items-center gap-2 text-slate-400 text-[10px] font-black uppercase tracking-widest">
              <Calendar size={14} /> Dữ liệu thời gian thực
            </div>
          )}
          <div className="flex items-center justify-end w-full">
            <Button
              onClick={onClose}
              className="rounded-xl font-black px-10 bg-slate-900 hover:bg-blue-700 transition-all uppercase text-xs tracking-widest h-11"
            >
              Đóng cửa sổ
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
