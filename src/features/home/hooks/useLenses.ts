import { useQuery } from '@tanstack/react-query';
import { productApi } from '../api/product-api';
import type { LensProduct } from '../types/product-type';

export const useLenses = () => {
  const query = useQuery({
    queryKey: ['storefront-lenses'],
    queryFn: productApi.getLenses,
    staleTime: 5 * 60 * 1000,
    select: (data): LensProduct[] => {
      if (Array.isArray(data)) return data;
      // fallback nếu cache trả về full API response object
      const anyData = data as unknown as { result?: LensProduct[] };
      return anyData?.result ?? [];
    },
  });

  return {
    lenses: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
};
