import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  LogOut,
  ChevronLeft,
  ChevronRight,
  // Truck
} from 'lucide-react';
import { cn } from '@/lib/utils';
// Đưa Logo về component dùng chung để dễ quản lý, nếu bạn bắt buộc dùng Logo riêng thì đổi lại đường dẫn nhé
import Logo from '@/components/common/Logo';

// Import store để lấy thông tin user và xử lý logout
import { useAuthStore } from '@/features/auth/stores/useAuthStore';
import { useSidebar } from '../hooks/useSidebar';
import { UserAvatar } from '@/components/ui/UserAvatar';

const navigation = [
  { name: 'Tổng quan', href: '/shipper', icon: LayoutDashboard },
  // { name: "Đóng gói", href: "/shipper/shipping", icon: Truck },
];

export function Sidebar() {
  const { collapsed, toggleCollapsed } = useSidebar();
  const location = useLocation();
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
      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        {navigation.map((item) => {
          // Sửa lại isActive để vẫn highlight khi vào các trang con (ví dụ: /shipper/shipping/123)
          const isActive =
            location.pathname === item.href || location.pathname.startsWith(`${item.href}/`);
          return (
            <NavLink
              key={item.name}
              to={item.href}
              className={cn(
                'nav-item',
                isActive && 'nav-item-active',
                collapsed && 'justify-center px-2',
              )}
              title={collapsed ? item.name : undefined}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {!collapsed && <span>{item.name}</span>}
            </NavLink>
          );
        })}
      </nav>

      {/* User Section (Dynamic Data) */}
      <div className="p-3 border-t border-sidebar-border">
        <div className={cn('flex items-center gap-3', collapsed && 'justify-center')}>
          <UserAvatar size="sm" />

          {/* Tên và chức vụ */}
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-sidebar-foreground truncate">
                {user?.name || 'Nhân viên giao hàng'}
              </p>
              <p className="text-xs text-sidebar-muted truncate uppercase">
                {user?.role || 'SHIPPER'}
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
