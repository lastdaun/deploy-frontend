import { api } from '@/lib/axios';
import type { ApiResponse } from '../types';
import type { Order, PaginatedResponse, UseMyOrdersProps } from '../types/order';

export const orderApi = {
  getMyOrders: async (params: UseMyOrdersProps = {}) => {
    const { page = 0, size = 10, sortBy = 'createdAt', sortDir = 'desc' } = params;

    const response = await api.get<ApiResponse<PaginatedResponse<Order>>>('/orders/me', {
      params: { page, size, sortBy, sortDir },
    });

    return response.data.result;
  },

  completeOrder: async (orderId: string) => {
    const response = await api.put<ApiResponse<unknown>>(`/orders/${orderId}/complete`);
    return response.data.result;
  },
};
