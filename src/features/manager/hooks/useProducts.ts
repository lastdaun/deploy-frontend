// src/features/products/hooks/useProducts.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productApi } from '../../manager/api/product-api';
import type { ProductQueryParams } from '../../manager/types/types';
import { notifyError, notifySuccess } from '@/lib/notifyError';

// Key để quản lý cache
const QUERY_KEYS = {
  all: ['products'] as const,
  list: (params: ProductQueryParams) => [...QUERY_KEYS.all, 'list', params] as const,
};

// --- Hook 1: Lấy danh sách ---
export const useProducts = () => {
  return useQuery({
    queryKey: QUERY_KEYS.all,
    queryFn: async () => {
      const data = await productApi.getAll();
      return (data.result || []) as any[]; // Cast để tránh lỗi never[]
    },
    staleTime: 1000 * 60 * 5,
  });
};
// --- Hook 2: Tạo sản phẩm ---
export const useCreateProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    // Sửa type files thành File[]
    mutationFn: (payload: { productData: any; files: File[]; modelFile: File | null }) =>
      productApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.all });
      notifySuccess('Đã tạo sản phẩm.');
    },
    onError: (error) => {
      notifyError(error, 'Không thể tạo sản phẩm.');
    },
  });
};

// --- Hook 3: Cập nhật sản phẩm ---
export const useUpdateProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      // SỬA CHỖ NÀY: Đổi 'file?: File | null' thành 'files?: File[]'
      payload: { productData: any; files?: File[]; modelFile?: File | null };
    }) => productApi.update(id, payload), // Thêm `as any` nếu hàm update ở api chưa nhận `files`
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.all });
      notifySuccess('Đã cập nhật sản phẩm.');
    },
    onError: (error) => {
      notifyError(error, 'Không thể cập nhật sản phẩm.');
    },
  });
};

// --- Hook 4: Xóa sản phẩm ---
export const useDeleteProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => productApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.all });
      notifySuccess('Đã xóa sản phẩm.');
    },
    onError: (error) => {
      notifyError(error, 'Không thể xóa sản phẩm.');
    },
  });
};

export const useFilteredProducts = (params: ProductQueryParams) => {
  return useQuery({
    // QueryKey bao gồm params để tự động refetch khi params (page, size...) thay đổi
    queryKey: QUERY_KEYS.list(params),
    queryFn: () => productApi.getFiltered(params),
    // Giữ lại dữ liệu cũ trong khi fetch dữ liệu mới (giúp UI không bị giật/blank)
    placeholderData: (previousData) => previousData,
    staleTime: 1000 * 60 * 5, // 5 phút
  });
};
