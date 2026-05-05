import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { useAuthHydrated } from '@/features/auth/hooks/useAuthHydrated';
import { useAuthStore } from '@/features/auth/stores/useAuthStore';
import { dashboardApi } from '../api/dashboard-api';

export const useDashboardRevenue = () => {
  const authHydrated = useAuthHydrated();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const token = useAuthStore((s) => s.token);
  const role = useAuthStore((s) => s.user?.role);

  const canFetch =
    authHydrated &&
    isAuthenticated &&
    Boolean(token) &&
    (role === 'admin' || role === 'manager');

  return useQuery({
    queryKey: ['dashboard', 'revenue'],
    queryFn: () => dashboardApi.getRevenue(),
    enabled: canFetch,
    // Luôn coi dữ liệu là cũ để mỗi lần vào dashboard / focus tab gọi lại API (tránh treo số cũ 5 phút).
    staleTime: 0,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    refetchInterval: 1000 * 60 * 10,
    retry: (failureCount, err) => {
      if (axios.isAxiosError(err) && err.response?.status === 401) return false;
      return failureCount < 2;
    },
  });
};
