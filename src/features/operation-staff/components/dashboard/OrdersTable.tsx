import React from 'react';
import OrderRow from './OrderRow';
import type { BEOrder } from '@/features/operation-staff/types/types';

interface OrdersTableProps {
  orders: BEOrder[];
  emptyMessage?: string;
}

const OrdersTable: React.FC<OrdersTableProps> = ({ orders, emptyMessage = 'Chưa có đơn hàng.' }) => {
  const isEmpty = !orders?.length;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-slate-50/50 dark:bg-slate-800/50 text-xs uppercase text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
            <th className="px-6 py-4">Mã đơn hàng</th>
            <th className="px-6 py-4">Người nhận</th>
            <th className="px-6 py-4">SĐT Khách</th>
            <th className="px-6 py-4">Trạng thái</th>
            <th className="px-6 py-4 text-right">Hành động</th>
          </tr>
        </thead>

        <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
          {isEmpty ? (
            <tr>
              <td
                colSpan={5}
                className="px-6 py-14 text-center text-sm text-slate-500 dark:text-slate-400"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            orders.map((order) => <OrderRow key={order.orderId} order={order} />)
          )}
        </tbody>
      </table>
    </div>
  );
};

export default OrdersTable;
