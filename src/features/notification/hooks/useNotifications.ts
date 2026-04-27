import { api } from '@/lib/axios';
import type { BaseResponse } from '@/types/base-response';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/features/auth/stores/useAuthStore';
import type { NotificationItem } from '../types';

export const notificationsMeKey = (userId: string) => ['notifications', 'me', userId] as const;
export const notificationsUnreadKey = (userId: string) =>
  ['notifications', 'unread-count', userId] as const;

export const useNotifications = () => {
  const queryClient = useQueryClient();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const token = useAuthStore((s) => s.token);
  const userId = useAuthStore((s) => s.user?.id) ?? '';
  // Phân tách cache theo user; '_pending' khi rehydrate zustand chưa gán id (vẫn cần gọi API theo JWT)
  const queryUserKey = userId || '_pending';

  // 1. Lấy danh sách thông báo
  const notificationsQuery = useQuery({
    queryKey: notificationsMeKey(queryUserKey),
    queryFn: async () => {
      const { data } = await api.get<BaseResponse<NotificationItem[]>>('/notifications/me');
      return data?.result ?? [];
    },
    enabled: isAuthenticated && Boolean(token),
    staleTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
  });

  // 2. Lấy số lượng chưa đọc
  const unreadCountQuery = useQuery({
    queryKey: notificationsUnreadKey(queryUserKey),
    queryFn: async () => {
      const { data } = await api.get<BaseResponse<{ unreadCount: number }>>(
        '/notifications/me/unread-count',
      );
      return data?.result?.unreadCount ?? 0;
    },
    enabled: isAuthenticated && Boolean(token),
    staleTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
  });

  // 3. Mutation: Đánh dấu đã đọc tất cả
  const readAllMutation = useMutation({
    mutationFn: () => api.patch('/notifications/me/read-all'),
    onMutate: async () => {
      // 🌟 Lạc quan: Đánh dấu tất cả là đã đọc ngay lập tức
      await queryClient.cancelQueries({ queryKey: ['notifications'] });

      queryClient.setQueryData(
        notificationsMeKey(queryUserKey),
        (oldData: NotificationItem[] | undefined) => {
          if (!oldData) return [];
          return oldData.map((item) => ({ ...item, isRead: true, read: true }));
        },
      );
      queryClient.setQueryData(notificationsUnreadKey(queryUserKey), 0);
    },
    onSettled: () => {
      // Đảm bảo sync lại với server cho chắc ăn
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  // 4. Mutation: Đánh dấu đã đọc MỘT tin nhắn cụ thể (Đã thêm Optimistic Update)
  const readSingleMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/notifications/${id}/read`),

    // 🌟 onMutate chạy ngay lập tức khi bạn gọi readSingle(id), KHÔNG CHỜ API
    onMutate: async (clickedId: string) => {
      // Dừng mọi request fetch data đang dở dang để tránh nó ghi đè lên data mình sắp sửa
      await queryClient.cancelQueries({ queryKey: ['notifications'] });

      // Lưu lại data cũ để phòng hờ gọi API lỗi thì Rollback (khôi phục)
      const previousNotifications = queryClient.getQueryData<NotificationItem[]>(
        notificationsMeKey(queryUserKey),
      );
      const previousUnreadCount = queryClient.getQueryData<number>(notificationsUnreadKey(queryUserKey));

      // 🌟 SỬA CACHE LUÔN VÀ NGAY
      // 1. Cập nhật danh sách: Tìm đúng thằng đang click và cho read = true
      queryClient.setQueryData(
        notificationsMeKey(queryUserKey),
        (oldData: NotificationItem[] | undefined) => {
          if (!oldData) return [];
          return oldData.map((item) =>
            item.id === clickedId ? { ...item, isRead: true, read: true } : item,
          );
        },
      );

      // 2. Cập nhật số đếm: Trừ đi 1
      queryClient.setQueryData(notificationsUnreadKey(queryUserKey), (old: number | undefined) => {
        return Math.max(0, (old ?? 0) - 1);
      });

      // Trả về data cũ để nhỡ lỗi thì đưa xuống hàm onError xài
      return { previousNotifications, previousUnreadCount };
    },

    // 🌟 Nếu lỡ rớt mạng hoặc Backend văng lỗi -> Trả lại trạng thái cũ cho user
    onError: (_err, _newTodo, context) => {
      if (context?.previousNotifications) {
        queryClient.setQueryData(notificationsMeKey(queryUserKey), context.previousNotifications);
      }
      if (context?.previousUnreadCount !== undefined) {
        queryClient.setQueryData(notificationsUnreadKey(queryUserKey), context.previousUnreadCount);
      }
    },

    // 🌟 Chạy xong hết (dù thành công hay lỗi) thì vẫn gọi fetch nhẹ lại một phát để chốt data với server
    onSettled: () => {
      // UI không bị giật vì data trong Cache đã đúng rồi, nó chỉ chạy ngầm thôi
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const refetch = () => {
    void notificationsQuery.refetch();
    void unreadCountQuery.refetch();
  };

  return {
    notifications: notificationsQuery.data ?? [],
    unreadCount: unreadCountQuery.data ?? 0,
    isLoading: notificationsQuery.isLoading || unreadCountQuery.isLoading,
    isError: notificationsQuery.isError || unreadCountQuery.isError,
    refetch,
    readAll: readAllMutation.mutate,
    readSingle: readSingleMutation.mutate,
  };
};
