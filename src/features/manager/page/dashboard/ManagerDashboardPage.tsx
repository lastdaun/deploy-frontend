import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  Package,
  ArrowRight,
  ShoppingCart,
  Activity,
} from 'lucide-react';

import { WorkspaceOverviewKpis } from '@/components/dashboard/WorkspaceOverviewKpis';
import { useDashboardRevenue } from '../../hooks/useDashboard';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

export default function ManagerDashboardPage() {
  const navigate = useNavigate();
  const { data: stats, isLoading, isError, refetch } = useDashboardRevenue();

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto">
        <div className="flex justify-between items-center">
          <Skeleton className="h-10 w-[200px]" />
          <Skeleton className="h-10 w-[100px]" />
        </div>
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-[140px] rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-40 rounded-xl" />
          <Skeleton className="h-40 rounded-xl" />
        </div>
      </div>
    );
  }

  if (isError || !stats) {
    return (
      <div className="flex h-[70vh] flex-col items-center justify-center gap-4 text-center">
        <div className="bg-destructive/10 p-4 rounded-full text-destructive">
          <AlertTriangle size={48} />
        </div>
        <h2 className="text-xl font-bold uppercase tracking-tight">Lỗi tải dữ liệu</h2>
        <p className="text-muted-foreground max-w-sm">
          Hệ thống không thể kết nối tới máy chủ. Vui lòng thử lại sau.
        </p>
        <Button onClick={() => refetch()} variant="outline">
          Thử lại ngay
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight flex items-center gap-2">
            <Activity className="h-8 w-8 text-primary" /> Tổng quan quản lý
          </h1>
          <p className="text-muted-foreground mt-1">Doanh thu, đơn hàng và cảnh báo vận hành.</p>
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <button
          type="button"
          onClick={() => navigate('/manager/products')}
          className="group relative bg-slate-900 rounded-[2.5rem] p-10 text-white text-left cursor-pointer overflow-hidden shadow-2xl transition-all hover:-translate-y-1 hover:shadow-primary/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        >
          <div className="relative z-10 flex flex-col h-full justify-between gap-6">
            <div>
              <h2 className="text-3xl font-black italic mb-3">Kho hàng &amp; lens</h2>
              <p className="text-slate-400 max-w-xs leading-relaxed">
                Danh mục gọng, tròng kính và tồn kho.
              </p>
            </div>
            <span className="inline-flex items-center gap-3 font-bold group-hover:text-primary transition-colors">
              Đến quản trị sản phẩm
              <ArrowRight
                size={20}
                className="group-hover:translate-x-3 transition-transform duration-300"
              />
            </span>
          </div>
          <Package
            size={180}
            className="absolute -bottom-10 -right-10 text-white/5 rotate-12 group-hover:scale-110 transition-transform duration-500 pointer-events-none"
            aria-hidden
          />
        </button>

        <button
          type="button"
          onClick={() => navigate('/manager/orders')}
          className="group relative bg-indigo-600 rounded-[2.5rem] p-10 text-white text-left cursor-pointer overflow-hidden shadow-2xl transition-all hover:-translate-y-1 hover:shadow-indigo-300/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2"
        >
          <div className="relative z-10 flex flex-col h-full justify-between gap-6">
            <div>
              <h2 className="text-3xl font-black italic mb-3">Đơn hàng</h2>
              <p className="text-indigo-100 max-w-xs leading-relaxed">
                Theo dõi trạng thái và xử lý đơn.
              </p>
            </div>
            <span className="inline-flex items-center gap-3 font-bold group-hover:text-black transition-colors">
              Mở danh sách đơn
              <ArrowRight
                size={20}
                className="group-hover:translate-x-3 transition-transform duration-300"
              />
            </span>
          </div>
          <ShoppingCart
            size={180}
            className="absolute -bottom-10 -right-10 text-white/10 -rotate-12 group-hover:scale-110 transition-transform duration-500 pointer-events-none"
            aria-hidden
          />
        </button>
      </div>
    </div>
  );
}
