import { STATUS_CONFIG } from '@/features/manager/types/order-type';

/** Các đơn hiển thị trên danh sách quản lý — sale dùng chung để xem giống manager. */
export const MANAGEMENT_ORDER_LIST_VISIBLE_STATUSES = new Set<string>([
  'PENDING',
  'PAID',
  'ON_HOLD',
  'CONFIRMED',
  'PREORDER_CONFIRMED',
  'CANCELLED',
  'READY_TO_SHIP',
  'DELIVERING',
  'DELIVERED',
  'COMPLETED',
  'STOCK_REQUESTED',
  'STOCK_READY',
  'IN_PRODUCTION',
  'PROCESSING',
  'PREPARING',
  'PRODUCED',
]);

/** Gom nhóm filter "Đang xử lý đơn hàng" (lọc phía client khi API trả cả danh sách). */
export const MANAGEMENT_ORDER_PROCESSING_GROUP_STATUSES = new Set<string>([
  'STOCK_REQUESTED',
  'STOCK_READY',
  'IN_PRODUCTION',
  'PROCESSING',
  'PREPARING',
  'PRODUCED',
  'ON_HOLD',
]);

export const MANAGEMENT_ORDER_STATUS_FILTER_OPTIONS: { value: string; label: string; dot: string }[] = [
  { value: 'PENDING', label: 'Chờ xác nhận', dot: STATUS_CONFIG.PENDING.dot },
  { value: 'PAID', label: 'Đã thanh toán', dot: STATUS_CONFIG.PAID.dot },
  { value: 'ON_HOLD', label: 'Tạm giữ', dot: STATUS_CONFIG.ON_HOLD.dot },
  { value: 'CONFIRMED', label: 'Đã xác nhận', dot: STATUS_CONFIG.CONFIRMED.dot },
  { value: 'PREORDER_CONFIRMED', label: 'Đã xác nhận preorder', dot: STATUS_CONFIG.PREORDER_CONFIRMED.dot },
  { value: 'PROCESSING', label: 'Đang xử lý', dot: STATUS_CONFIG.PROCESSING.dot },
  { value: 'READY_TO_SHIP', label: 'Sẵn sàng vận chuyển', dot: STATUS_CONFIG.READY_TO_SHIP.dot },
  { value: 'DELIVERING', label: 'Đang giao hàng', dot: STATUS_CONFIG.DELIVERING.dot },
  { value: 'DELIVERED', label: 'Đã giao hàng', dot: STATUS_CONFIG.DELIVERED.dot },
  { value: 'COMPLETED', label: 'Đã hoàn tất', dot: STATUS_CONFIG.COMPLETED.dot },
  { value: 'CANCELLED', label: 'Đã hủy', dot: STATUS_CONFIG.CANCELLED.dot },
];
