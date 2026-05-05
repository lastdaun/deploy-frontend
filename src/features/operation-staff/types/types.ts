export type OrderStatus =
  | 'waiting_cutting'
  | 'waiting_packaging'
  | 'shipping'
  | 'completed'
  | 'PROCESSING'
  | 'PRODUCED'
  | 'PENDING';
export type PaymentStatus = 'full_payment' | 'unpaid';
export type PriorityLevel = 'high' | 'medium' | 'low';

export interface KPIData {
  id: string;
  title: string;
  value: number;
  unit: string;
  percentage: number;
  variant: 'neutral' | 'critical' | 'success';
  icon: string;
  description?: string;
}

export interface Order {
  id: string;
  orderCode: string;
  customerName: string;
  sla: string;
  slaHours: number;
  priority: PriorityLevel;
  productName: string;
  productType: string;
  productFeatures: string;
  productIcon: string;
  paymentStatus: PaymentStatus;
  status: OrderStatus;
  isActionable: boolean;
}

export interface TabItem {
  id: string;
  label: string;
  count?: number;
  isActive: boolean;
}

export interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  startIndex: number;
  endIndex: number;
}

export interface PickingItem {
  id: string;
  type: 'frame' | 'lens';
  name: string;
  sku: string;
  quantity: number;
  location: string;
  locationType: 'shelf' | 'cabinet';
  imageUrl?: string;
}

export interface Prescription {
  od: {
    sphere: number;
    cylinder: number;
    axis: number;
    pd: number;
  };
  os: {
    sphere: number;
    cylinder: number;
    axis: number;
    pd: number;
  };
}

export interface SalesNote {
  id: string;
  type: 'warning' | 'info' | 'success';
  title: string;
  message: string;
  priority: 'high' | 'medium' | 'low';
}

export interface OrderDetail extends Order {
  receivedTime: string;
  pickingItems: PickingItem[];
  prescription: Prescription;
  salesNotes: SalesNote[];
  processingStatus: 'pending' | 'in_progress' | 'completed' | 'error';
}

export interface DrawerState {
  isOpen: boolean;
  selectedOrder: BEOrder | null;
}

export type BEOrderStatus =
  | 'PENDING'
  | 'PAID'
  | 'AWAITING_VERIFICATION'
  | 'ON_HOLD'
  | 'CONFIRMED'
  | 'PREORDER_CONFIRMED'
  | 'STOCK_REQUESTED'
  | 'STOCK_READY'
  | 'PREPARING'
  | 'PROCESSING'
  | 'IN_PRODUCTION'
  | 'PRODUCED'
  | 'PACKAGING'
  | 'HANDED_TO_CARRIER'
  | 'READY_TO_SHIP'
  | 'SHIPPED'
  | 'DELIVERING'
  | 'DELIVERED'
  | 'COMPLETED'
  | 'CANCELLED';
export type BEOrderItemType = 'IN_STOCK' | 'PRE_ORDER';
export type BEOrderItemStatus = 'IN_PRODUCTION' | 'PRODUCED';

export interface BEPrescription {
  id: string;
  imageUrl?: string | null;
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

export interface BEOrderItem {
  orderItemId: string;
  productVariantId: string;
  orderItemType: BEOrderItemType;
  quantity: number;
  unitPrice: number;
  lensId: string;
  lensName: string;
  lensPrice: number;
  lensPriceTotal: number;
  totalPrice: number;
  status: BEOrderItemStatus;
  prescription: BEPrescription | null;
  /** Khi ảnh nằm ở cấp dòng hàng thay vì lồng prescription */
  prescriptionImageUrl?: string | null;
  productName: string;
  productImage: string;
}

export interface BEOrder {
  customerId: string;
  orderId: string;
  /** ISO từ API (GET /management/orders sortBy=createdAt) — dùng sort FIFO trong cùng nhóm trạng thái */
  createdAt?: string;
  deliveryAddress: string;
  phoneNumber: string;
  paymentMethod?: string | null;
  orderStatus: BEOrderStatus;
  totalAmount: number;
  depositAmount: number;
  remainingAmount?: number | null;
  items: BEOrderItem[];
  comboName?: string;
  comboDiscountAmount?: number;
  orderName: string;
  recipientName: string;
  trackingNumber?: string;
  operationalHoldReason?: string | null;
  statusBeforeHold?: string | null;
}
