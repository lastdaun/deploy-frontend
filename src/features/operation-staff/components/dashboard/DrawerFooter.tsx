import React, { useState } from 'react';
import { CheckCircle, Send } from 'lucide-react';
import ConfirmModal from '@/features/operation-staff/components/common/ConfirmModal.tsx';

interface DrawerFooterProps {
  onStartProduction?: () => void;
  onCompleteProcessing: () => void;
  onStartPackaging?: () => void;
  onHandoverToCarrier?: (trackingNumber: string) => void;
  onStartDelivery?: () => void;
  onReadyToShip?: () => void;
  isProcessing?: boolean;
  orderStatus?: string;
  trackingNumber?: string;
  /** Với CONFIRMED: chỉ bật "Hoàn thành" sau khi tất cả dòng hàng đã bấm "Xử lý đơn hàng" */
  canShowCompleteForConfirmed?: boolean;
}

const DrawerFooter: React.FC<DrawerFooterProps> = ({
  onReadyToShip,
  isProcessing = false,
  orderStatus,
  trackingNumber: existingTrackingNumber,
  canShowCompleteForConfirmed = false,
}) => {
  const [modalConfig, setModalConfig] = useState<{
    open: boolean;
    title?: string;
    description?: string;
    confirmLabel?: string;
    cancelLabel?: string;
    destructive?: boolean;
    onConfirm?: () => void;
  }>({ open: false });

  // CONFIRMED: ẩn "Hoàn thành" tới khi tất cả dòng hàng đã bấm "Xử lý đơn hàng" (báo từ PickingListSection)
  if (orderStatus === 'CONFIRMED' && !canShowCompleteForConfirmed) {
    return null;
  }

  // Đang xử lý đơn hàng: tất cả trạng thái trung gian → show "Hoàn thành" → READY_TO_SHIP
  if (
    orderStatus === 'CONFIRMED' ||
    orderStatus === 'STOCK_REQUESTED' ||
    orderStatus === 'STOCK_READY' ||
    orderStatus === 'IN_PRODUCTION' ||
    orderStatus === 'PROCESSING' ||
    orderStatus === 'PREPARING' ||
    orderStatus === 'PRODUCED'
  ) {
    const handleComplete = () => {
      setModalConfig({
        open: true,
        title: 'Xác nhận hoàn thành',
        description: 'Bạn có chắc muốn hoàn thành đơn hàng? Đơn sẽ chuyển sang trạng thái sẵn sàng vận chuyển.',
        confirmLabel: 'Hoàn thành',
        destructive: false,
        onConfirm: () => {
          onReadyToShip?.();
          setModalConfig({ open: false });
        },
      });
    };

    return (
      <footer className="flex-none p-6 bg-white dark:bg-[#1a2e22] border-t border-slate-200 dark:border-slate-700 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] z-30">
        <button
          onClick={handleComplete}
          disabled={isProcessing}
          className="w-full flex items-center justify-center gap-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-black text-lg shadow-lg hover:shadow-xl transition-all uppercase tracking-wide disabled:opacity-50 disabled:cursor-not-allowed h-14"
        >
          <CheckCircle className="w-6 h-6 font-bold" />
          Hoàn thành
        </button>
        <ConfirmModal
          open={modalConfig.open}
          title={modalConfig.title}
          description={modalConfig.description}
          confirmLabel={modalConfig.confirmLabel}
          cancelLabel={modalConfig.cancelLabel}
          destructive={modalConfig.destructive}
          onConfirm={() => modalConfig.onConfirm?.()}
          onClose={() => setModalConfig({ open: false })}
        />
      </footer>
    );
  }

  // READY_TO_SHIP → operation staff flow is finished
  if (orderStatus === 'READY_TO_SHIP') {
    return (
      <footer className="flex-none p-6 bg-white dark:bg-[#1a2e22] border-t border-slate-200 dark:border-slate-700 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] z-30">
        <div className="flex items-center gap-3 p-4 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
          <Send className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-bold text-emerald-800 dark:text-emerald-300">
              Đơn đã sẵn sàng vận chuyển
            </p>
            <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-0.5">
              Đơn hàng đã được chuyển cho bộ phận giao hàng.
            </p>
          </div>
          <CheckCircle className="w-6 h-6 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
        </div>
      </footer>
    );
  }

  // HANDED_TO_CARRIER → show success state with tracking number
  if (orderStatus === 'HANDED_TO_CARRIER') {
    return (
      <footer className="flex-none p-6 bg-white dark:bg-[#1a2e22] border-t border-slate-200 dark:border-slate-700 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] z-30">
        <div className="flex items-center gap-3 p-4 rounded-lg bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800">
          <Send className="w-5 h-5 text-purple-600 dark:text-purple-400 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-bold text-purple-800 dark:text-purple-300">
              Đã bàn giao cho ĐVVC
            </p>
            {existingTrackingNumber && (
              <p className="text-xs text-purple-600 dark:text-purple-400 mt-0.5">
                Mã vận đơn: <span className="font-mono font-bold">{existingTrackingNumber}</span>
              </p>
            )}
          </div>
          <CheckCircle className="w-6 h-6 text-purple-600 dark:text-purple-400 flex-shrink-0" />
        </div>
      </footer>
    );
  }

  return null;
};

export default DrawerFooter;
