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

    return response.data.result?.items || [];
  },

  acceptOrders: async (orderIds: string[]): Promise<void> => {
    await Promise.all(orderIds.map((orderId) => shipperApi.startDelivery(orderId)));
  },

  getMyAcceptedOrders: async (): Promise<BEOrder[]> => {
    const [deliveringRes, deliveredRes] = await Promise.all([
      api.get('/management/orders', { params: { status: 'DELIVERING', size: 10000 } }),
      api.get('/management/orders', { params: { status: 'DELIVERED', size: 10000 } }),
    ]);

    const delivering: BEOrder[] = deliveringRes.data.result?.items || [];
    const delivered: BEOrder[] = deliveredRes.data.result?.items || [];
    return [...delivering, ...delivered];
  },

  startDelivery: async (orderId: string): Promise<void> => {
    await api.patch(`/management/orders/${orderId}/start-delivery`);
  },

  /**
   * Xác nhận đã giao — gửi kèm ảnh minh chứng (multipart, part name `file`).
   * Backend cần nhận: PATCH multipart với @RequestParam("file") MultipartFile hoặc tương đương.
   */
  confirmDelivered: async (orderId: string, deliveryProof: File): Promise<void> => {
    const formData = new FormData();
    formData.append('file', deliveryProof);
    await api.patch(`/management/orders/${orderId}/confirm-delivered`, formData);
  },
};