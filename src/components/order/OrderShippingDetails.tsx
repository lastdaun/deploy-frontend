import type { LucideIcon } from 'lucide-react';
import { User, Phone, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';

function displayOrDash(value: string | null | undefined): string {
  const s = value != null ? String(value).trim() : '';
  return s !== '' ? s : '—';
}

function DetailRow({
  icon: Icon,
  label,
  value,
  href,
  valueClassName,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  href?: string;
  valueClassName?: string;
}) {
  const body =
    href && value !== '—' ? (
      <a
        href={href}
        className={cn(
          'font-medium text-slate-800 dark:text-slate-100 hover:underline break-all',
          valueClassName,
        )}
      >
        {value}
      </a>
    ) : (
      <p
        className={cn(
          'font-medium text-slate-800 dark:text-slate-100 leading-relaxed whitespace-pre-wrap break-words',
          valueClassName,
        )}
      >
        {value}
      </p>
    );

  return (
    <div className="flex gap-3">
      <Icon className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" aria-hidden />
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400 mb-0.5">{label}</p>
        {body}
      </div>
    </div>
  );
}

export type OrderShippingDetailsProps = {
  recipientName?: string | null;
  phoneNumber?: string | null;
  deliveryAddress?: string | null;
  className?: string;
  valueClassName?: string;
};

/** Họ tên, SĐT, địa chỉ giao — dùng chung modal/ drawer/ profile. */
export function OrderShippingDetails({
  recipientName,
  phoneNumber,
  deliveryAddress,
  className,
  valueClassName,
}: OrderShippingDetailsProps) {
  const name = displayOrDash(recipientName);
  const phone = displayOrDash(phoneNumber);
  const telHref = phone !== '—' ? `tel:${phone.replace(/\s/g, '')}` : undefined;
  const address = displayOrDash(deliveryAddress);

  return (
    <div className={cn('space-y-3', className)}>
      <DetailRow icon={User} label="Họ tên nhận hàng" value={name} valueClassName={valueClassName} />
      <DetailRow icon={Phone} label="Số điện thoại" value={phone} href={telHref} valueClassName={valueClassName} />
      <DetailRow
        icon={MapPin}
        label="Địa chỉ giao hàng"
        value={address}
        valueClassName={valueClassName}
      />
    </div>
  );
}
