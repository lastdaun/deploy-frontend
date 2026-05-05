import { useEffect, useState } from 'react';
import { useAuthStore } from '@/features/auth/stores/useAuthStore';

/** Tránh gọi API có JWT trước khi persist auth load xong từ localStorage. */
export function useAuthHydrated(): boolean {
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
