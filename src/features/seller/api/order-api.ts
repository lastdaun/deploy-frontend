import { api } from '@/lib/axios';

/* ====== TYPE ====== */
export interface Order {
  orderId: string;
  createdAt?: string;
  /** Tên/API hiển thị — UI dùng `formatOrderDisplayNameFromOrder`: ORDER|PREORDER - SP (+ Lens) - mã ngắn */
  orderName?: string | null;
  customerId: string;
  recipientName?: string | null;
  phoneNumber: string;
  deliveryAddress: string;
  /** Chi tiết từ management API — đủ các trạng thái */
  orderStatus: string;
  totalAmount: number;
  depositAmount: number;
  /** Còn nợ 0 = đã thanh toán đủ (preorder) */
  remainingAmount?: number | null;
  paidAmount?: number;
  items: OrderItem[];
}
export interface Prescription {
  id: string;
  imageUrl: string | null;
  odSphere: number;
  odCylinder: number;
  odAxis: number;
  odAdd: number;
  odPd: number;
  osSphere: number;
  osCylinder: number;
  osAxis: number;
  osAdd: number;
  osPd: number;
  note: string;
}
export interface OrderItem {
  orderItemId: string;
  productVariantId: string;
  orderItemType: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  prescription?: Prescription;
  prescriptionImageUrl?: string | null;
}
export interface PaginatedResponse<T> {
  items: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export const orderApi = {
  getAwaitingVerificationOrders: async (
    page: number = 0,
    size: number = 10,
  ): Promise<PaginatedResponse<Order>> => {
    // Truyền param vào URL
    const response = await api.get(
      `/management/orders?status=PAID&page=${page}&size=${size}&sortBy=createdAt&sortDir=desc`,
    );

    // Trả về TOÀN BỘ object chứa items, page, totalPages...
    return response.data.result;
  },
  getOrderDetail: async (orderId: string): Promise<Order> => {
    const res = await api.get(`/management/orders/${orderId}`);
    return res.data.result;
  },
  cancelOrder: async (orderId: string): Promise<void> => {
    await api.put(`/orders/${orderId}/cancel`);
  },
  rejectOrder: async (
    orderId: string,
    reason?: string,
  ): Promise<{ orderId: string; orderStatus: string }> => {
    const res = await api.put(
      `/sales/orders/${orderId}/reject${reason ? `?reason=${encodeURIComponent(reason)}` : ''}`,
    );
    return (res.data?.result ?? res.data?.Result) as { orderId: string; orderStatus: string };
  },
  verifyOrder: async (
    orderId: string,
    isApproved: boolean,
  ): Promise<{ orderId: string; orderStatus: string; preOrderStatus?: string | null }> => {
    const res = await api.put(`/sales/orders/${orderId}/verify?isApproved=${isApproved}`);
    return (res.data?.result ?? res.data?.Result) as {
      orderId: string;
      orderStatus: string;
      preOrderStatus?: string | null;
    };
  },

  /** Khôi phục đơn ON_HOLD về trạng thái workflow trước tạm giữ (operation tiếp tục xử lý). */
  resumeFromOperationalHold: async (orderId: string): Promise<unknown> => {
    const res = await api.put(`/management/orders/${orderId}/resume-from-hold`);
    return res.data?.result ?? res.data?.Result;
  },
};
