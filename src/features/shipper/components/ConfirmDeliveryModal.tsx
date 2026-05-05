import React, { useEffect, useState } from 'react';
import { Camera, Loader2, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatOrderDisplayName } from '@/lib/orderDisplayName';

const MAX_BYTES = 5 * 1024 * 1024;
const ACCEPT = 'image/*';

type ConfirmDeliveryModalProps = {
  open: boolean;
  orderId: string | null;
  onClose: () => void;
  onConfirm: (orderId: string, file: File) => Promise<void>;
};

const ConfirmDeliveryModal: React.FC<ConfirmDeliveryModalProps> = ({
  open,
  orderId,
  onClose,
  onConfirm,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) {
      setFile(null);
      setPreview(null);
      setError(null);
      return;
    }
  }, [open]);

  useEffect(() => {
    if (!file) {
      setPreview(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  if (!open || !orderId) return null;

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const f = e.target.files?.[0];
    if (!f) {
      setFile(null);
      return;
    }
    if (!f.type.startsWith('image/')) {
      setError('Vui lòng chọn file ảnh (JPG, PNG, WebP).');
      setFile(null);
      e.target.value = '';
      return;
    }
    if (f.size > MAX_BYTES) {
      setError('Ảnh không được vượt quá 5MB.');
      setFile(null);
      e.target.value = '';
      return;
    }
    setFile(f);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError('Vui lòng chụp hoặc tải ảnh xác nhận đã giao hàng (ví dụ: người nhận cùng kiện hàng).');
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await onConfirm(orderId, file);
      onClose();
    } catch {
      /* store đã notify lỗi */
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={submitting ? undefined : onClose} />
      <form
        onSubmit={handleSubmit}
        className="relative w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between border-b border-slate-100 px-5 py-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Xác nhận đã giao hàng</h2>
            <p className="mt-0.5 text-sm text-slate-500">
              {formatOrderDisplayName({ orderId, orderName: null })}
            </p>
            <p className="mt-0.5 text-xs text-slate-400 font-mono break-all">{orderId}</p>
            <p className="mt-1 text-xs text-amber-700">
              Tải ảnh minh chứng bàn giao (ảnh sản phẩm, người nhận, v.v.) trước khi xác nhận.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4 px-5 py-4">
          <label
            className={cn(
              'flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-8 transition-colors',
              file
                ? 'border-emerald-200 bg-emerald-50/50'
                : 'border-slate-200 bg-slate-50 hover:border-slate-300',
            )}
          >
            <input
              type="file"
              accept={ACCEPT}
              className="sr-only"
              onChange={handleFile}
              disabled={submitting}
            />
            {preview ? (
              <img
                src={preview}
                alt="Xem trước"
                className="max-h-48 w-full max-w-sm rounded-lg object-contain"
              />
            ) : (
              <>
                <Camera className="h-10 w-10 text-slate-400" />
                <span className="text-center text-sm font-medium text-slate-600">Chạm để chọn / chụp ảnh</span>
                <span className="text-xs text-slate-400">JPG, PNG, WebP · tối đa 5MB</span>
              </>
            )}
          </label>

          {file && (
            <button
              type="button"
              onClick={() => {
                setFile(null);
                setError(null);
              }}
              className="text-sm font-medium text-rose-600 hover:underline"
            >
              Chọn ảnh khác
            </button>
          )}

          {error && <p className="text-sm text-rose-600">{error}</p>}
        </div>

        <div className="flex justify-end gap-2 border-t border-slate-100 bg-slate-50/80 px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            Huỷ
          </button>
          <button
            type="submit"
            disabled={submitting || !file}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Đang gửi…
              </>
            ) : (
              'Xác nhận đã giao'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ConfirmDeliveryModal;
