import React from 'react';
import type { BEOrder } from '@/features/operation-staff/types/types';
import { useOrderDrawerStore } from '@/features/operation-staff/store/orderDrawerStore.ts';
import CopyButton from '@/features/operation-staff/components/common/CopyButton.tsx';
import { orderStatusLabel, orderStatusRowPillClassName } from '@/lib/orderStatusUi';

interface OrderRowProps {
  order: BEOrder;
}

const OrderRow: React.FC<OrderRowProps> = ({ order }) => {
  const { openDrawer } = useOrderDrawerStore();
  const handleOpenDrawer = () => {
    openDrawer(order);
  };

  return (
    <tr className="group transition-colors">
      <td className="px-6 py-4 align-middle">
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-900 dark:text-white">{order.orderId}</span>
            <CopyButton text={order.orderId} size="sm" />
          </div>
        </div>
      </td>

      <td className="px-6 py-4 align-middle">
        <div className="mb-1 text-xs text-slate-500">{order?.orderName || 'N/A'}</div>
      </td>

      <td className="px-6 py-4 align-middle">
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">{order?.phoneNumber || 'N/A'}</span>
          {order?.phoneNumber && <CopyButton text={order.phoneNumber} size="sm" />}
        </div>
      </td>

      <td className="px-6 py-4 align-middle">
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${orderStatusRowPillClassName(order.orderStatus)}`}
        >
          {orderStatusLabel(order.orderStatus)}
        </span>
      </td>

      <td className="px-6 py-4 align-middle text-right">
        <div className="flex items-center justify-end">
          <button
            onClick={handleOpenDrawer}
            className="inline-flex items-center justify-center rounded-lg bg-slate-100 px-4 py-2 text-xs font-bold text-slate-700 shadow-sm transition-colors hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600"
          >
            Chi tiết đơn hàng
          </button>
        </div>
      </td>
    </tr>
  );
};

export default OrderRow;
