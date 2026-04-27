import { API_BASE_URL } from '@/lib/axios';

/**
 * BE lưu ảnh đơn thuốc dưới dạng đường dẫn tương đối trên API (/uploads/prescriptions/...).
 * Trang admin chạy origin khác API nên cần ghép base URL. Chuỗi uploaded:// là bản cũ (không có file thật).
 */
export function resolvePrescriptionImageUrl(imageUrl: string | null | undefined): string {
  if (!imageUrl?.trim()) return '';
  const u = imageUrl.trim();
  if (u.startsWith('http://') || u.startsWith('https://')) return u;
  if (u.startsWith('data:')) return u;
  if (u.startsWith('uploaded://')) return '';
  const path = u.startsWith('/') ? u : `/${u}`;
  return `${API_BASE_URL}${path}`;
}

/**
 * Một số bản ghi từ BE dùng imageURL / image_url thay vì imageUrl.
 */
export function getRawPrescriptionImageSource(p: unknown): string | null {
  if (!p || typeof p !== 'object') return null;
  const o = p as Record<string, unknown>;
  for (const key of ['imageUrl', 'imageURL', 'image_url'] as const) {
    const v = o[key];
    if (typeof v === 'string' && v.trim()) return v.trim();
  }
  return null;
}

/** URL tải được cho thẻ img — sau khi chuẩn hóa tên thuộc tính. */
export function effectivePrescriptionImageUrl(p: unknown): string {
  return resolvePrescriptionImageUrl(getRawPrescriptionImageSource(p));
}

/** Ảnh đại diện user — BE lưu `/uploads/avatars/...` giống đơn thuốc. */
export const resolveUserAvatarUrl = resolvePrescriptionImageUrl;

/**
 * Ảnh sản phẩm: BE có thể trả `/uploads/...`, URL đầy đủ, hoặc legacy `local://product/...`
 * (trình duyệt không tải được scheme đó — map sang `/uploads/products/...` trên cùng host API).
 */
export function resolveProductImageUrl(imageUrl: string | null | undefined): string {
  if (!imageUrl?.trim()) return '';
  const u = imageUrl.trim();
  if (u.startsWith('http://') || u.startsWith('https://')) return u;
  if (u.startsWith('data:')) return u;
  if (u.startsWith('uploaded://')) return '';
  const m = /^local:\/\/product\/(.+)$/i.exec(u);
  if (m) {
    const rest = m[1].replace(/^\/+/, '');
    if (!rest) return '';
    const path = `/uploads/products/${rest.split('/').map(encodeURIComponent).join('/')}`;
    return `${API_BASE_URL}${path}`;
  }
  const path = u.startsWith('/') ? u : `/${u}`;
  return `${API_BASE_URL}${path}`;
}
