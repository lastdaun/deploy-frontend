import type { BEOrder } from '@/features/operation-staff/types/types';

/**
 * Pre-order: trạng thái đơn do sale xác nhận cho pre-order, hoặc còn dòng hàng PRE_ORDER.
 */
export function isPreorderOrder(order: BEOrder): boolean {
  if (order.orderStatus === 'PREORDER_CONFIRMED') return true;
  return order.items?.some((i) => i.orderItemType === 'PRE_ORDER') ?? false;
}
