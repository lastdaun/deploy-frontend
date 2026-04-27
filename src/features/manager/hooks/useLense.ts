import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { lensApi } from '../api/lens-api';
import type { CreateLensRequest, LensProduct } from '../types/lens';
import { toast } from 'sonner';

export const useLenses = () => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['manager-lenses'],
    queryFn: lensApi.getAll,
    select: (data) => data.result,
    staleTime: 1000 * 60 * 5,
    retry: 2,
  });

  // 2. CREATE - Thêm mới sản phẩm
  const createMutation = useMutation({
    mutationFn: (payload: CreateLensRequest) => lensApi.create(payload),

    // Khi bắt đầu gửi request, hiện loading toast
    onMutate: () => {
      toast.loading('Đang gửi yêu cầu...', { id: 'lens-action' });
    },

    // Khi thành công
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['manager-lenses'] });
      toast.success('Thêm tròng kính mới thành công!', { id: 'lens-action' });
    },

    onError: () => {
      toast.error(`Lỗi: Không thể tạo sản phẩm`, { id: 'lens-action' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: CreateLensRequest }) =>
      lensApi.update(id, payload),
    onMutate: () => toast.loading('Đang cập nhật...', { id: 'lens-action' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['manager-lenses'] });
      toast.success('Cập nhật tròng kính thành công!', { id: 'lens-action' });
    },
    onError: () => toast.error('Lỗi: Không thể cập nhật sản phẩm', { id: 'lens-action' }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => lensApi.delete(id),
    onMutate: () => toast.loading('Đang xóa...', { id: 'lens-action' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['manager-lenses'] });
      toast.success('Xóa tròng kính thành công!', { id: 'lens-action' });
    },
    onError: () => toast.error('Lỗi: Không thể xóa sản phẩm', { id: 'lens-action' }),
  });

  return {
    lenses: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,

    createLens: createMutation.mutate,
    isCreating: createMutation.isPending,

    updateLens: (id: string, payload: CreateLensRequest, options?: Parameters<typeof updateMutation.mutate>[1]) =>
      updateMutation.mutate({ id, payload }, options),
    isUpdating: updateMutation.isPending,

    deleteLens: deleteMutation.mutate,
    isDeleting: deleteMutation.isPending,
  };
};
