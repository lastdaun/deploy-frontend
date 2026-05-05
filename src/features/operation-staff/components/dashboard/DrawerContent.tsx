import React from 'react';
import PickingListSection from './PickingListSection';
import { useProductionStore } from '@/features/operation-staff/store/productionStore.ts';
import { useOrderDrawerStore } from '@/features/operation-staff/store/orderDrawerStore.ts';

interface DrawerContentProps {
  orderId: string;
  isOpen: boolean;
  onItemActionProgressChange?: (progress: { hasAnyProcessed: boolean; allProcessed: boolean }) => void;
}

const DrawerContent: React.FC<DrawerContentProps> = ({
  orderId,
  isOpen,
  onItemActionProgressChange,
}) => {
  const { processingOrders } = useProductionStore();
  const selectedOrder = useOrderDrawerStore((state) => state.selectedOrder);
  const order =
    processingOrders.find((o) => o.orderId === orderId) ??
    (selectedOrder?.orderId === orderId ? selectedOrder : undefined);

  if (!order) {
    return null;
  }

  return (
    <div
      className={`flex-1 overflow-y-auto no-scrollbar p-6 md:p-8 space-y-8 bg-white dark:bg-[#1a262d] transition-all duration-500 delay-150 ${
        isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      }`}
    >
      <PickingListSection
        items={order.items}
        orderStatus={order.orderStatus}
        orderId={order.orderId}
        onItemActionProgressChange={onItemActionProgressChange}
      />
      {/*<PaymentInfoSection order={order} />*/}
      {/*<PrescriptionSection prescription={order.items?.[0]?.prescription} />*/}
      {/*<SalesNotesSection notes={order.salesNotes} />*/}
    </div>
  );
};

export default DrawerContent;
