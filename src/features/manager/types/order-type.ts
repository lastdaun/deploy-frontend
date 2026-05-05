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
  productId: string | null; // Đã thêm dựa theo JSON mới
  productVariantId: string | null;
  itemName: string | null;
  productName: string | null;
  productImage: string | null;
  variantName: string | null;
  orderItemType: 'IN_STOCK' | 'PRE_ORDER' | 'PREORDER';
  quantity: number;
  unitPrice: number;
  lensId: string | null;
  lensName: string | null;
  lensPrice: number;
  lensPriceTotal: number;
  totalPrice: number;
  status: 'IN_PRODUCTION' | 'COMPLETED' | 'PENDING' | string | null;
  prescription: Prescription | null;
  /** Một số API trả ảnh đơn khám ở cấp dòng hàng thay vì lồng trong prescription */
  prescriptionImageUrl?: string | null;
}

export interface Payment {
  id: string;
  paymentMethod: string;
  paymentPurpose: string;
  amount: number;
  percentage: number | null;
  status: string;
  paymentDate: string | null;
  description: string | null;
  transactionReference: string | null;
}

export interface ShipperInfo {
  id: string;
  fullName: string | null;
  phone: string | null;
  email: string | null;
  imageUrl: string | null;
}

export interface BankInfo {
  bankName: string | null;
  bankAccountNumber: string | null;
  accountHolderName: string | null;
}

export interface Order {
  customerId: string;
  orderId: string;
  orderName: string | null;
  deliveryAddress: string;
  recipientName: string | null;
  phoneNumber: string;
  orderStatus:
    | 'PENDING'
    | 'PAID'
    | 'ON_HOLD'
    | 'CONFIRMED'
    | 'PREORDER_CONFIRMED'
    | 'STOCK_REQUESTED'
    | 'STOCK_READY'
    | 'PROCESSING'
    | 'IN_PRODUCTION'
    | 'PRODUCED'
    | 'READY_TO_SHIP'
    | 'DELIVERING'
    | 'DELIVERED'
    | 'COMPLETED'
    | 'SHIPPED'
    | 'CANCELLED';
  /** ISO từ API — sort FIFO cùng nhóm trạng thái */
  createdAt?: string;
  deliveredImageUrl?: string | null;
  /** Lý do hủy (khách/API) — khi có, hiển thị trong modal chi tiết */
  cancellationReason?: string | null;
  cancelledAt?: string | null;
  cancelledBy?: string | null;
  /** Lý do tạm giữ (vận hành) */
  operationalHoldReason?: string | null;
  statusBeforeHold?: string | null;
  totalAmount: number;
  depositAmount: number;
  remainingAmount: number | null;
  paidAmount: number;
  items: OrderItem[];
  payments: Payment[];
  shipperInfo: ShipperInfo | null;
  comboName: string | null;
  comboDiscountAmount: number | null;
  refundedAmount: number;
  finalTotalAfterRefund: number;
  bankInfo: BankInfo;
}

// Interface mới cho kết quả phân trang
export interface OrderPageResponse {
  items: Order[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

// Interface mới cho Query Parameters
export interface GetOrdersParams {
  status?: string;
  page?: number;
  size?: number;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
}

// features/manager/constants/order-status.ts

export interface StatusConfig {
  label: string;
  bg: string;
  text: string;
  dot: string;
  className?: string; // Thêm nếu bạn dùng shadcn
}

export const STATUS_CONFIG: Record<string, StatusConfig> = {
  PAID: {
    label: 'Đã thanh toán',
    bg: 'bg-emerald-100',
    text: 'text-emerald-700',
    dot: 'bg-emerald-500',
    className: 'bg-emerald-100 text-emerald-700 border-none',
  },
  PENDING: {
    label: 'Chờ xác nhận',
    bg: 'bg-amber-100',
    text: 'text-amber-700',
    dot: 'bg-amber-500',
    className: 'bg-amber-100 text-amber-700 hover:bg-amber-100 border-none',
  },
  AWAITING_VERIFICATION: {
    label: 'Chờ xác minh',
    bg: 'bg-orange-100',
    text: 'text-orange-700',
    dot: 'bg-orange-500',
    className: 'bg-orange-100 text-orange-700 border-none',
  },
  ON_HOLD: {
    label: 'Tạm giữ',
    bg: 'bg-slate-100',
    text: 'text-slate-600',
    dot: 'bg-slate-400',
    className: 'bg-slate-100 text-slate-600 border-none',
  },
  CONFIRMED: {
    label: 'Đã xác nhận',
    bg: 'bg-blue-100',
    text: 'text-blue-700',
    dot: 'bg-blue-500',
    className: 'bg-blue-100 text-blue-700 border-none',
  },
  PREORDER_CONFIRMED: {
    label: 'Đã xác nhận preorder',
    bg: 'bg-blue-100',
    text: 'text-blue-700',
    dot: 'bg-blue-500',
    className: 'bg-blue-100 text-blue-700 border-none',
  },
  STOCK_REQUESTED: {
    label: 'Đang xử lý đơn hàng',
    bg: 'bg-orange-100',
    text: 'text-orange-700',
    dot: 'bg-orange-500',
    className: 'bg-orange-100 text-orange-700 border-none',
  },
  PREPARING: {
    label: 'Đang xử lý đơn hàng',
    bg: 'bg-orange-100',
    text: 'text-orange-700',
    dot: 'bg-orange-500',
    className: 'bg-orange-100 text-orange-700 border-none',
  },
  PROCESSING: {
    label: 'Đang xử lý đơn hàng',
    bg: 'bg-orange-100',
    text: 'text-orange-700',
    dot: 'bg-orange-500',
    className: 'bg-orange-100 text-orange-700 border-none',
  },
  PRODUCED: {
    label: 'Đang xử lý đơn hàng',
    bg: 'bg-orange-100',
    text: 'text-orange-700',
    dot: 'bg-orange-500',
    className: 'bg-orange-100 text-orange-700 border-none',
  },
  STOCK_READY: {
    label: 'Đang xử lý đơn hàng',
    bg: 'bg-orange-100',
    text: 'text-orange-700',
    dot: 'bg-orange-500',
    className: 'bg-orange-100 text-orange-700 border-none',
  },
  IN_PRODUCTION: {
    label: 'Đang xử lý đơn hàng',
    bg: 'bg-orange-100',
    text: 'text-orange-700',
    dot: 'bg-orange-500',
    className: 'bg-orange-100 text-orange-700 border-none',
  },
  READY_TO_SHIP: {
    label: 'Sẵn sàng vận chuyển',
    bg: 'bg-cyan-100',
    text: 'text-cyan-700',
    dot: 'bg-cyan-500',
    className: 'bg-cyan-100 text-cyan-700 border-none',
  },
  SHIPPED: {
    label: 'Đang giao hàng',
    bg: 'bg-blue-100',
    text: 'text-blue-800',
    dot: 'bg-blue-600',
    className: 'bg-blue-100 text-blue-800 border-none',
  },
  DELIVERING: {
    label: 'Đang giao hàng',
    bg: 'bg-blue-100',
    text: 'text-blue-800',
    dot: 'bg-blue-600',
    className: 'bg-blue-100 text-blue-800 border-none',
  },
  PACKAGING: {
    label: 'Đang đóng gói',
    bg: 'bg-orange-100',
    text: 'text-orange-700',
    dot: 'bg-orange-500',
    className: 'bg-orange-100 text-orange-700 border-none',
  },
  HANDED_TO_CARRIER: {
    label: 'Đã bàn giao đơn vị vận chuyển',
    bg: 'bg-cyan-100',
    text: 'text-cyan-800',
    dot: 'bg-cyan-600',
    className: 'bg-cyan-100 text-cyan-800 border-none',
  },
  IN_PROGRESS: {
    label: 'Đang xử lý đơn hàng',
    bg: 'bg-orange-100',
    text: 'text-orange-700',
    dot: 'bg-orange-500',
    className: 'bg-orange-100 text-orange-700 border-none',
  },
  STOCK_RECEIVED: {
    label: 'Đã tiếp nhận hàng về kho',
    bg: 'bg-orange-100',
    text: 'text-orange-700',
    dot: 'bg-orange-500',
    className: 'bg-orange-100 text-orange-700 border-none',
  },
  DELIVERED: {
    label: 'Đã giao hàng',
    bg: 'bg-emerald-100',
    text: 'text-emerald-800',
    dot: 'bg-emerald-600',
    className: 'bg-emerald-100 text-emerald-800 border-none',
  },
  COMPLETED: {
    label: 'Đã hoàn tất',
    bg: 'bg-teal-100',
    text: 'text-teal-800',
    dot: 'bg-teal-600',
    className: 'bg-teal-100 text-teal-800 border-none',
  },
  CANCELLED: {
    label: 'Đã hủy',
    bg: 'bg-red-100',
    text: 'text-red-700',
    dot: 'bg-red-500',
    className: 'bg-red-100 text-red-700 border-none',
  },
  REFUNDED: {
    label: 'Đã hoàn tiền',
    bg: 'bg-pink-100',
    text: 'text-pink-700',
    dot: 'bg-pink-500',
    className: 'bg-pink-100 text-pink-700 border-none',
  },
};

export const MAIN_TABS = [
  'ALL',
  'PENDING',
  'PAID',
  'CONFIRMED',
  'PREORDER_CONFIRMED',
  'STOCK_REQUESTED',
  'STOCK_READY',
  'IN_PRODUCTION',
  'READY_TO_SHIP',
  'DELIVERING',
  'PROCESSING',
  'SHIPPED',
  'CANCELLED',
];
