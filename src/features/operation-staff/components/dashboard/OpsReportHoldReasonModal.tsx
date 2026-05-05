import { useEffect, useId, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import {
  ISSUE_OTHER_MAX_LEN,
  ISSUE_REASON_GROUPS,
  buildIssueOrderReasonPayload,
  type IssueOrderReasonId,
} from '@/features/orders/issueOrderReasonPresets';

export interface OpsReportHoldReasonModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderSubtitle?: string | null;
  loading?: boolean;
  onConfirm: (reason: string) => void;
}

export function OpsReportHoldReasonModal({
  open,
  onOpenChange,
  orderSubtitle,
  loading = false,
  onConfirm,
}: OpsReportHoldReasonModalProps) {
  const OPS_ONLY_REASON_IDS: IssueOrderReasonId[] = ['op_stock', 'op_lens', 'op_damage', 'op_parts'];
  const DEFAULT_OPS_REASON_ID: IssueOrderReasonId = 'op_stock';
  const opsReasonGroups = ISSUE_REASON_GROUPS.map((group) => ({
    ...group,
    options: group.options.filter((opt) => OPS_ONLY_REASON_IDS.includes(opt.id)),
  })).filter((group) => group.options.length > 0);

  const formId = useId();
  const radioName = `ops-hold-reason-${formId}`;
  const [reasonId, setReasonId] = useState<IssueOrderReasonId>(DEFAULT_OPS_REASON_ID);
  const [otherText, setOtherText] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setReasonId(DEFAULT_OPS_REASON_ID);
    setOtherText('');
    setError(null);
  }, [open]);

  const handleSubmit = () => {
    const built = buildIssueOrderReasonPayload(reasonId, otherText);
    if (!built.ok) {
      setError(built.message);
      return;
    }
    setError(null);
    onConfirm(built.reason);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !loading && onOpenChange(v)}>
      <DialogContent
        showCloseButton={!loading}
        className="sm:max-w-xl max-h-[min(90vh,720px)] flex flex-col gap-0 p-0 overflow-hidden"
      >
        <div className="p-6 pb-0 shrink-0">
          <DialogHeader>
            <DialogTitle className="text-left text-slate-900">Báo lỗi — tạm giữ đơn</DialogTitle>
            <DialogDescription className="text-left text-slate-600">
              Chọn lý do báo cáo. Đơn sẽ chuyển sang trạng thái{' '}
              <span className="font-semibold text-slate-800">Tạm giữ (ON_HOLD)</span> để xử lý trước khi
              tiếp tục.
              {orderSubtitle ? (
                <span className="mt-2 block text-xs font-medium text-slate-500 break-words font-normal">
                  {orderSubtitle}
                </span>
              ) : null}
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="px-6 py-4 overflow-y-auto flex-1 min-h-0 space-y-5 border-y border-slate-100 bg-slate-50/40">
          {opsReasonGroups.map((group) => (
            <div key={group.title}>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2.5">{group.title}</p>
              <div className="space-y-2">
                {group.options.map((opt) => (
                  <label
                    key={opt.id}
                    className={cn(
                      'flex gap-3 cursor-pointer rounded-xl border px-3 py-2.5 transition-colors',
                      reasonId === opt.id
                        ? 'border-amber-300 bg-amber-50/80'
                        : 'border-slate-200 bg-white hover:bg-slate-50',
                      loading && 'pointer-events-none opacity-60',
                    )}
                  >
                    <input
                      type="radio"
                      name={radioName}
                      checked={reasonId === opt.id}
                      onChange={() => {
                        setReasonId(opt.id);
                        setError(null);
                      }}
                      className="mt-0.5 h-4 w-4 shrink-0 accent-amber-600"
                    />
                    <span className="text-sm text-slate-800 leading-snug">{opt.label}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}

          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2.5">Khác</p>
            <label
              className={cn(
                'flex gap-3 cursor-pointer rounded-xl border px-3 py-2.5 transition-colors',
                reasonId === 'other'
                  ? 'border-amber-300 bg-amber-50/80'
                  : 'border-slate-200 bg-white hover:bg-slate-50',
                loading && 'pointer-events-none opacity-60',
              )}
            >
              <input
                type="radio"
                name={radioName}
                checked={reasonId === 'other'}
                onChange={() => {
                  setReasonId('other');
                  setError(null);
                }}
                className="mt-0.5 h-4 w-4 shrink-0 accent-amber-600"
              />
              <span className="text-sm text-slate-800 leading-snug">Khác (tự điền lý do)</span>
            </label>
            {reasonId === 'other' && (
              <div className="mt-3 pl-1">
                <label htmlFor={`${formId}-ops-other`} className="text-xs font-semibold text-slate-600">
                  Nhập lý do
                </label>
                <textarea
                  id={`${formId}-ops-other`}
                  value={otherText}
                  onChange={(e) => {
                    setOtherText(e.target.value);
                    setError(null);
                  }}
                  disabled={loading}
                  rows={3}
                  maxLength={ISSUE_OTHER_MAX_LEN}
                  placeholder="Mô tả ngắn gọn…"
                  className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm placeholder:text-slate-400 focus:border-amber-400 focus:ring-2 focus:ring-amber-100 outline-none resize-y min-h-[88px] bg-white"
                />
                <p className="text-[10px] text-slate-400 mt-1 text-right tabular-nums">
                  {otherText.length}/{ISSUE_OTHER_MAX_LEN}
                </p>
              </div>
            )}
          </div>

          {error ? <p className="text-sm text-red-600 font-medium">{error}</p> : null}
        </div>

        <DialogFooter className="p-6 pt-4 shrink-0 bg-white flex-row justify-end gap-2 sm:gap-2 border-t border-slate-100">
          <button
            type="button"
            disabled={loading}
            onClick={() => onOpenChange(false)}
            className="px-4 py-2 rounded-lg bg-slate-100 text-slate-700 font-medium hover:bg-slate-200 disabled:opacity-50"
          >
            Đóng
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={handleSubmit}
            className="px-4 py-2 rounded-lg font-bold text-white bg-amber-700 hover:bg-amber-800 disabled:opacity-50"
          >
            {loading ? 'Đang xử lý…' : 'Xác nhận tạm giữ đơn'}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
