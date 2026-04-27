// src/hooks/useMyOrders.ts
import { useQuery } from '@tanstack/react-query';
import type { UseMyOrdersProps } from '../types/order';
import { orderApi } from '../api/order-api';

export const useMyOrders = (params: UseMyOrdersProps = {}) => {
  return useQuery({
    queryKey: ['my-orders', params],
    queryFn: () => orderApi.getMyOrders(params),
    staleTime: 5 * 60 * 1000,
  });
};
