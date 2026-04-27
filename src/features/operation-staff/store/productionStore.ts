import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { toast } from 'sonner';
import { productionApi } from '@/features/operation-staff/api/production-api.ts';
import type { BEOrder, BEOrderItemStatus } from '@/features/operation-staff/types/types';

const errMsg = (e: unknown, fallback: string) => (e instanceof Error ? e.message : fallback);

interface ProductionStore {
  // State
  processingOrders: BEOrder[];
  loading: boolean;
  error: string | null;

  // Actions
  fetchProcessingOrders: () => Promise<void>;
  requestStock: (orderId: string) => Promise<void>;
  startOrder: (orderId: string) => Promise<void>;
  finishOrder: (orderId: string) => Promise<void>;
  readyToShip: (orderId: string) => Promise<void>;
  updateItemStatus: (orderItemId: string, status: string) => Promise<void>;
  startPackaging: (orderId: string) => Promise<void>;
  handoverToCarrier: (orderId: string, trackingNumber: string) => Promise<void>;
  startDelivery: (orderId: string) => Promise<void>;
  confirmDelivered: (orderId: string) => Promise<void>;
  clearError: () => void;
}

export const useProductionStore = create<ProductionStore>()(
  devtools(
    (set) => ({
      // Initial state
      processingOrders: [],
      loading: false,
      error: null,

      // Fetch processing orders
      fetchProcessingOrders: async () => {
        set({ loading: true, error: null });
        try {
          const response = await productionApi.getProcessingOrders();
          set({
            processingOrders: response,
            loading: false,
          });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to fetch orders',
            loading: false,
          });
        }
      },

      // Request stock for pre-order (PREORDER_CONFIRMED → STOCK_REQUESTED)
      requestStock: async (orderId: string) => {
        set({ loading: true, error: null });
        try {
          const updatedOrder = await productionApi.requestStock(orderId);
          set((state) => ({
            processingOrders: state.processingOrders.map((order) =>
              order.orderId === orderId ? updatedOrder : order,
            ),
            loading: false,
          }));
          toast.success('Đã yêu cầu nhập hàng. Trạng thái đơn đã cập nhật.');
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to request stock',
            loading: false,
          });
          toast.error(errMsg(error, 'Không thể yêu cầu nhập hàng.'));
          throw error;
        }
      },

      // Start order production
      startOrder: async (orderId: string) => {
        set({ loading: true, error: null });
        try {
          const response = await productionApi.startOrder(orderId);
          const updatedOrder = response;

          // Update local state with returned order
          set((state) => ({
            processingOrders: state.processingOrders.map((order) =>
              order.orderId === orderId ? updatedOrder : order,
            ),
            loading: false,
          }));
          toast.success('Đã bắt đầu sản xuất. Trạng thái đơn đã cập nhật.');
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to start order',
            loading: false,
          });
          toast.error(errMsg(error, 'Không thể bắt đầu sản xuất.'));
        }
      },

      // Finish order production
      finishOrder: async (orderId: string) => {
        set({ loading: true, error: null });
        try {
          const response = await productionApi.finishOrder(orderId);
          const updatedOrder = response;

          // Update local state with returned order
          set((state) => ({
            processingOrders: state.processingOrders.map((order) =>
              order.orderId === orderId ? updatedOrder : order,
            ),
            loading: false,
          }));
          toast.success('Đã hoàn thành công đoạn sản xuất. Trạng thái đã cập nhật.');
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to finish order',
            loading: false,
          });
          toast.error(errMsg(error, 'Không thể cập nhật sau sản xuất.'));
        }
      },

      // Move a finished order to ready-to-ship
      readyToShip: async (orderId: string) => {
        set({ loading: true, error: null });
        try {
          await productionApi.bulkReadyToShip([orderId]);

          set((state) => ({
            processingOrders: state.processingOrders.map((order) =>
              order.orderId === orderId ? { ...order, orderStatus: 'READY_TO_SHIP' } : order,
            ),
            loading: false,
          }));
          toast.success('Đã chuyển đơn sang sẵn sàng giao (READY_TO_SHIP).');
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to move order to ready-to-ship',
            loading: false,
          });
          toast.error(errMsg(error, 'Không thể chuyển đơn sang sẵn sàng giao.'));
          throw error;
        }
      },

      // Update item status
      updateItemStatus: async (orderItemId: string, status: string) => {
        set({ loading: true, error: null });
        try {
          await productionApi.updateItemStatus(orderItemId, status);

          set((state) => ({
            processingOrders: state.processingOrders.map((order) => ({
              ...order,
              items: order.items.map((item) =>
                item.orderItemId === orderItemId
                  ? { ...item, status: status as BEOrderItemStatus }
                  : item,
              ),
            })),
            loading: false,
          }));
          toast.success('Đã cập nhật trạng thái dòng sản phẩm.');
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to update item status',
            loading: false,
          });
          toast.error(errMsg(error, 'Không thể cập nhật trạng thái sản phẩm.'));
        }
      },

      // Start packaging
      startPackaging: async (orderId: string) => {
        set({ loading: true, error: null });
        try {
          const updatedOrder = await productionApi.startPackaging(orderId);

          set((state) => ({
            processingOrders: state.processingOrders.map((order) =>
              order.orderId === orderId ? updatedOrder : order,
            ),
            loading: false,
          }));
          toast.success('Đã bắt đầu đóng gói. Trạng thái đã cập nhật.');
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to start packaging',
            loading: false,
          });
          toast.error(errMsg(error, 'Không thể bắt đầu đóng gói.'));
        }
      },

      // Start delivery (mark order as DELIVERING)
      startDelivery: async (orderId: string) => {
        set({ loading: true, error: null });
        try {
          const updatedOrder = await productionApi.startDelivery(orderId);

          set((state) => ({
            processingOrders: state.processingOrders.map((order) =>
              order.orderId === orderId ? updatedOrder : order,
            ),
            loading: false,
          }));
          toast.success('Đã bắt đầu giao hàng. Trạng thái đã cập nhật.');
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to start delivery',
            loading: false,
          });
          toast.error(errMsg(error, 'Không thể cập nhật trạng thái giao hàng.'));
        }
      },

      // Confirm delivered (mark order as DELIVERED)
      confirmDelivered: async (orderId: string) => {
        set({ loading: true, error: null });
        try {
          const updatedOrder = await productionApi.confirmDelivered(orderId);

          set((state) => ({
            processingOrders: state.processingOrders.map((order) =>
              order.orderId === orderId ? updatedOrder : order,
            ),
            loading: false,
          }));
          toast.success('Đã xác nhận giao hàng thành công.');
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to confirm delivery',
            loading: false,
          });
          toast.error(errMsg(error, 'Không thể xác nhận giao hàng.'));
          throw error;
        }
      },

      // Handover to carrier with tracking number
      handoverToCarrier: async (orderId: string, trackingNumber: string) => {
        set({ loading: true, error: null });
        try {
          const updatedOrder = await productionApi.handoverToCarrier(orderId, trackingNumber);

          set((state) => ({
            processingOrders: state.processingOrders.map((order) =>
              order.orderId === orderId ? updatedOrder : order,
            ),
            loading: false,
          }));
          toast.success('Đã bàn giao cho đơn vị vận chuyển. Trạng thái đã cập nhật.');
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to handover to carrier',
            loading: false,
          });
          toast.error(errMsg(error, 'Không thể bàn giao cho đơn vị vận chuyển.'));
        }
      },

      // Clear error
      clearError: () => set({ error: null }),
    }),
    {
      name: 'production-store',
    },
  ),
);
