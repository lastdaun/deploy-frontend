import { STATUS_CONFIG } from '@/features/manager/types/order-type';

export function orderStatusLabel(status: string): string {
  const k = (status || '').toUpperCase();
  return STATUS_CONFIG[k]?.label ?? status;
}

/** Viền + nền badge (bảng operation / shipper). */
export function orderStatusRowPillClassName(status: string): string {
  const k = (status || '').toUpperCase();
  const cfg = STATUS_CONFIG[k];
  if (!cfg) {
    return 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:border-slate-600';
  }
  const base = (cfg.className || `${cfg.bg} ${cfg.text}`).replace(/\bborder-none\b/g, '').trim();
  return `${base} border border-slate-200/90 dark:border-slate-600`;
}
