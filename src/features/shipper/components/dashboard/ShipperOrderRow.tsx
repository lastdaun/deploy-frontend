import React from 'react';
import { Truck } from 'lucide-react';
import type { BEOrder } from '@/features/operation-staff/types/types';
import { formatOrderDisplayNameFromOrder } from '@/lib/orderDisplayName';
import { getOrderCollectAmount } from '@/features/shipper/utils/order-money';
import { orderStatusLabel, orderStatusRowPillClassName } from '@/lib/orderStatusUi';

interface ShipperOrderRowProps {
  order: BEOrder;
  onStartDelivery: (orderId: string) => void;
  loading: boolean;
}

const ShipperOrderRow: React.FC<ShipperOrderRowProps> = ({ order, onStartDelivery, loading }) => {
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  const handleStartDelivery = () => {
    onStartDelivery(order.orderId);
  };

  return (
    <tr className={`group transition-colors`}>
      <td className="px-6 py-4 align-middle">
        <div className="flex flex-col gap-0.5">
          <span className="font-bold text-slate-900 dark:text-white">{formatOrderDisplayNameFromOrder(order)}</span>
          <span className="text-[10px] font-mono text-slate-400">{order.orderId}</span>
          <span className="text-xs text-slate-500">Khách: {order.customerId}</span>
        </div>
      </td>

      <td className="px-6 py-4 align-middle">
        <div className="flex flex-col">
          <span className="text-sm text-slate-900 dark:text-white">{order.deliveryAddress}</span>
          <span className="text-xs text-slate-500">{order.phoneNumber}</span>
        </div>
      </td>

      <td className="px-6 py-4 align-middle">
        <div className="flex flex-col">
          <span className="text-sm font-medium text-slate-900 dark:text-white">
            {order.items?.length || 0} sản phẩm
          </span>
          <span className="text-xs text-slate-500">
            {order.items?.map((item) => item.lensName).join(', ') || 'N/A'}
          </span>
        </div>
      </td>

      <td className="px-6 py-4 align-middle">
        <span className="text-sm font-bold text-slate-900 dark:text-white">
          {getOrderCollectAmount(order).toLocaleString('vi-VN')} VNĐ
        </span>
      </td>

      <td className="px-6 py-4 align-middle">
        <span className="text-sm text-slate-600 dark:text-slate-400">{formatDate()}</span>
      </td>

      <td className="px-6 py-4 align-middle">
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${orderStatusRowPillClassName(order.orderStatus)}`}
        >
          {orderStatusLabel(order.orderStatus)}
        </span>
      </td>

      <td className="px-6 py-4 align-middle">
        <button
          onClick={handleStartDelivery}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-1.5 bg-primary text-white text-sm rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Truck className="w-3 h-3" />
          {loading ? 'Đang xử lý...' : 'Bắt đầu vận chuyển'}
        </button>
      </td>
    </tr>
  );
};

export default ShipperOrderRow;
