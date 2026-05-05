import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Users,
} from 'lucide-react';
import { Link } from 'react-router-dom';

import { WorkspaceOverviewKpis } from '@/components/dashboard/WorkspaceOverviewKpis';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useDashboardRevenue } from '@/features/manager/hooks/useDashboard';

export default function AdminDashboardPage() {
  const { data: stats, isLoading, isError, refetch } = useDashboardRevenue();

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-300">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-[140px] rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (isError || !stats) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 text-center px-4">
        <div className="rounded-full bg-destructive/10 p-4 text-destructive">
          <AlertTriangle className="h-12 w-12" aria-hidden />
        </div>
        <h1 className="text-xl font-bold tracking-tight">Không tải được dashboard</h1>
        <p className="text-muted-foreground text-sm max-w-sm">
          Kiểm tra kết nối hoặc thử làm mới sau vài giây.
        </p>
        <Button variant="outline" onClick={() => refetch()}>
          Thử lại
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight flex items-center gap-2">
            <Activity className="h-8 w-8 text-primary shrink-0" aria-hidden />
            Tổng quan hệ thống
          </h1>
          <p className="text-muted-foreground mt-1 text-sm sm:text-base">
            Chỉ số doanh thu và đơn hàng dành cho quản trị viên.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button asChild className="rounded-full shadow-sm">
            <Link to="/admin/users" className="inline-flex items-center">
              <Users className="h-4 w-4 mr-2" />
              Quản lý người dùng
              <ArrowRight className="h-4 w-4 ml-1" />
            </Link>
          </Button>
        </div>
      </div>

      <WorkspaceOverviewKpis
        stats={{
          revenue: stats.revenue,
          revenueGrowth: stats.revenueGrowth,
          activeOrders: stats.activeOrders,
          ordersToday: stats.ordersToday,
        }}
        ordersHref="/manager/orders"
      />
    </div>
  );
}
