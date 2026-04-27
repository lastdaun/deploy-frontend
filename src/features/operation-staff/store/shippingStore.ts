import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { productionApi } from '@/features/operation-staff/api/production-api.ts';
import type { BEOrder } from '@/features/operation-staff/types/types';
import { notifyError, notifySuccess } from '@/lib/notifyError';

interface ShippingStore {
  // State
  readyToShipOrders: BEOrder[];
  allShippingOrders: BEOrder[];
  loading: boolean;
  error: string | null;

  // Actions
  fetchReadyToShipOrders: () => Promise<void>;
  fetchAllShippingOrders: () => Promise<void>;
  bulkReadyToShip: (orderIds: string[]) => Promise<void>;
  clearError: () => void;
}

export const useShippingStore = create<ShippingStore>()(
  devtools(
    (set) => ({
      // Initial state
      readyToShipOrders: [],
      allShippingOrders: [],
      loading: false,
      error: null,

      fetchAllShippingOrders: async () => {
        set({ loading: true, error: null });
        try {
          const response = await productionApi.getShippingOrders();
          set({ allShippingOrders: response, loading: false });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to fetch shipping orders',
            loading: false,
          });
          notifyError(error, 'Không thể tải đơn vận chuyển.');
        }
      },

      fetchReadyToShipOrders: async () => {
        set({ loading: true, error: null });
        try {
          const response = await productionApi.getReadyToShipOrders();
          set({
            readyToShipOrders: response,
            loading: false,
          });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to fetch ready to ship orders',
            loading: false,
          });
          notifyError(error, 'Không thể tải danh sách sẵn sàng giao.');
        }
      },

      bulkReadyToShip: async (orderIds: string[]) => {
        set({ loading: true, error: null });
        try {
          await productionApi.bulkReadyToShip(orderIds);

          // Refresh the order lists after successful action
          const [readyRes, allRes] = await Promise.all([
            productionApi.getReadyToShipOrders(),
            productionApi.getShippingOrders(),
          ]);
          set({
            readyToShipOrders: readyRes,
            allShippingOrders: allRes,
            loading: false,
          });
          notifySuccess('Đã cập nhật trạng thái đơn hàng thành sẵn sàng giao.');
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to process orders',
            loading: false,
          });
          notifyError(error, 'Không thể xử lý đơn hàng.');
        }
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'shipping-store',
    },
  ),
);
