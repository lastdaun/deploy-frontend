import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CartState } from '../types/cart.types';
import type { PrescriptionData } from '@/types/prescription';

function prescriptionFingerprint(p: PrescriptionData | null | undefined): string {
  if (!p) return '';
  const { imageFile, imageUrl, ...rest } = p;
  const fileKey =
    imageFile && typeof imageFile === 'object' && 'size' in imageFile
      ? `${(imageFile as File).name}-${(imageFile as File).size}-${(imageFile as File).lastModified}`
      : '';
  return JSON.stringify({ ...rest, _img: fileKey, _u: imageUrl && !String(imageUrl).startsWith('blob:') ? imageUrl : '' });
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,

      addToCart: (newItem) =>
        set((state) => {
          const uniqueId = `${newItem.productId}-${newItem.lensId}-${prescriptionFingerprint(newItem.prescription ?? null)}`;

          const existingItem = state.items.find((item) => item.id === uniqueId);

          if (existingItem) {
            return {
              items: state.items.map((item) =>
                item.id === uniqueId
                  ? { ...item, quantity: item.quantity + newItem.quantity }
                  : item,
              ),
              isOpen: true,
            };
          }

          return {
            items: [...state.items, { ...newItem, id: uniqueId }],
            isOpen: true,
          };
        }),

      clearCart: () => set({ items: [], isOpen: false }),

      removeFromCart: (id) =>
        set((state) => ({
          items: state.items.filter((item) => item.id !== id),
        })),

      updateQuantity: (id, quantity) =>
        set((state) => ({
          items: state.items.map((item) =>
            item.id === id ? { ...item, quantity: Math.max(1, quantity) } : item,
          ),
        })),

      getCartTotal: () => {
        return get().items.reduce((total, item) => total + item.price * item.quantity, 0);
      },

      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),
    }),
    {
      name: 'vision-cart-storage',
      partialize: (state) => ({
        ...state,
        items: state.items.map((it) => ({
          ...it,
          prescription: it.prescription
            ? {
                ...it.prescription,
                imageFile: undefined,
                imageUrl:
                  it.prescription.imageUrl?.startsWith('blob:') ? null : it.prescription.imageUrl,
              }
            : it.prescription,
        })),
      }),
    },
  ),
);
