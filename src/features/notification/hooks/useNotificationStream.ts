import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { fetchEventSource } from '@microsoft/fetch-event-source';
import { useAuthStore } from '@/features/auth/stores/useAuthStore';
import { notificationsMeKey, notificationsUnreadKey } from './useNotifications';
import type { NotificationItem } from '../types';

export const useNotificationStream = () => {
  const queryClient = useQueryClient();
  const token = useAuthStore((s) => s.token);
  const defaultApiUrl = 'https://ge-optimis-production.up.railway.app/optics';

  useEffect(() => {
    if (!token) return;

    // 2. Lấy Base URL từ biến môi trường
    const baseUrl = (import.meta.env.VITE_API_URL || defaultApiUrl).replace(/\/$/, '');

    // 3. Khởi tạo AbortController để quản lý việc đóng/mở kết nối
    const ctrl = new AbortController();

    // 4. Hàm kết nối SSE (dùng async/await)
    const connectStream = async () => {
      try {
        await fetchEventSource(`${baseUrl}/notifications/stream`, {
          method: 'GET',
          headers: {
            Accept: 'text/event-stream',
            Authorization: `Bearer ${token}`,
          },
          signal: ctrl.signal,

          onmessage(event) {
            if (!event.data) return;
            if (event.data === 'Notification SSE connected') return;
            if (event.event === 'connected') return;
            // Phải khớp chuỗi sự kiện backend: "notification" (mặc định SSE tên "message" nếu thiếu dòng event:)
            const ev = event.event ?? '';
            if (ev && ev !== 'notification' && ev !== 'message') return;

            try {
              const incoming: NotificationItem = JSON.parse(event.data);
              // Khóa cache phải trùng useNotifications: ưu tiên recipientId từ server (cùng CustomerId/Order),
              // tránh lệch với zustand khi rehydrate / _pending
              const cacheKey =
                incoming.recipientId ||
                useAuthStore.getState().user?.id ||
                '_pending';

              let isNewNotification = false;

              // Update cache: insert if new, update in-place if already exists (e.g. mark-as-read SSE)
              queryClient.setQueryData(
                notificationsMeKey(cacheKey),
                (oldData: NotificationItem[] | undefined) => {
                  if (!oldData) {
                    isNewNotification = true;
                    return [incoming];
                  }
                  const idx = oldData.findIndex((n) => n.id === incoming.id);
                  if (idx !== -1) {
                    const updated = [...oldData];
                    updated[idx] = incoming;
                    return updated;
                  }
                  isNewNotification = true;
                  return [incoming, ...oldData];
                },
              );

              // Only increment unread count when a genuinely new unread notification arrives
              if (isNewNotification && !incoming.isRead) {
                queryClient.setQueryData(
                  notificationsUnreadKey(cacheKey),
                  (old: number | undefined) => (old ?? 0) + 1,
                );
              }
            } catch (error) {
              console.error('Lỗi khi parse dữ liệu SSE:', error);
            }
          },

          onerror(error) {
            console.error('Lỗi kết nối SSE stream:', error);
            // Do NOT throw here — returning allows fetchEventSource to retry automatically.
            // Only stop for auth errors (401/403) to avoid infinite retries.
            const status = (error as { status?: number })?.status;
            if (status === 401 || status === 403) {
              throw error;
            }
          },
        });
      } catch (err) {
        console.error('Không thể khởi tạo luồng SSE:', err);
      }
    };

    connectStream();

    // Dọn dẹp: Hủy kết nối khi user chuyển trang, đăng xuất hoặc Component bị tháo gỡ
    return () => {
      ctrl.abort();
    };
  }, [queryClient, token]);
};
