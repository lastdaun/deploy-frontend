import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { BEOrder, DrawerState } from '@/features/operation-staff/types/types';

interface OrderDrawerStore extends DrawerState {
  itemActionsByOrder: Record<
    string,
    {
      requestedItemIds: string[];
      processedItemIds: string[];
    }
  >;
  openDrawer: (order: BEOrder) => void;
  closeDrawer: () => void;
  setSelectedOrder: (order: BEOrder | null) => void;
  markRequestedItem: (orderId: string, orderItemId: string) => void;
  markProcessedItem: (orderId: string, orderItemId: string) => void;
}

export const useOrderDrawerStore = create<OrderDrawerStore>()(
  persist(
    (set) => ({
      isOpen: false,
      selectedOrder: null,
      itemActionsByOrder: {},

      openDrawer: (order) => set({ isOpen: true, selectedOrder: order }),
      closeDrawer: () => set({ isOpen: false, selectedOrder: null }),
      setSelectedOrder: (order) => set({ selectedOrder: order }),
      markRequestedItem: (orderId, orderItemId) =>
        set((state) => {
          const current = state.itemActionsByOrder[orderId] ?? {
            requestedItemIds: [],
            processedItemIds: [],
          };
          if (current.requestedItemIds.includes(orderItemId)) {
            return state;
          }

          return {
            itemActionsByOrder: {
              ...state.itemActionsByOrder,
              [orderId]: {
                ...current,
                requestedItemIds: [...current.requestedItemIds, orderItemId],
              },
            },
          };
        }),
      markProcessedItem: (orderId, orderItemId) =>
        set((state) => {
          const current = state.itemActionsByOrder[orderId] ?? {
            requestedItemIds: [],
            processedItemIds: [],
          };
          if (current.processedItemIds.includes(orderItemId)) {
            return state;
          }

          return {
            itemActionsByOrder: {
              ...state.itemActionsByOrder,
              [orderId]: {
                ...current,
                processedItemIds: [...current.processedItemIds, orderItemId],
              },
            },
          };
        }),
    }),
    {
      name: 'ops-order-item-actions',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        itemActionsByOrder: state.itemActionsByOrder,
      }),
    },
  ),
);
