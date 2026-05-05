import { api } from '@/lib/axios';
import type { BEOrder, BEOrderItem } from '@/features/operation-staff/types/types';

export const productionApi = {
  getProcessingOrders: async (): Promise<BEOrder[]> => {
    // 1. Gọi API với size siêu to khổng lồ (ví dụ: 10000)
    const response = await api.get('/management/orders', {
      params: {
        page: 0,
        size: 10000, // "Lùa" tối đa 10,000 đơn hàng về cùng lúc
        sortBy: 'createdAt',
        sortDir: 'desc', // Lấy đơn mới nhất lên đầu, đề phòng lố 10k đơn
      },
    });

    // 2. Bóc tách mảng đơn hàng từ response phân trang
    // Tùy theo cấu trúc backend, thường mảng data sẽ nằm trong .items hoặc .content
    // Mỗi phần tử nên có createdAt (string ISO) — OrdersSection sắp FIFO trong cùng trạng thái
    const allOrders = response.data.result.items || response.data.result.content || [];

    // 3. Filter thủ công trên Frontend
    // Include statuses that represent orders handed from Sales to Operation.
    // Some backends set the status to CONFIRMED or PREPARING immediately after sales verification,
    // so include them here to ensure operation staff can see newly-approved orders.
    const visibleStatuses = new Set([
      'CONFIRMED',
      'PREORDER_CONFIRMED',
      'STOCK_REQUESTED',
      'STOCK_READY',
      'PREPARING',
      'IN_PRODUCTION',
      'READY_TO_SHIP',
      'PROCESSING',
      'PRODUCED',
      'PACKAGING',
      'HANDED_TO_CARRIER',
      'ON_HOLD',
    ]);

    const filteredOrders = allOrders.filter((order: BEOrder) => visibleStatuses.has(order.orderStatus));

    return filteredOrders;
  },

  requestStock: async (orderId: string): Promise<BEOrder> => {
    const response = await api.put(`/operation/orders/${orderId}/request-stock`);
    return response.data.result;
  },

  startOrder: async (orderId: string): Promise<BEOrder> => {
    const response = await api.put(`/production/orders/${orderId}/start`);
    return response.data.result;
  },

  finishOrder: async (orderId: string): Promise<BEOrder> => {
    const response = await api.put(`/production/orders/${orderId}/finish`);
    return response.data.result;
  },

  reportOperationalHold: async (orderId: string, reason: string): Promise<BEOrder> => {
    const response = await api.put(
      `/production/orders/${orderId}/report-hold?reason=${encodeURIComponent(reason)}`,
    );
    return response.data.result;
  },

  resumeFromOperationalHold: async (orderId: string): Promise<BEOrder> => {
    const response = await api.put(`/management/orders/${orderId}/resume-from-hold`);
    return response.data.result;
  },

  updateItemStatus: async (orderItemId: string, status: string): Promise<BEOrderItem> => {
    const response = await api.put(
      `/production/orders/items/${orderItemId}/status?status=${status}`,
    );
    return response.data.result;
  },

  getReadyToShipOrders: async (): Promise<BEOrder[]> => {
    const response = await api.get('/management/orders?status=READY_TO_SHIP');
    return response.data.result?.items || response.data.result?.content || [];
  },

  getShippingOrders: async (): Promise<BEOrder[]> => {
    const response = await api.get('/management/orders', {
      params: { page: 0, size: 1000, sortBy: 'createdAt', sortDir: 'desc' },
    });
    const all = response.data.result?.items || response.data.result?.content || [];
    const shippingStatuses = new Set(['READY_TO_SHIP']);
    return all.filter((o: BEOrder) => shippingStatuses.has(o.orderStatus));
  },

  bulkReadyToShip: async (orderIds: string[]): Promise<void> => {
    const response = await api.put('/production/orders/ready-to-ship', {
      orderIds,
    });
    return response.data;
  },

  // Lưu ý: hiện tại OrdersWorkflowController BE không khai báo PUT .../packaging và .../handover — gọi sẽ 404 trừ khi bổ sung API. DrawerFooter cũng chưa gọi các handler tương ứng.
  startPackaging: async (orderId: string): Promise<BEOrder> => {
    const response = await api.put(`/production/orders/${orderId}/packaging`);
    return response.data.result;
  },

  handoverToCarrier: async (orderId: string, trackingNumber: string): Promise<BEOrder> => {
    const response = await api.put(`/production/orders/${orderId}/handover`, {
      trackingNumber,
    });
    return response.data.result;
  },

  // Start delivery (mark order as DELIVERING)
  startDelivery: async (orderId: string): Promise<BEOrder> => {
    const response = await api.patch(`/management/orders/${orderId}/start-delivery`);
    return response.data.result;
  },

  // Confirm delivered (mark order as DELIVERED)
  confirmDelivered: async (orderId: string): Promise<BEOrder> => {
    const response = await api.patch(`/management/orders/${orderId}/confirm-delivered`);
    return response.data.result;
  },
};
