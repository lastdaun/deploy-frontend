import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { useEffect, useState } from 'react';
import { profileApi } from '../api/api';
import { useAuthStore } from '@/features/auth/stores/useAuthStore';

export const PROFILE_QUERY_KEY = ['profile'] as const;

function useAuthHydrated(): boolean {
  const [ok, setOk] = useState(() => useAuthStore.persist.hasHydrated());
  useEffect(() => {
    if (useAuthStore.persist.hasHydrated()) {
      setOk(true);
      return;
    }
    return useAuthStore.persist.onFinishHydration(() => setOk(true));
  }, []);
  return ok;
}

export const useProfileQuery = () => {
  const authHydrated = useAuthHydrated();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const userId = useAuthStore((state) => state.user?.id);
  const token = useAuthStore((state) => state.token);

  const canFetch = authHydrated && isAuthenticated && Boolean(userId) && Boolean(token);

  return useQuery({
    queryKey: [...PROFILE_QUERY_KEY, userId ?? ''],
    queryFn: profileApi.getProfile,
    staleTime: 5 * 60 * 1000, // 5 phút
    // Không gọi /users/me trước khi rehydrate xong; không retry khi 401
    retry: (failureCount, err) => {
      if (axios.isAxiosError(err) && err.response?.status === 401) return false;
      return failureCount < 1;
    },
    enabled: canFetch,
  });
};
