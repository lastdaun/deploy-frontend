import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  LogOut,
  ChevronLeft,
  ChevronRight,
  PackageSearch,
  ShoppingBag,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSidebar } from '@/features/operation-staff/hooks/useSidebar';
// Đưa Logo về component dùng chung để dễ quản lý, nếu bạn bắt buộc dùng Logo riêng thì đổi lại đường dẫn nhé
import Logo from '@/components/common/Logo';

// Import store để lấy thông tin user và xử lý logout
import { useAuthStore } from '@/features/auth/stores/useAuthStore';
import { UserAvatar } from '@/components/ui/UserAvatar';

const mainNav = [
  { name: 'Tổng quan', href: '/ops-staff', icon: LayoutDashboard, end: true },
] as const;

/** Tách riêng preorder / đơn thường — hiển thị trong khối có nhãn để dễ nhìn */
const orderNav = [
  {
    name: 'Đơn đặt trước',
    shortTitle: 'Pre-order',
    href: '/ops-staff/orders/preorder',
    icon: PackageSearch,
    end: true,
  },
  {
    name: 'Đơn hàng thường',
    shortTitle: 'Đơn thường',
    href: '/ops-staff/orders/standard',
    icon: ShoppingBag,
    end: true,
  },
] as const;

export function Sidebar() {
  const { collapsed, toggleCollapsed } = useSidebar();
  const navigate = useNavigate();

  // Lấy user và hàm logout từ store
  const { user, logout } = useAuthStore();

  // Hàm xử lý đăng xuất
  const handleLogout = () => {
    logout();
    navigate('/auth/login');
  };


  return (
    <aside
      className={cn(
        'fixed left-0 top-0 h-full bg-sidebar border-r border-sidebar-border transition-all duration-300 z-50 flex flex-col',
        collapsed ? 'w-16' : 'w-64',
      )}
    >
      {/* Logo */}
      <div className="h-16 md:h-20 flex items-center justify-between px-4 border-sidebar-border">
        {!collapsed && <Logo />}
        <button
          onClick={toggleCollapsed}
          className={cn(
            'p-1.5 rounded-lg text-sidebar-muted hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors',
            collapsed && 'mx-auto',
          )}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 min-h-0 py-4 px-3 space-y-3 overflow-y-auto flex flex-col">
        {mainNav.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            end={item.end}
            className={({ isActive }) =>
              cn(
                'nav-item',
                isActive && 'nav-item-active',
                collapsed && 'justify-center px-2',
              )
            }
            title={collapsed ? item.name : undefined}
          >
            <item.icon className="w-5 h-5 flex-shrink-0" />
            {!collapsed && <span className="font-medium">{item.name}</span>}
          </NavLink>
        ))}

        {!collapsed && (
          <p className="px-3 pt-1 text-[10px] font-bold uppercase tracking-wider text-sidebar-muted">
            Phân loại đơn
          </p>
        )}

        {collapsed && <div className="border-t border-sidebar-border/70 mx-1" aria-hidden />}

        <div
          className={cn(
            'rounded-xl border border-sidebar-border bg-sidebar-accent/35 p-1.5 space-y-1',
            collapsed && 'border-0 bg-transparent p-0 space-y-1',
          )}
        >
          {orderNav.map((item) => (
            <NavLink
              key={item.href}
              to={item.href}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  'nav-item',
                  isActive && 'nav-item-active',
                  collapsed && 'justify-center px-2',
                  !collapsed &&
                    'shadow-sm border border-transparent hover:border-sidebar-border/80',
                  isActive && !collapsed && 'border-sidebar-primary/30',
                )
              }
              title={collapsed ? `${item.name} (${item.shortTitle})` : undefined}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {!collapsed && <span className="font-medium">{item.name}</span>}
            </NavLink>
          ))}
        </div>
      </nav>

      {/* User Section (Dynamic Data) */}
      <div className="p-3 border-t border-sidebar-border">
        <div className={cn('flex items-center gap-3', collapsed && 'justify-center')}>
          <UserAvatar size="sm" />

          {/* Tên và chức vụ */}
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-sidebar-foreground truncate">
                {user?.name || 'Nhân viên vận hành'}
              </p>
              <p className="text-xs text-sidebar-muted truncate uppercase">
                {user?.role || 'OPS STAFF'}
              </p>
            </div>
          )}

          {/* Nút Logout */}
          {!collapsed && (
            <button
              onClick={handleLogout}
              title="Đăng xuất"
              className="p-1.5 rounded-lg text-sidebar-muted hover:text-rose-600 hover:bg-rose-50 transition-colors shrink-0"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}
