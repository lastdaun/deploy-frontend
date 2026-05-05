/**
 * Sắp xếp đơn: ưu tiên nhóm trạng thái, trong cùng nhóm FIFO theo createdAt tăng dần;
 * thiếu createdAt xếp sau cùng nhóm, tie-break theo orderId.
 */

/** Gợi chú giao diện danh sách đơn (khách / sale / quản trị): mới tạo lên đầu. */
export const ORDER_LIST_SORT_HINT_NEWEST_FIRST = 'Đơn mới khởi tạo hiển thị phía trên (theo ngày tạo, mới → cũ).';

/** Giá trị parse được; thiếu/ngày không hợp lệ trả về undefined để xử lý asc/desc khác nhau. */
export function createdAtSortKey(o: { createdAt?: string | null }): number | undefined {
  if (o.createdAt) {
    const t = Date.parse(o.createdAt);
    if (!Number.isNaN(t)) return t;
  }
  return undefined;
}

/** Thời điểm tạo đơn: cũ → mới; thiếu createdAt xếp cuối. */
export function sortOrdersByCreatedAtAsc<T extends { orderId: string; createdAt?: string | null }>(
  items: T[],
): T[] {
  return [...items].sort((a, b) => {
    const ta = createdAtSortKey(a);
    const tb = createdAtSortKey(b);
    const aMissing = ta === undefined;
    const bMissing = tb === undefined;
    if (!aMissing && !bMissing && ta !== tb) return ta - tb;
    if (aMissing !== bMissing) return aMissing ? 1 : -1;
    return a.orderId.localeCompare(b.orderId);
  });
}

/** Thời điểm tạo đơn: mới → cũ (đơn khởi tạo gần đây lên trước); thiếu createdAt xếp cuối. */
export function sortOrdersByCreatedAtDesc<T extends { orderId: string; createdAt?: string | null }>(
  items: T[],
): T[] {
  return [...items].sort((a, b) => {
    const ta = createdAtSortKey(a);
    const tb = createdAtSortKey(b);
    const aMissing = ta === undefined;
    const bMissing = tb === undefined;
    if (!aMissing && !bMissing && ta !== tb) return tb - ta;
    if (aMissing !== bMissing) return aMissing ? 1 : -1;
    return b.orderId.localeCompare(a.orderId);
  });
}

export function sortByStatusPriorityThenCreatedAtFifo<T extends { orderId: string; orderStatus: string; createdAt?: string | null }>(
  items: T[],
  getPriority: (orderStatus: string) => number,
): T[] {
  return [...items].sort((a, b) => {
    const d = getPriority(a.orderStatus) - getPriority(b.orderStatus);
    if (d !== 0) return d;
    const ta = createdAtSortKey(a);
    const tb = createdAtSortKey(b);
    const aMissing = ta === undefined;
    const bMissing = tb === undefined;
    if (!aMissing && !bMissing && ta !== tb) return ta - tb;
    if (aMissing !== bMissing) return aMissing ? 1 : -1;
    return a.orderId.localeCompare(b.orderId);
  });
}

/** Thứ tự pipeline thống nhất toàn hệ thống; sau đó sort theo createdAt (cũ → mới) trong cùng trạng thái. */
export const UNIFIED_ORDER_STATUS_PIPELINE: readonly string[] = [
  'PENDING',
  'AWAITING_VERIFICATION',
  'ON_HOLD',
  'PAID',
  'CONFIRMED',
  'PREORDER_CONFIRMED',
  'STOCK_REQUESTED',
  'STOCK_READY',
  'IN_PRODUCTION',
  'PROCESSING',
  'PREPARING',
  'PRODUCED',
  'PACKAGING',
  'IN_PROGRESS',
  'STOCK_RECEIVED',
  'HANDED_TO_CARRIER',
  'READY_TO_SHIP',
  'DELIVERING',
  'SHIPPED',
  'DELIVERED',
  'COMPLETED',
  'CANCELLED',
  'REFUNDED',
];

export function unifiedOrderStatusPriority(status: string): number {
  const u = (status || '').toUpperCase();
  const i = UNIFIED_ORDER_STATUS_PIPELINE.indexOf(u);
  return i === -1 ? UNIFIED_ORDER_STATUS_PIPELINE.length : i;
}

/** Bàn giao sản xuất: xác nhận → đang xử lý → còn lại */
export function operationOrderStatusPriority(status: string): number {
  if (['CONFIRMED', 'PREORDER_CONFIRMED'].includes(status)) return 0;
  if (
    [
      'STOCK_REQUESTED',
      'STOCK_READY',
      'IN_PRODUCTION',
      'PROCESSING',
      'PREPARING',
      'PRODUCED',
    ].includes(status)
  )
    return 1;
  return 2;
}

/** Quản lý: pipeline đang chạy trước, đã giao, rồi hủy/hoàn */
export function managerOrderStatusPriority(status: string): number {
  if (['CANCELLED', 'REFUNDED'].includes(status)) return 2;
  if (['DELIVERED', 'COMPLETED', 'SHIPPED'].includes(status)) return 1;
  return 0;
}

/** Người bán: ưu tiên chờ / đã cọc, rồi các bước còn lại */
export function sellerOrderStatusPriority(status: string): number {
  return ['PENDING', 'PAID', 'AWAITING_VERIFICATION'].includes(status) ? 0 : 1;
}

/** Khách: đang xử lý trước, đã giao, rồi hủy/hoàn */
export function customerOrderStatusPriority(status: string): number {
  if (['CANCELLED', 'REFUNDED'].includes(status)) return 2;
  if (['DELIVERED', 'COMPLETED'].includes(status)) return 1;
  return 0;
}

/** Vận chuyển (operation shipping + shipper): sẵn sàng → đang giao → đã giao */
export function shippingOrderStatusPriority(status: string): number {
  if (status === 'READY_TO_SHIP') return 0;
  if (['DELIVERING', 'SHIPPED'].includes(status)) return 1;
  if (['DELIVERED', 'COMPLETED'].includes(status)) return 2;
  return 3;
}
