import { useState, useMemo, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useOrders } from '@/features/manager/hooks/useOrders';
import { orderApi } from '@/features/seller/api/order-api';
import { fmt } from '@/lib/utils';
import {
  Loader2,
  Package,
  ChevronLeft,
  ChevronRight,
  Eye,
  CheckCircle,
  XCircle,
  PlayCircle,
} from 'lucide-react';
import { STATUS_CONFIG, type Order, type OrderPageResponse } from '@/features/manager/types/order-type';
import { OrderDetailModal } from '@/features/manager/components/oder/OrderDetailModal';
import { SellerCancelOrderReasonModal } from '@/features/seller/components/SellerCancelOrderReasonModal';

import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { sortOrdersByCreatedAtDesc, ORDER_LIST_SORT_HINT_NEWEST_FIRST } from '@/lib/orderSort';
import { formatOrderDisplayNameFromOrder } from '@/lib/orderDisplayName';
import { formatOrderCreatedAtLabel } from '@/lib/formatOrderCreatedAt';
import {
  MANAGEMENT_ORDER_LIST_VISIBLE_STATUSES,
  MANAGEMENT_ORDER_PROCESSING_GROUP_STATUSES,
  MANAGEMENT_ORDER_STATUS_FILTER_OPTIONS,
} from '@/features/manager/constants/managementOrderList';
import {
  canSellerRejectOrder,
  canSellerVerifyOrder,
  getSellerOrderStatusForDisplay,
  orderHasPreorderItem,
  canSellerActOnOnHoldOrder,
} from '@/features/seller/utils/orderGuards';
import { orderApi as managementOrderApi } from '@/features/manager/api/order-api';

// ─── STATUS BADGE ────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? {
    label: status,
    dot: 'bg-gray-400',
    className: 'bg-gray-100 text-gray-700 hover:bg-gray-200 border-transparent',
  };

  return (
    <Badge
      variant="outline"
      className={`inline-flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg text-[11px] font-bold tracking-wide min-w-[140px] shadow-sm transition-all ${cfg.className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${cfg.dot}`} />
      {cfg.label}
    </Badge>
  );
}

const CLIENT_PAGE_SIZE = 10;
export default function SellerOrderPage() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [clientPage, setClientPage] = useState(0);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectLoading, setRejectLoading] = useState(false);
  const [resumeHoldLoading, setResumeHoldLoading] = useState(false);
  const [cancelReasonModalOpen, setCancelReasonModalOpen] = useState(false);
  const [pendingRejectOrderId, setPendingRejectOrderId] = useState<string | null>(null);
  const [orderDetailLoadingId, setOrderDetailLoadingId] = useState<string | null>(null);

  const ordersQueryParams = useMemo(
    () =>
      ({
        page: 0,
        size: 500,
        sortBy: 'createdAt' as const,
        sortDir: 'desc' as const,
      }) satisfies Parameters<typeof useOrders>[0],
    [],
  );

  // Gọi danh sách management, rồi lọc cùng tập trạng thái với trang quản lý
  const { orders: rawOrders, loading } = useOrders(ordersQueryParams);

  const orders = useMemo(() => {
    const visible = rawOrders.filter((o) => MANAGEMENT_ORDER_LIST_VISIBLE_STATUSES.has(o.orderStatus));
    const byFilter =
      statusFilter === 'ALL'
        ? visible
        : statusFilter === 'PROCESSING'
          ? visible.filter((o) => MANAGEMENT_ORDER_PROCESSING_GROUP_STATUSES.has(o.orderStatus))
          : statusFilter === 'PENDING'
            ? visible.filter((o) => getSellerOrderStatusForDisplay(o) === 'PENDING')
            : statusFilter === 'PAID'
              ? visible.filter((o) => getSellerOrderStatusForDisplay(o) === 'PAID')
              : visible.filter((o) => o.orderStatus === statusFilter);
    return sortOrdersByCreatedAtDesc(byFilter);
  }, [rawOrders, statusFilter]);

  const totalPages = Math.ceil(orders.length / CLIENT_PAGE_SIZE);
  const paginatedOrders = orders.slice(clientPage * CLIENT_PAGE_SIZE, (clientPage + 1) * CLIENT_PAGE_SIZE);

  const refreshOrders = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ['orders'] });
    await queryClient.refetchQueries({ queryKey: ['orders'] });
  }, [queryClient]);

  /** Ghi đè đúng dòng đơn từ API (orderStatus + items…) — tránh chỉ patch status mà vẫn hiển thị PAID. */
  const mergeOrderRowFromServer = useCallback(
    async (orderId: string) => {
      try {
        const full = await managementOrderApi.getOrderById(orderId);
        queryClient.setQueriesData<OrderPageResponse>({ queryKey: ['orders'] }, (prev) => {
          if (!prev?.items?.length) return prev;
          const idx = prev.items.findIndex((o) => o.orderId === orderId);
          if (idx < 0) return prev;
          const nextItems = [...prev.items];
          nextItems[idx] = full;
          return { ...prev, items: nextItems };
        });
      } catch (e) {
        console.error(e);
      }
    },
    [queryClient],
  );

  const handleVerify = async (orderId: string, isApproved: boolean) => {
    setActionLoading(true);
    try {
      const isPreorderFlow = selectedOrder ? orderHasPreorderItem(selectedOrder) : false;
      await orderApi.verifyOrder(orderId, isApproved);
      await mergeOrderRowFromServer(orderId);
      toast.success(
        isApproved
          ? isPreorderFlow
            ? 'Đã xác nhận preorder — đơn chuyển sang đã xác nhận preorder.'
            : 'Đã xác nhận đơn hàng!'
          : 'Đã yêu cầu gửi lại đơn!',
      );
      setSelectedOrder(null);
      await refreshOrders();
    } catch (error) {
      console.error('Verify error:', error);
      toast.error('Có lỗi xảy ra, vui lòng thử lại.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectOpen = (orderId: string) => {
    setPendingRejectOrderId(orderId);
    setCancelReasonModalOpen(true);
  };

  const handleResumeFromHold = async (orderId: string) => {
    setResumeHoldLoading(true);
    try {
      await orderApi.resumeFromOperationalHold(orderId);
      await mergeOrderRowFromServer(orderId);
      toast.success('Đã tiếp tục xử lý đơn — vận hành có thể làm tiếp.');
      setSelectedOrder(null);
      await refreshOrders();
    } catch (error) {
      console.error('Resume from hold:', error);
      toast.error('Có lỗi xảy ra, vui lòng thử lại.');
    } finally {
      setResumeHoldLoading(false);
    }
  };

  const cancelModalSubtitle =
    pendingRejectOrderId && selectedOrder?.orderId === pendingRejectOrderId
      ? formatOrderDisplayNameFromOrder(selectedOrder)
      : null;

  const handleRejectConfirm = async (reason: string) => {
    const orderId = pendingRejectOrderId;
    if (!orderId) return;
    setRejectLoading(true);
    try {
      await orderApi.rejectOrder(orderId, reason);
      await mergeOrderRowFromServer(orderId);
      toast.success('Đã hủy đơn hàng!');
      setCancelReasonModalOpen(false);
      setPendingRejectOrderId(null);
      setSelectedOrder(null);
      await refreshOrders();
    } catch (error) {
      console.error('Cancel error:', error);
      toast.error('Có lỗi xảy ra, vui lòng thử lại.');
    } finally {
      setRejectLoading(false);
    }
  };

  const openOrderDetail = async (o: Order) => {
    setOrderDetailLoadingId(o.orderId);
    try {
      const full = await managementOrderApi.getOrderById(o.orderId);
      setSelectedOrder(full);
    } catch (e) {
      console.error(e);
      toast.error('Không tải được chi tiết đơn. Đang hiển thị dữ liệu từ danh sách.');
      setSelectedOrder(o);
    } finally {
      setOrderDetailLoadingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-20">
      {/* Order Detail Modal with seller actions */}
      {selectedOrder && (
        <OrderDetailModal
          order={selectedOrder}
          displayOrderStatus={getSellerOrderStatusForDisplay(selectedOrder)}
          onClose={() => setSelectedOrder(null)}
            extraFooter={
              canSellerVerifyOrder(selectedOrder) ? (
                <div className="flex items-center gap-3 w-full">
                  {canSellerRejectOrder(selectedOrder) && (
                    <button
                      onClick={() => handleRejectOpen(selectedOrder.orderId)}
                      disabled={actionLoading || rejectLoading || resumeHoldLoading}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl border-2 border-red-200 text-red-600 font-bold text-xs uppercase tracking-wider hover:bg-red-50 hover:border-red-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <XCircle size={16} />
                      Từ chối
                    </button>
                  )}
                  <button
                    onClick={() => handleVerify(selectedOrder.orderId, true)}
                    disabled={actionLoading || rejectLoading || resumeHoldLoading}
                    className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed ${canSellerRejectOrder(selectedOrder) ? 'flex-1' : 'w-full'}`}
                  >
                    <CheckCircle size={16} />
                    {actionLoading
                      ? 'Đang xử lý...'
                      : orderHasPreorderItem(selectedOrder)
                        ? 'Xác nhận preorder'
                        : 'Xác nhận'}
                  </button>
                </div>
              ) : canSellerActOnOnHoldOrder(selectedOrder) ? (
                <div className="flex items-center gap-3 w-full">
                  <button
                    type="button"
                    onClick={() => handleRejectOpen(selectedOrder.orderId)}
                    disabled={rejectLoading || resumeHoldLoading}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl border-2 border-red-200 text-red-600 font-bold text-xs uppercase tracking-wider hover:bg-red-50 hover:border-red-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex-1 justify-center"
                  >
                    <XCircle size={16} />
                    Huỷ đơn
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleResumeFromHold(selectedOrder.orderId)}
                    disabled={rejectLoading || resumeHoldLoading}
                    className="flex flex-1 items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs uppercase tracking-wider shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <PlayCircle size={16} />
                    {resumeHoldLoading ? 'Đang xử lý...' : 'Tiếp tục'}
                  </button>
                </div>
              ) : undefined
            }
        />
      )}

      <SellerCancelOrderReasonModal
        open={cancelReasonModalOpen}
        onOpenChange={(open) => {
          if (!open && rejectLoading) return;
          setCancelReasonModalOpen(open);
          if (!open) setPendingRejectOrderId(null);
        }}
        orderSubtitle={cancelModalSubtitle}
        loading={rejectLoading}
        onConfirm={handleRejectConfirm}
      />


      <div className="max-w-6xl mx-auto px-6 py-10">
        <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-orange-600 rounded-xl shadow-lg shadow-orange-200 text-white">
                <Package size={24} />
              </div>
              <h1 className="text-3xl font-black text-slate-900 tracking-tight">
                Xử lý đơn hàng
              </h1>
            </div>
            <p className="text-slate-500 font-medium text-sm">{ORDER_LIST_SORT_HINT_NEWEST_FIRST}</p>
            <p className="text-slate-400 text-xs mt-1 font-medium">
              {orders.length} đơn sau lọc hiển thị · phân trang {clientPage + 1}/{Math.max(1, totalPages || 1)}
            </p>
          </div>

          <div className="w-full md:w-[240px]">
            <Select
              value={statusFilter}
              onValueChange={(value) => { setStatusFilter(value); setClientPage(0); }}
            >
              <SelectTrigger className="h-11 bg-white border-slate-200 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:ring-offset-0 transition-all font-semibold text-slate-700">
                <SelectValue placeholder="Chọn trạng thái" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-slate-100 shadow-xl max-h-[320px]">
                <SelectItem
                  value="ALL"
                  className="font-semibold text-slate-800 cursor-pointer focus:bg-slate-50 py-2.5"
                >
                  Tất cả trạng thái
                </SelectItem>
                <div className="h-px bg-slate-100 my-1 mx-2" />
                {MANAGEMENT_ORDER_STATUS_FILTER_OPTIONS.map((opt) => (
                  <SelectItem
                    key={opt.value}
                    value={opt.value}
                    className="font-medium text-slate-600 cursor-pointer focus:bg-blue-50 focus:text-blue-700 py-2"
                  >
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${opt.dot}`} />
                      {opt.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </header>

        <div className="bg-white rounded-[32px] shadow-sm border border-slate-200/60 overflow-hidden relative">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  <th className="pl-8 pr-4 py-5 text-[11px] font-bold text-slate-400 uppercase tracking-widest min-w-[220px]">
                    Tên đơn hàng
                  </th>
                  <th className="px-4 py-5 text-[11px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">
                    Ngày tạo
                  </th>
                  <th className="px-4 py-5 text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                    Khách hàng
                  </th>
                  <th className="px-4 py-5 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-right">
                    Giá trị
                  </th>
                  <th className="px-4 py-5 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-center">
                    Trạng thái
                  </th>
                  <th className="pl-4 pr-8 py-5"></th>
                </tr>
              </thead>

              <tbody
                className={`divide-y divide-slate-50 transition-opacity duration-300 ${loading ? 'opacity-40' : 'opacity-100'}`}
              >
                {paginatedOrders.length === 0 && !loading ? (
                  <tr>
                    <td colSpan={6} className="py-20 text-center text-slate-400 font-medium">
                      Không có đơn hàng nào
                    </td>
                  </tr>
                ) : (
                  paginatedOrders.map((o) => (
                    <tr
                      key={o.orderId}
                      className="group hover:bg-orange-50/30 transition-colors cursor-pointer"
                      onClick={() => {
                        if (orderDetailLoadingId) return;
                        void openOrderDetail(o);
                      }}
                    >
                      <td className="pl-8 pr-4 py-5 font-semibold text-slate-900 text-sm leading-snug max-w-[min(28rem,40vw)]">
                        {formatOrderDisplayNameFromOrder(o)}
                      </td>
                      <td className="px-4 py-5 text-sm text-slate-600 whitespace-nowrap tabular-nums">
                        {formatOrderCreatedAtLabel(o.createdAt)}
                      </td>
                      <td className="px-4 py-5">
                        <div className="font-bold text-slate-700 text-sm">
                          {o.recipientName || 'N/A'}
                        </div>
                        <div className="text-xs text-slate-400 font-medium mt-0.5">
                          {o.phoneNumber}
                        </div>
                      </td>
                      <td className="px-4 py-5 text-right font-black text-slate-900 text-sm">
                        {fmt(o.totalAmount)}
                      </td>
                      <td className="px-4 py-5 text-center">
                        <StatusBadge status={o.orderStatus} />
                      </td>
                      <td className="pl-4 pr-8 py-5 text-right">
                        <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-orange-600 group-hover:text-white transition-all shadow-sm group-hover:shadow-md">
                          {orderDetailLoadingId === o.orderId ? (
                            <Loader2 size={16} className="animate-spin text-orange-500" />
                          ) : (
                            <Eye size={16} />
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {loading && (
            <div className="absolute inset-0 flex items-center justify-center z-20">
              <div className="bg-white/80 backdrop-blur-sm p-4 rounded-2xl shadow-xl flex items-center gap-3 border border-slate-100">
                <Loader2 className="animate-spin text-orange-600" size={20} />
                <span className="text-sm font-bold text-slate-700">Đang tải...</span>
              </div>
            </div>
          )}
        </div>

        {/* Pagination */}
        <div className="mt-8 flex items-center justify-between px-2">
          <span className="text-sm font-bold text-slate-500">
            Trang {clientPage + 1} / {totalPages || 1}
          </span>
          <div className="flex gap-2">
            <button
              disabled={clientPage === 0 || loading}
              onClick={() => setClientPage((p) => p - 1)}
              className="w-10 h-10 flex items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:border-slate-300 disabled:opacity-40 transition-all shadow-sm"
            >
              <ChevronLeft size={18} strokeWidth={2.5} />
            </button>
            <button
              disabled={clientPage + 1 >= totalPages || loading}
              onClick={() => setClientPage((p) => p + 1)}
              className="w-10 h-10 flex items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:border-slate-300 disabled:opacity-40 transition-all shadow-sm"
            >
              <ChevronRight size={18} strokeWidth={2.5} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
