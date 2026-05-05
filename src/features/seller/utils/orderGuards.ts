/** Đơn đã thanh toán đủ còn nợ (thường preorder đã cọc xong) — ẩn từ chối, vẫn xác nhận. */
export function isOrderFullyPaid(order: {
  totalAmount: number;
  remainingAmount?: number | null;
  paidAmount?: number;
}): boolean {
  if (order.remainingAmount != null) {
    return order.remainingAmount <= 0;
  }
  const paid = order.paidAmount;
  if (paid != null && order.totalAmount > 0) {
    return paid >= order.totalAmount;
  }
  return false;
}

export function isPreorderOrderItem(item: { orderItemType?: string | null }): boolean {
  const t = item.orderItemType;
  if (t == null || !String(t).trim()) return false;
  const u = String(t).trim().toUpperCase().replace(/-/g, '_');
  return u === 'PRE_ORDER' || u === 'PREORDER';
}

/** Có dòng preorder hoặc API đặt orderName dạng PREORDER-… (tránh list thiếu items thì không nhận diện). */
export function orderHasPreorderItem(order: {
  items?: { orderItemType?: string | null }[];
  orderName?: string | null;
}): boolean {
  if ((order.items ?? []).some((i) => isPreorderOrderItem(i))) return true;
  const name = (order.orderName ?? '').trim().toUpperCase();
  return name.startsWith('PREORDER');
}

/**
 * Preorder: giai đoạn chờ sale — hiển thị "Đã thanh toán" (đã cọc/thanh toán online).
 * Không gồm PREORDER_CONFIRMED: sau xác nhận phải hiện đúng trạng thái workflow.
 */
const PREORDER_SHOW_AS_PAID_STATUSES = new Set(['PENDING', 'AWAITING_VERIFICATION', 'PAID']);

/** Chỉ khi đơn vẫn ở bước chờ sale xử lý — tránh ép PENDING khi API đã CONFIRMED/... (lệch nút & badge). */
const IN_STOCK_UNPAID_SHOW_AS_PENDING = new Set(['PENDING', 'PAID', 'AWAITING_VERIFICATION']);

export function normalizeWorkflowOrderStatus(status: string | undefined | null): string {
  return (status ?? '').trim().toUpperCase();
}

/** Khớp backend VerifyOrderAsync: preorder → PAID | AWAITING_VERIFICATION; thường → PENDING | PAID | AWAITING_VERIFICATION */
export function canSellerVerifyOrder(order: {
  orderStatus: string;
  items?: { orderItemType?: string | null }[];
  orderName?: string | null;
}): boolean {
  const s = normalizeWorkflowOrderStatus(order.orderStatus);
  if (orderHasPreorderItem(order)) {
    return s === 'PAID' || s === 'AWAITING_VERIFICATION';
  }
  return s === 'PENDING' || s === 'PAID' || s === 'AWAITING_VERIFICATION';
}

/**
 * Trạng thái hiển thị thống nhất (khách xem lịch sử & sale).
 * - Có ít nhất 1 dòng preorder + PENDING/AWAITING_VERIFICATION → PAID (đã thanh toán / cọc).
 * - Chỉ sản phẩm order thường + chưa thanh toán đủ + vẫn đang chờ sale → PENDING (kể cả API trả PAID lệch).
 */
export function getOrderStatusForShopDisplay(order: {
  orderStatus: string;
  items?: { orderItemType?: string | null }[];
  orderName?: string | null;
  totalAmount: number;
  remainingAmount?: number | null;
  paidAmount?: number;
}): string {
  const raw = normalizeWorkflowOrderStatus(order.orderStatus);

  if (orderHasPreorderItem(order) && PREORDER_SHOW_AS_PAID_STATUSES.has(raw)) {
    return 'PAID';
  }

  if (
    orderHasOnlyInStockItems(order) &&
    !isOrderFullyPaid(order) &&
    IN_STOCK_UNPAID_SHOW_AS_PENDING.has(raw)
  ) {
    return 'PENDING';
  }

  return raw;
}

/** @alias — giữ tên cũ cho seller */
export function getSellerOrderStatusForDisplay(order: Parameters<typeof getOrderStatusForShopDisplay>[0]): string {
  return getOrderStatusForShopDisplay(order);
}

/** Đơn đang tạm giữ (ON_HOLD) — sale có thể hủy (modal lý do) hoặc tiếp tục xử lý. */
export function canSellerActOnOnHoldOrder(order: { orderStatus: string }): boolean {
  return normalizeWorkflowOrderStatus(order.orderStatus) === 'ON_HOLD';
}

/** Chỉ các dòng IN_STOCK (không preorder) — đơn hỗn hợp preorder + thường không được huỷ từ phía sale. */
export function orderHasOnlyInStockItems(order: { items?: { orderItemType?: string | null }[] }): boolean {
  if (!order.items?.length) return false;
  return order.items.every((i) => !isPreorderOrderItem(i));
}

const SELLER_REJECTABLE_STATUSES = new Set(['PENDING', 'PAID', 'AWAITING_VERIFICATION']);

/** Nút từ chối/huỷ: chỉ đơn chỉ có SP thường, còn nợ, và backend còn cho phép từ chối. Đơn có preorder → không từ chối (chỉ xác nhận). */
export function canSellerRejectOrder(order: {
  orderStatus: string;
  items?: { orderItemType?: string | null }[];
  orderName?: string | null;
  totalAmount: number;
  remainingAmount?: number | null;
  paidAmount?: number;
}): boolean {
  if (orderHasPreorderItem(order)) return false;
  if (!SELLER_REJECTABLE_STATUSES.has(normalizeWorkflowOrderStatus(order.orderStatus))) return false;
  if (!orderHasOnlyInStockItems(order)) return false;
  return !isOrderFullyPaid(order);
}
