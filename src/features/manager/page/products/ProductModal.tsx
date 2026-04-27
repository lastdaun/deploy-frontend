import { useEffect, useState } from 'react';
import { X, Loader2, Plus } from 'lucide-react';

const EMPTY_FORM = {
  name: '',
  brand: '',
  category: '',
  frameType: '',
  gender: '',
  shape: '',
  frameMaterial: '',
  hingeType: '',
  nosePadType: '',
  weightGram: 0,
  status: 'ACTIVE',
  imageUrl: [] as string[],
};

export default function ProductModal({
  open,
  onClose,
  onSubmit,
  product,
  isSubmitting = false,
}: any) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [urlInput, setUrlInput] = useState('');
  const [imageUrls, setImageUrls] = useState<string[]>([]);

  useEffect(() => {
    if (open) {
      if (product) {
        const normalized = Array.isArray(product.imageUrl)
          ? product.imageUrl.map((img: any) =>
              typeof img === 'string' ? img : (img.imageUrl ?? ''),
            ).filter(Boolean)
          : [];
        setForm({ ...product, imageUrl: normalized });
        setImageUrls(normalized);
      } else {
        setForm(EMPTY_FORM);
        setImageUrls([]);
      }
      setUrlInput('');
    }
  }, [open, product]);

  if (!open) return null;

  const handleChange = (e: any) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleAddUrl = () => {
    const trimmed = urlInput.trim();
    if (!trimmed || imageUrls.length >= 5) return;
    setImageUrls((prev) => [...prev, trimmed]);
    setUrlInput('');
  };

  const removeImage = (index: number) => {
    setImageUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const inputClass =
    'w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-slate-50/50 transition-all';
  const labelClass = 'block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide';

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl shadow-slate-900/20 animate-in zoom-in-95 fade-in duration-200 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-7 py-5 border-b border-slate-100">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900">
              {product ? 'Sửa sản phẩm' : 'Thêm sản phẩm mới'}
            </h2>
            <p className="text-sm text-slate-500 mt-0.5">
              {product
                ? 'Cập nhật thông tin sản phẩm bên dưới.'
                : 'Điền thông tin cho sản phẩm mới.'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto px-7 py-6 flex-1">
          <div className="grid grid-cols-2 gap-x-5 gap-y-4">
            <div className="col-span-2">
              <label className={labelClass}>Tên sản phẩm *</label>
              <input
                name="name"
                placeholder="Ví dụ: Gọng kính Aviator cổ điển"
                value={form.name}
                onChange={handleChange}
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>Thương hiệu *</label>
              <input
                name="brand"
                placeholder="Ví dụ: Ray-Ban"
                value={form.brand}
                onChange={handleChange}
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>Danh mục</label>
              <select
                name="category"
                value={form.category}
                onChange={handleChange}
                className={inputClass}
              >
                <option value="">Chọn danh mục</option>
                <option value="FRAME">Gọng kính</option>
                <option value="LENS">Tròng kính</option>
                <option value="CONTACT">Kính áp tròng</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Kiểu gọng</label>
              <input
                name="frameType"
                placeholder="Ví dụ: Full-rim (viền đầy)"
                value={form.frameType}
                onChange={handleChange}
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>Đối tượng</label>
              <select
                name="gender"
                value={form.gender}
                onChange={handleChange}
                className={inputClass}
              >
                <option value="">Chọn đối tượng</option>
                <option value="MALE">Nam</option>
                <option value="FEMALE">Nữ</option>
                <option value="UNISEX">Unisex</option>
              </select>
            </div>

            <div>
              <label className={labelClass}>Kiểu dáng</label>
              <input
                name="shape"
                placeholder="Ví dụ: Chữ nhật"
                value={form.shape}
                onChange={handleChange}
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>Chất liệu gọng</label>
              <input
                name="frameMaterial"
                placeholder="Ví dụ: Titanium"
                value={form.frameMaterial}
                onChange={handleChange}
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>Loại bản lề</label>
              <input
                name="hingeType"
                placeholder="Ví dụ: Bản lề lò xo"
                value={form.hingeType}
                onChange={handleChange}
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>Loại đệm mũi</label>
              <input
                name="nosePadType"
                placeholder="Ví dụ: Điều chỉnh được"
                value={form.nosePadType}
                onChange={handleChange}
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>Trọng lượng (g)</label>
              <input
                type="number"
                name="weightGram"
                placeholder="Ví dụ: 28"
                value={form.weightGram || ''}
                onChange={handleChange}
                className={inputClass}
                min={0}
              />
            </div>

            <div>
              <label className={labelClass}>Trạng thái</label>
              <select
                name="status"
                value={form.status}
                onChange={handleChange}
                className={inputClass}
              >
                <option value="ACTIVE">Đang hoạt động</option>
                <option value="INACTIVE">Tạm dừng</option>
              </select>
            </div>

            <div className="col-span-2">
              <label className={labelClass}>Images (tối đa 5 URL)</label>
              <div className="flex flex-col gap-3">
                <div className="flex gap-2">
                  <input
                    type="url"
                    placeholder="Dán URL ảnh vào đây..."
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddUrl())}
                    disabled={imageUrls.length >= 5}
                    className={`${inputClass} flex-1`}
                  />
                  <button
                    type="button"
                    onClick={handleAddUrl}
                    disabled={!urlInput.trim() || imageUrls.length >= 5}
                    className="flex items-center gap-1 px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 transition-all disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
                  >
                    <Plus className="w-4 h-4" />
                    Thêm
                  </button>
                </div>

                {imageUrls.length > 0 && (
                  <div className="flex gap-3 flex-wrap">
                    {imageUrls.map((url, index) => (
                      <div key={index} className="relative w-20 h-20 rounded-xl border border-slate-200 bg-slate-50 overflow-hidden shrink-0 group">
                        <img
                          src={url}
                          alt={`img-${index}`}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src =
                              'data:image/svg+xml,' +
                              encodeURIComponent(
                                '<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80"><rect width="80" height="80" fill="#f1f5f9"/><text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="#94a3b8" font-size="9">Không ảnh</text></svg>',
                              );
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-4 h-4 text-white" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-7 py-5 border-t border-slate-100 bg-slate-50/50">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="px-5 py-2.5 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-all disabled:opacity-50"
          >
            Hủy
          </button>
          <button
            // 3. Truyền cả form data và file ra ngoài cho onSubmit handler
            onClick={() => onSubmit({ productData: { ...form, imageUrls }, files: [], modelFile: null })}
            disabled={isSubmitting || !form.name || !form.brand}
            className="flex items-center gap-2 px-6 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-semibold hover:bg-slate-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-slate-900/20"
          >
            {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
            {product ? 'Lưu thay đổi' : 'Tạo sản phẩm'}
          </button>
        </div>
      </div>
    </div>
  );
}
