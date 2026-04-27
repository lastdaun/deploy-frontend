import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { shipperApi } from '@/features/shipper/api/shipper-api.ts';
import type { BEOrder } from '@/features/operation-staff/types/types';
import { notifyError, notifySuccess } from '@/lib/notifyError';

interface ShipperStore {
  // State
  readyToShipOrders: BEOrder[];
  acceptedOrders: BEOrder[];
  loading: boolean;
  error: string | null;

  // Actions
  fetchReadyToShipOrders: () => Promise<void>;
  acceptOrders: (orderIds: string[]) => Promise<void>;
  fetchAcceptedOrders: () => Promise<void>;
  startDelivery: (orderId: string) => Promise<void>;
  confirmDelivered: (orderId: string, deliveryProof: File) => Promise<void>;
  clearError: () => void;
}

export const useShipperStore = create<ShipperStore>()(
  devtools(
    (set) => ({
      // Initial state
      readyToShipOrders: [],
      acceptedOrders: [],
      loading: false,
      error: null,

      fetchReadyToShipOrders: async () => {
        set({ loading: true, error: null });
        try {
          const [readyToShipOrders, acceptedOrders] = await Promise.all([
            shipperApi.getReadyToShipOrders(),
            shipperApi.getMyAcceptedOrders(),
          ]);
          set({
            readyToShipOrders,
            acceptedOrders,
            loading: false,
          });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to fetch ready to ship orders',
            loading: false,
          });
          notifyError(error, 'Không thể tải danh sách đơn giao hàng.');
        }
      },

      acceptOrders: async (orderIds: string[]) => {
        set({ loading: true, error: null });
        try {
          await shipperApi.acceptOrders(orderIds);

          const [readyToShipOrders, acceptedOrders] = await Promise.all([
            shipperApi.getReadyToShipOrders(),
            shipperApi.getMyAcceptedOrders(),
          ]);
          set({
            readyToShipOrders,
            acceptedOrders,
            loading: false,
          });
          notifySuccess('Đã nhận đơn. Danh sách đã cập nhật.');
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to accept orders',
            loading: false,
          });
          notifyError(error, 'Không thể nhận đơn hàng.');
        }
      },

      fetchAcceptedOrders: async () => {
        set({ loading: true, error: null });
        try {
          const [readyToShipOrders, acceptedOrders] = await Promise.all([
            shipperApi.getReadyToShipOrders(),
            shipperApi.getMyAcceptedOrders(),
          ]);
          set({
            readyToShipOrders,
            acceptedOrders,
            loading: false,
          });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to fetch accepted orders',
            loading: false,
          });
          notifyError(error, 'Không thể tải đơn đã nhận.');
        }
      },

      startDelivery: async (orderId: string) => {
        set({ loading: true, error: null });
        try {
          await shipperApi.startDelivery(orderId);

          const [readyToShipOrders, acceptedOrders] = await Promise.all([
            shipperApi.getReadyToShipOrders(),
            shipperApi.getMyAcceptedOrders(),
          ]);
          set({
            readyToShipOrders,
            acceptedOrders,
            loading: false,
          });
          notifySuccess('Đã bắt đầu giao hàng. Trạng thái đã cập nhật.');
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to start delivery',
            loading: false,
          });
          notifyError(error, 'Không thể bắt đầu giao hàng.');
        }
      },

      confirmDelivered: async (orderId: string, deliveryProof: File) => {
        set({ loading: true, error: null });
        try {
          await shipperApi.confirmDelivered(orderId, deliveryProof);

          const [readyToShipOrders, acceptedOrders] = await Promise.all([
            shipperApi.getReadyToShipOrders(),
            shipperApi.getMyAcceptedOrders(),
          ]);
          set({
            readyToShipOrders,
            acceptedOrders,
            loading: false,
          });
          notifySuccess('Đã xác nhận giao hàng thành công.');
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to confirm delivery',
            loading: false,
          });
          notifyError(error, 'Không thể xác nhận giao hàng.');
          throw error;
        }
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'shipper-store',
    },
  ),
);
