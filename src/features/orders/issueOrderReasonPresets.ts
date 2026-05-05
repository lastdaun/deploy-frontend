/** Preset chọn lý do — dùng chung cho sale (hủy) và vận hành (tạm giữ / báo lỗi). */

export const ISSUE_OTHER_MAX_LEN = 500;

export type IssueOrderReasonId =
  | 'cust_no_need'
  | 'cust_wrong'
  | 'op_stock'
  | 'op_lens'
  | 'op_damage'
  | 'op_parts'
  | 'other';

export type IssueReasonOption = { id: IssueOrderReasonId; label: string; apiPrefix: string };

export type IssueReasonGroup = { title: string; options: IssueReasonOption[] };

export const ISSUE_REASON_GROUPS: IssueReasonGroup[] = [
  {
    title: 'Theo yêu cầu khách hàng',
    options: [
      {
        id: 'cust_no_need',
        label: 'Khách không còn nhu cầu mua',
        apiPrefix: 'Theo yêu cầu khách hàng',
      },
      {
        id: 'cust_wrong',
        label: 'Đặt nhầm / sai sản phẩm / sai thông tin',
        apiPrefix: 'Theo yêu cầu khách hàng',
      },
    ],
  },
  {
    title: 'Không thể đáp ứng đơn hàng (từ Nhân Viên Vận Hành / kho)',
    options: [
      {
        id: 'op_stock',
        label: 'Không nhập được hàng',
        apiPrefix: 'Không thể đáp ứng đơn hàng (Nhân Viên Vận Hành / kho)',
      },
      {
        id: 'op_lens',
        label: 'Không gia công được tròng theo đơn kính',
        apiPrefix: 'Không thể đáp ứng đơn hàng (Nhân Viên Vận Hành / kho)',
      },
      {
        id: 'op_damage',
        label: 'Sản phẩm lỗi / hỏng trong quá trình xử lý',
        apiPrefix: 'Không thể đáp ứng đơn hàng (Nhân Viên Vận Hành / kho)',
      },
      {
        id: 'op_parts',
        label: 'Thiếu linh kiện / không đủ điều kiện hoàn tất đơn',
        apiPrefix: 'Không thể đáp ứng đơn hàng (Nhân Viên Vận Hành / kho)',
      },
    ],
  },
];

export const DEFAULT_ISSUE_REASON_ID: IssueOrderReasonId = 'cust_no_need';

function findIssueOptionMeta(id: IssueOrderReasonId): IssueReasonOption | null {
  for (const g of ISSUE_REASON_GROUPS) {
    const o = g.options.find((x) => x.id === id);
    if (o) return o;
  }
  return null;
}

export function buildIssueOrderReasonPayload(
  reasonId: IssueOrderReasonId,
  otherText: string,
): { ok: true; reason: string } | { ok: false; message: string } {
  if (reasonId === 'other') {
    const t = otherText.trim();
    if (!t) return { ok: false, message: 'Vui lòng nhập lý do khi chọn «Khác».' };
    if (t.length > ISSUE_OTHER_MAX_LEN)
      return { ok: false, message: `Lý do không dài quá ${ISSUE_OTHER_MAX_LEN} ký tự.` };
    return { ok: true, reason: `Khác — ${t}` };
  }
  const meta = findIssueOptionMeta(reasonId);
  if (!meta) return { ok: false, message: 'Lý do không hợp lệ.' };
  return { ok: true, reason: `${meta.apiPrefix} — ${meta.label}` };
}
