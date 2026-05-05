import { useNavigate } from 'react-router-dom';
import {
  DollarSign,
  Percent,
  ShoppingCart,
  CalendarClock,
  ArrowDownRight,
  ArrowUpRight,
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export type WorkspaceKpiStats = {
  revenue: number;
  revenueGrowth: number;
  activeOrders: number;
  ordersToday: number;
};

type WorkspaceOverviewKpisProps = {
  stats: WorkspaceKpiStats;
  /** Đường dẫn khi nhấp vào thẻ đơn đang xử lý (vd. `/manager/orders`) */
  ordersHref?: string;
  className?: string;
};

const vnd = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
});

function formatMoMPercent(value: number): { text: string; positive: boolean | null } {
  if (!Number.isFinite(value)) {
    return { text: '—', positive: null };
  }
  const rounded = Math.round(value * 10) / 10;
  const sign = rounded > 0 ? '+' : '';
  return { text: `${sign}${rounded.toFixed(1)}%`, positive: rounded >= 0 };
}

export function WorkspaceOverviewKpis({
  stats,
  ordersHref = '/manager/orders',
  className,
}: WorkspaceOverviewKpisProps) {
  const navigate = useNavigate();
  const { text: growthText, positive: growthPositive } = formatMoMPercent(stats.revenueGrowth);

  return (
    <div className={cn('grid gap-4 sm:gap-6 sm:grid-cols-2 xl:grid-cols-4', className)}>
      <Card className="border-none shadow-md bg-white overflow-hidden relative ring-1 ring-black/[0.04] hover:ring-primary/15 transition-all">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            Doanh thu
          </CardTitle>
          <div className="h-10 w-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
            <DollarSign className="h-5 w-5" aria-hidden />
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-2xl sm:text-[1.65rem] font-bold tracking-tight tabular-nums">
            {vnd.format(stats.revenue)}
          </p>
        </CardContent>
      </Card>

      <Card className="border-none shadow-md bg-white overflow-hidden relative ring-1 ring-black/[0.04] hover:ring-primary/15 transition-all">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            Tăng trưởng doanh thu
          </CardTitle>
          <div className="h-10 w-10 bg-violet-50 rounded-xl flex items-center justify-center text-violet-600">
            <Percent className="h-5 w-5" aria-hidden />
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-2xl sm:text-[1.65rem] font-bold tracking-tight tabular-nums">
              {growthText}
            </span>
            {growthPositive !== null && (
              <Badge
                variant={growthPositive ? 'default' : 'destructive'}
                className={cn(
                  'rounded-md gap-1 font-normal',
                  growthPositive && 'bg-emerald-600 hover:bg-emerald-600/90',
                )}
              >
                {growthPositive ? (
                  <ArrowUpRight className="h-3.5 w-3.5 shrink-0" aria-hidden />
                ) : (
                  <ArrowDownRight className="h-3.5 w-3.5 shrink-0" aria-hidden />
                )}
                So với tháng trước
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      <Card
        role={ordersHref ? 'button' : undefined}
        tabIndex={ordersHref ? 0 : undefined}
        className={cn(
          'border-none shadow-md bg-white ring-1 ring-black/[0.04] hover:ring-primary/20 transition-all',
          ordersHref && 'cursor-pointer hover:shadow-lg',
        )}
        onClick={() => ordersHref && navigate(ordersHref)}
        onKeyDown={(e) => {
          if (!ordersHref) return;
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            navigate(ordersHref);
          }
        }}
      >
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            Đơn đang xử lý
          </CardTitle>
          <div className="h-10 w-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
            <ShoppingCart className="h-5 w-5" aria-hidden />
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-2xl sm:text-[1.65rem] font-bold tracking-tight tabular-nums">
            {stats.activeOrders}
          </p>
        </CardContent>
      </Card>

      <Card className="border-none shadow-md bg-white ring-1 ring-black/[0.04] hover:ring-primary/15 transition-all">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            Đơn hàng hôm nay
          </CardTitle>
          <div className="h-10 w-10 bg-amber-50 rounded-xl flex items-center justify-center text-amber-700">
            <CalendarClock className="h-5 w-5" aria-hidden />
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-2xl sm:text-[1.65rem] font-bold tracking-tight tabular-nums">
            {stats.ordersToday}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
