export interface EyeSpecs {
  sphere: string;
  cylinder: string;
  axis: string;
  add: string;
  pd: string;
}

export interface PrescriptionData {
  /** Xem nhanh (blob: hoặc data:) — ưu tiên gửi `imageFile` lên server */
  imageUrl: string | null;
  /** File gốc khi chọn từ máy; gửi multipart thay vì base64 */
  imageFile?: File | null;
  od: EyeSpecs;
  os: EyeSpecs;
  notes: string;
}

// Giá trị mặc định rỗng (helper)
export const INITIAL_EYE_SPECS: EyeSpecs = {
  sphere: '',
  cylinder: '',
  axis: '',
  add: '',
  pd: '',
};
