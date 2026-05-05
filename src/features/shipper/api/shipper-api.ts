import { api } from '@/lib/axios';
import type { BEOrder } from '@/features/operation-staff/types/types';

export const shipperApi = {
  getReadyToShipOrders: async (): Promise<BEOrder[]> => {
    const response = await api.get('/management/orders', {
      params: {
        status: 'READY_TO_SHIP',
        size: 10000,
      },
    });

    return response.data.result?.items || response.data.result?.content || [];
  },

  acceptOrders: async (orderIds: string[]): Promise<void> => {
    await Promise.all(orderIds.map((orderId) => shipperApi.startDelivery(orderId)));
  },

  getMyAcceptedOrders: async (): Promise<BEOrder[]> => {
    const [deliveringRes, deliveredRes, completedRes] = await Promise.all([
      api.get('/management/orders', { params: { status: 'DELIVERING', size: 10000 } }),
      api.get('/management/orders', { params: { status: 'DELIVERED', size: 10000 } }),
      api.get('/management/orders', { params: { status: 'COMPLETED', size: 10000 } }),
    ]);

    const delivering: BEOrder[] = deliveringRes.data.result?.items || deliveringRes.data.result?.content || [];
    const delivered: BEOrder[] = deliveredRes.data.result?.items || deliveredRes.data.result?.content || [];
    const completed: BEOrder[] = completedRes.data.result?.items || completedRes.data.result?.content || [];
    return [...delivering, ...delivered, ...completed];
  },

  startDelivery: async (orderId: string): Promise<void> => {
    await api.patch(`/management/orders/${orderId}/start-delivery`);
  },

  /**
   * Xác nhận đã giao — gửi kèm một ảnh minh chứng (multipart, part name `image`).
   */
  confirmDelivered: async (orderId: string, deliveryProof: File): Promise<void> => {
    const formData = new FormData();
    formData.append('image', deliveryProof);
    await api.patch(`/management/orders/${orderId}/confirm-delivered`, formData);
  },
};
