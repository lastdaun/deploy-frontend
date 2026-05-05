import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Package, Loader2 } from 'lucide-react';
import { useAwaitingVerificationOrders } from '../../hook/useOrders';
import { formatOrderDisplayNameFromOrder } from '@/lib/orderDisplayName';
import { sortOrdersByCreatedAtDesc, ORDER_LIST_SORT_HINT_NEWEST_FIRST } from '@/lib/orderSort';
import { formatOrderCreatedAtLabel } from '@/lib/formatOrderCreatedAt';
import { fmt } from '@/lib/utils';

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'AWAITING_VERIFICATION':
      return 'Chờ xác minh';
    case 'PENDING':
      return 'Chờ xác nhận';
    case 'PAID':
      return 'Đã thanh toán';
    case 'CONFIRMED':
      return 'Đã xác nhận';
    case 'PREORDER_CONFIRMED':
      return 'Đã xác nhận preorder';
    case 'CANCELLED':
      return 'Đã hủy';
    default:
      return status;
  }
};

export default function OrderPage() {
  const [currentPage, setCurrentPage] = useState(0);
  const navigate = useNavigate();

  const { data, isLoading, isFetching, isError } = useAwaitingVerificationOrders(currentPage, 10);

  const rawItems = data?.items || [];
  const orders = useMemo(() => sortOrdersByCreatedAtDesc([...rawItems]), [rawItems]);
  const totalPages = data?.totalPages || 0;
  const totalElements = data?.totalElements || 0;

  const handlePrevPage = () => {
    if (currentPage > 0) setCurrentPage((prev) => prev - 1);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages - 1) setCurrentPage((prev) => prev + 1);
  };

  if (isError) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center p-6 text-rose-600 text-sm font-medium">
        Đã xảy ra lỗi khi tải danh sách đơn hàng. Vui lòng tải lại trang!
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
        <header className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-amber-500 rounded-xl shadow-lg shadow-amber-100 text-white">
                <Package size={22} />
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Đơn chờ xác minh</h1>
            </div>
            <p className="text-slate-500 text-sm font-medium">{ORDER_LIST_SORT_HINT_NEWEST_FIRST}</p>
            <p className="text-slate-400 text-xs mt-1 font-medium">
              Tổng {totalElements} đơn · trang {currentPage + 1}/{Math.max(1, totalPages || 1)}
            </p>
          </div>
        </header>

        <div className="bg-white rounded-[24px] sm:rounded-[32px] shadow-sm border border-slate-200/60 overflow-hidden relative">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[640px]">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  <th className="pl-6 sm:pl-8 pr-4 py-4 sm:py-5 text-[11px] font-bold text-slate-400 uppercase tracking-widest min-w-[200px]">
                    Tên đơn hàng
                  </th>
                  <th className="px-4 py-4 sm:py-5 text-[11px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">
                    Ngày tạo
                  </th>
                  <th className="px-4 py-4 sm:py-5 text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                    Liên hệ
                  </th>
                  <th className="px-4 py-4 sm:py-5 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-right">
                    Tổng tiền
                  </th>
                  <th className="px-4 py-4 sm:py-5 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-center">
                    Trạng thái
                  </th>
                  <th className="pl-4 pr-6 sm:pr-8 py-4 sm:py-5 text-right"></th>
                </tr>
              </thead>
              <tbody className={`divide-y divide-slate-50 ${isFetching && !isLoading ? 'opacity-70' : ''}`}>
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="py-20 text-center text-slate-500">
                      <div className="inline-flex items-center gap-2 font-medium">
                        <Loader2 className="w-5 h-5 animate-spin text-amber-500" />
                        Đang tải đơn hàng…
                      </div>
                    </td>
                  </tr>
                ) : orders.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-16 text-center text-slate-400 font-medium">
                      Không có đơn nào chờ xác minh
                    </td>
                  </tr>
                ) : (
                  orders.map((order) => (
                    <tr
                      key={order.orderId}
                      className="group hover:bg-amber-50/40 transition-colors"
                    >
                      <td className="pl-6 sm:pl-8 pr-4 py-4 font-semibold text-slate-900 text-sm leading-snug max-w-xs">
                        {formatOrderDisplayNameFromOrder(order)}
                      </td>
                      <td className="px-4 py-4 text-sm text-slate-600 whitespace-nowrap tabular-nums">
                        {formatOrderCreatedAtLabel(order.createdAt)}
                      </td>
                      <td className="px-4 py-4 text-sm text-slate-700">{order.phoneNumber}</td>
                      <td className="px-4 py-4 text-right font-bold text-slate-900 text-sm tabular-nums">
                        {fmt(order.totalAmount)}
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className="inline-flex px-3 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200/80">
                          {getStatusLabel(order.orderStatus)}
                        </span>
                      </td>
                      <td className="pl-4 pr-6 sm:pr-8 py-4 text-right">
                        <button
                          type="button"
                          onClick={() => navigate(`/seller/orders/${order.orderId}`)}
                          className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 shadow-sm hover:bg-slate-50 hover:border-amber-300 transition-colors"
                        >
                          Xử lý
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {totalPages > 1 && (
          <div className="mt-8 flex items-center justify-between px-1">
            <span className="text-sm font-semibold text-slate-500">
              Trang {currentPage + 1} / {totalPages}
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={currentPage === 0 || isLoading}
                onClick={handlePrevPage}
                className="w-10 h-10 flex items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition-all shadow-sm"
              >
                <ChevronLeft size={18} strokeWidth={2.5} />
              </button>
              <button
                type="button"
                disabled={currentPage >= totalPages - 1 || isLoading}
                onClick={handleNextPage}
                className="w-10 h-10 flex items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition-all shadow-sm"
              >
                <ChevronRight size={18} strokeWidth={2.5} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
