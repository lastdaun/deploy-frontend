import type { BEOrder } from '@/features/operation-staff/types/types';

type ShipperOrderWithPayment = BEOrder & {
  paymentMethod?: string | null;
  remainingAmount?: number | null;
};

export function getOrderCollectAmount(order: ShipperOrderWithPayment): number {
  const paymentMethod = order.paymentMethod?.toUpperCase();

  if (paymentMethod !== 'COD') {
    return 0;
  }

  if (typeof order.remainingAmount === 'number') {
    return Math.max(order.remainingAmount, 0);
  }

  const totalAmount = order.totalAmount ?? 0;
  const depositAmount = order.depositAmount ?? 0;
  return Math.max(totalAmount - depositAmount, 0);
}