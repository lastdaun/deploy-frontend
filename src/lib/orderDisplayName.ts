/**
 * Tên đơn hiển thị thống nhất trên mọi màn hình:
 * `[LOẠI] - [SẢN PHẨM CHÍNH][ + Lens nếu có tròng] - [MÃ NGẮN]`
 *
 * Ví dụ:
 * - Đơn thường: `ORDER - Warby Parker Durand - A1B2C3D4`
 * - Pre-order: `PREORDER - Warby Parker Durand - C9X4E5F6`
 * - Có tròng: `ORDER - Warby Parker Durand + Lens - K3P8M2N1`
 *
 * Mã ngắn: suy từ `orderName` chuẩn `ORDER-xxx` / `PREORDER-xxx` nếu có, không thì lấy 8 ký tự đầu `orderId` (giống BE).
 */

export type OrderLikeForDisplayName = {
  orderId: string;
  orderName?: string | null;
  comboName?: string | null;
  items?: ReadonlyArray<{
    orderItemType?: string | null;
    productName?: string | null;
    itemName?: string | null;
    lensId?: string | null;
    lensName?: string | null;
    prescription?: unknown | null;
  }>;
};

/** Gợi ý màu/icon: đơn thường / pre-order / có tròng (pre-order + tròng vẫn là `preorder`). */
export type OrderDisplayVisualKind = 'regular' | 'preorder' | 'with_lens';

/** 8 ký tự đầu của mã đơn đầy đủ (Giống C# order.Id[..Math.Min(8, order.Id.Length)]). */
export function orderIdHeadSegment(orderId: string): string {
  const s = String(orderId ?? '').trim();
  if (!s) return '';
  return s.slice(0, Math.min(8, s.length)).toUpperCase();
}

function inferPreorderFromItems(
  items?: ReadonlyArray<{ orderItemType?: string | null }>,
): boolean {
  if (!items?.length) return false;
  return items.some((item) => {
    const raw = String(item.orderItemType ?? '')
      .trim()
      .toUpperCase()
      .replace(/-/g, '_');
    return raw === 'PRE_ORDER' || raw === 'PREORDER';
  });
}

/** Khớp seller `orderHasPreorderItem`: có dòng preorder hoặc `orderName` bắt đầu PREORDER. */
function inferIsPreorderOrder(order: OrderLikeForDisplayName): boolean {
  if (inferPreorderFromItems(order.items)) return true;
  const name = String(order.orderName ?? '').trim().toUpperCase();
  return name.startsWith('PREORDER');
}

function itemHasLens(item: NonNullable<OrderLikeForDisplayName['items']>[number]): boolean {
  if (item.prescription != null) return true;
  const lid = item.lensId != null && String(item.lensId).trim() !== '';
  const ln = item.lensName != null && String(item.lensName).trim() !== '';
  return lid || ln;
}

function orderHasLensItems(
  items?: ReadonlyArray<NonNullable<OrderLikeForDisplayName['items']>[number]>,
): boolean {
  return items?.some((i) => itemHasLens(i)) ?? false;
}

function sanitizeProductLabel(raw: string): string {
  return raw.replace(/\s+/g, ' ').trim();
}

function resolveMainProductBaseLabel(order: OrderLikeForDisplayName): string {
  const combo = sanitizeProductLabel(String(order.comboName ?? ''));
  if (combo) return combo;

  const items = order.items;
  if (!items?.length) return 'Đơn hàng';

  const first = items[0];
  const name = sanitizeProductLabel(
    String(first.productName ?? '').trim() || String(first.itemName ?? '').trim(),
  );
  return name || 'Sản phẩm';
}

/**
 * Chuẩn hoá orderName API nếu đúng dạng PREORDER-xxxx / ORDER-xxxx (bỏ qua hoa/thường, dấu cách/_).
 */
export function normalizeOrderDisplayName(orderName: string | null | undefined): string | null {
  const raw = String(orderName ?? '').trim();
  if (!raw) return null;

  const m = raw.match(/\b(PREORDER|ORDER)\b[\s_-]+([A-Za-z0-9]+)/i);
  if (m?.[2]) {
    const kind = m[1].toUpperCase() === 'PREORDER' ? 'PREORDER' : 'ORDER';
    return `${kind}-${m[2].toUpperCase()}`;
  }
  return null;
}

function shortCodeForDisplay(order: OrderLikeForDisplayName): string {
  const normalized = normalizeOrderDisplayName(order.orderName);
  if (normalized) {
    const dash = normalized.indexOf('-');
    if (dash >= 0) return normalized.slice(dash + 1).trim();
  }
  return orderIdHeadSegment(order.orderId);
}

function buildUnifiedTitle(order: OrderLikeForDisplayName): string {
  const typeLabel = inferIsPreorderOrder(order) ? 'PREORDER' : 'ORDER';
  const base = resolveMainProductBaseLabel(order);
  const hasLens = orderHasLensItems(order.items);
  const productMiddle = hasLens ? `${base} + Lens` : base;
  const code = shortCodeForDisplay(order);
  return `${typeLabel} - ${productMiddle} - ${code}`;
}

export function formatOrderDisplayNameFromOrder(order: OrderLikeForDisplayName): string {
  return buildUnifiedTitle(order);
}

export function formatOrderDisplayName(opts: {
  orderId: string;
  orderName?: string | null;
  /** @deprecated Prefer truyền `items`; vẫn hỗ trợ list không có items */
  hasPreorderItems?: boolean;
  comboName?: string | null;
  items?: OrderLikeForDisplayName['items'];
}): string {
  const items =
    opts.items ??
    (opts.hasPreorderItems === true ? [{ orderItemType: 'PRE_ORDER' as const }] : undefined);

  return formatOrderDisplayNameFromOrder({
    orderId: opts.orderId,
    orderName: opts.orderName ?? null,
    comboName: opts.comboName ?? null,
    items,
  });
}

export function orderDisplayVisualKind(order: OrderLikeForDisplayName): OrderDisplayVisualKind {
  if (inferIsPreorderOrder(order)) return 'preorder';
  if (orderHasLensItems(order.items)) return 'with_lens';
  return 'regular';
}
