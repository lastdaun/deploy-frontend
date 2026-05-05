import React, { useEffect, useState } from 'react';
import DrawerOverlay from './DrawerOverlay';
import DrawerHeader from './DrawerHeader';
import DrawerContent from './DrawerContent';
import DrawerFooter from './DrawerFooter';
import { useOrderDrawerStore } from '@/features/operation-staff/store/orderDrawerStore.ts';
import { useProductionStore } from '@/features/operation-staff/store/productionStore.ts';
import { formatOrderDisplayNameFromOrder } from '@/lib/orderDisplayName';

const OrderProcessingDrawer: React.FC = () => {
  const { isOpen, selectedOrder, closeDrawer } = useOrderDrawerStore();
  const startProduction = useProductionStore((state) => state.startOrder);
  const finishOrder = useProductionStore((state) => state.finishOrder);
  const readyToShip = useProductionStore((state) => state.readyToShip);
  const reportOperationalHold = useProductionStore((state) => state.reportOperationalHold);
  const startPackaging = useProductionStore((state) => state.startPackaging);
  const handoverToCarrier = useProductionStore((state) => state.handoverToCarrier);
  const startDelivery = useProductionStore((state) => state.startDelivery);
  const processingOrders = useProductionStore((state) => state.processingOrders);
  const isProcessing = useProductionStore((state) => state.loading);

  // Keep drawer in sync with store updates
  const currentOrder = selectedOrder
    ? processingOrders.find((o) => o.orderId === selectedOrder.orderId) || selectedOrder
    : null;

  const [confirmedItemsReady, setConfirmedItemsReady] = useState(false);

  useEffect(() => {
    setConfirmedItemsReady(false);
  }, [currentOrder?.orderId]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        closeDrawer();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, closeDrawer]);

  const handleCompleteProcessing = () => {
    if (currentOrder) {
      finishOrder(currentOrder.orderId)
        .then(() => {
          console.log('Order production completed:', currentOrder.orderId);
        })
        .catch((error) => {
          console.error('Failed to complete order:', error);
        });
    }
  };

  const handleStartProduction = async () => {
    if (!currentOrder) return;
    try {
      await startProduction(currentOrder.orderId);
      console.log('Order moved to PROCESSING:', currentOrder.orderId);
    } catch (err) {
      console.error('Failed to start production:', err);
    }
  };

  const handleReadyToShip = async () => {
    if (!currentOrder) return;
    try {
      await readyToShip(currentOrder.orderId);
      console.log('Order moved to READY_TO_SHIP:', currentOrder.orderId);
      closeDrawer();
    } catch (err) {
      console.error('Failed to move order to ready-to-ship:', err);
    }
  };

  // Giữ store/API cho tương lai; footer hiện chỉ dùng "Hoàn thành" → bulkReadyToShip (READY_TO_SHIP), không bấm packaging/handover.
  const handleStartPackaging = () => {
    if (currentOrder) {
      startPackaging(currentOrder.orderId)
        .then(() => {
          console.log('Packaging started:', currentOrder.orderId);
        })
        .catch((error) => {
          console.error('Failed to start packaging:', error);
        });
    }
  };

  const handleHandoverToCarrier = (trackingNumber: string) => {
    if (currentOrder) {
      handoverToCarrier(currentOrder.orderId, trackingNumber)
        .then(() => {
          console.log('Handed over to carrier:', currentOrder.orderId, trackingNumber);
        })
        .catch((error) => {
          console.error('Failed to handover:', error);
        });
    }
  };

  const handleStartDelivery = () => {
    if (currentOrder) {
      startDelivery(currentOrder.orderId)
        .then(() => {
          console.log('Delivery started:', currentOrder.orderId);
        })
        .catch((error) => {
          console.error('Failed to start delivery:', error);
        });
    }
  };

  return (
    <DrawerOverlay isOpen={isOpen} onClose={closeDrawer}>
      {currentOrder && (
        <>
          <DrawerHeader order={currentOrder} onClose={closeDrawer} />
          <DrawerContent
            orderId={currentOrder.orderId}
            isOpen={isOpen}
            onItemActionProgressChange={(progress) => {
              setConfirmedItemsReady(progress.allProcessed);
            }}
          />
          <DrawerFooter
            onStartProduction={handleStartProduction}
            onCompleteProcessing={handleCompleteProcessing}
            onReadyToShip={handleReadyToShip}
            onStartPackaging={handleStartPackaging}
            onHandoverToCarrier={handleHandoverToCarrier}
            onStartDelivery={handleStartDelivery}
            isProcessing={isProcessing}
            orderStatus={currentOrder.orderStatus}
            trackingNumber={currentOrder.trackingNumber}
            operationalHoldReason={currentOrder.operationalHoldReason}
            canShowCompleteForConfirmed={confirmedItemsReady}
            holdModalSubtitle={formatOrderDisplayNameFromOrder(currentOrder)}
            onSubmitReportHold={(reason) =>
              reportOperationalHold(currentOrder.orderId, reason)
            }
          />
        </>
      )}
    </DrawerOverlay>
  );
};

export default OrderProcessingDrawer;
