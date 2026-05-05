import React, { useState } from 'react';
import { AlertTriangle, CheckCircle, Send } from 'lucide-react';
import ConfirmModal from '@/features/operation-staff/components/common/ConfirmModal.tsx';
import { OpsReportHoldReasonModal } from '@/features/operation-staff/components/dashboard/OpsReportHoldReasonModal';

interface DrawerFooterProps {
  onStartProduction?: () => void;
  onCompleteProcessing?: () => void;
  onStartPackaging?: () => void;
  onHandoverToCarrier?: (trackingNumber: string) => void;
  onStartDelivery?: () => void;
  onReadyToShip?: () => void;
  isProcessing?: boolean;
  orderStatus?: string;
  trackingNumber?: string;
  operationalHoldReason?: string | null;
  canShowCompleteForConfirmed?: boolean;
  onSubmitReportHold?: (reason: string) => Promise<void>;
  holdModalSubtitle?: string | null;
}

const DrawerFooter: React.FC<DrawerFooterProps> = ({
  onReadyToShip,
  isProcessing = false,
  orderStatus,
  trackingNumber: existingTrackingNumber,
  operationalHoldReason,
  canShowCompleteForConfirmed = false,
  onSubmitReportHold,
  holdModalSubtitle,
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
  const [holdModalOpen, setHoldModalOpen] = useState(false);
  const [holdSubmitting, setHoldSubmitting] = useState(false);

  const holdReasonTrimmed = String(operationalHoldReason ?? '').trim();

  if (orderStatus === 'ON_HOLD') {
    return (
      <>
        <footer className="flex-none p-6 bg-white dark:bg-[#1a2e22] border-t border-slate-200 dark:border-slate-700 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] z-30 space-y-4">
          <div className="flex flex-col gap-3 p-4 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-700 dark:text-amber-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1 space-y-1">
                <p className="text-sm font-black text-amber-900 dark:text-amber-200 uppercase tracking-wide">
                  Đơn đang tạm giữ
                </p>
                {holdReasonTrimmed ? (
                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap font-medium">
                    {holdReasonTrimmed}
                  </p>
                ) : null}
                <p className="text-xs text-amber-800/90 dark:text-amber-300/90 leading-relaxed">
                  Bộ phận kinh doanh sẽ xem xét và bấm tiếp tục trên hệ thống. Khi đơn được mở lại, bạn có thể
                  xử lý trở lại tại đây.
                </p>
              </div>
            </div>
          </div>
        </footer>
      </>
    );
  }

  const shouldGateActionsByItemProgress =
    orderStatus === 'CONFIRMED' || orderStatus === 'PREORDER_CONFIRMED';

  // Đang xử lý đơn hàng…
  if (
    orderStatus === 'CONFIRMED' ||
    orderStatus === 'STOCK_REQUESTED' ||
    orderStatus === 'STOCK_READY' ||
    orderStatus === 'IN_PRODUCTION' ||
    orderStatus === 'PROCESSING' ||
    orderStatus === 'PREPARING' ||
    orderStatus === 'PRODUCED' ||
    orderStatus === 'PREORDER_CONFIRMED'
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
      <footer className="flex-none p-6 bg-white dark:bg-[#1a2e22] border-t border-slate-200 dark:border-slate-700 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] z-30 space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          {onSubmitReportHold ? (
            <button
              type="button"
              onClick={() => setHoldModalOpen(true)}
              disabled={isProcessing || holdSubmitting}
              className="sm:w-[40%] flex items-center justify-center gap-2 rounded-xl border-2 border-amber-300 bg-amber-50 text-amber-900 font-black text-sm shadow-sm hover:bg-amber-100 transition-all uppercase tracking-wide disabled:opacity-50 disabled:cursor-not-allowed h-14 px-4"
            >
              <AlertTriangle className="w-5 h-5" />
              Báo lỗi
            </button>
          ) : null}
          <button
            onClick={handleComplete}
            disabled={isProcessing || (shouldGateActionsByItemProgress && !canShowCompleteForConfirmed)}
            className={`flex items-center justify-center gap-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-lg shadow-lg hover:shadow-xl transition-all uppercase tracking-wide disabled:opacity-50 disabled:cursor-not-allowed h-14 ${onSubmitReportHold ? 'sm:flex-1' : 'w-full'}`}
          >
            <CheckCircle className="w-6 h-6 font-bold" />
            Hoàn thành
          </button>
        </div>
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
        {onSubmitReportHold ? (
          <OpsReportHoldReasonModal
            open={holdModalOpen}
            onOpenChange={(open) => {
              if (!open && holdSubmitting) return;
              setHoldModalOpen(open);
            }}
            loading={holdSubmitting}
            orderSubtitle={holdModalSubtitle}
            onConfirm={async (reason) => {
              setHoldSubmitting(true);
              try {
                await onSubmitReportHold(reason);
                setHoldModalOpen(false);
              } finally {
                setHoldSubmitting(false);
              }
            }}
          />
        ) : null}
      </footer>
    );
  }

  if (orderStatus === 'READY_TO_SHIP') {
    return (
      <footer className="flex-none p-6 bg-white dark:bg-[#1a2e22] border-t border-slate-200 dark:border-slate-700 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] z-30">
        <div className="flex items-center gap-3 p-4 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
          <Send className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-bold text-emerald-800 dark:text-emerald-300">Đơn đã sẵn sàng vận chuyển</p>
            <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-0.5">
              Đơn hàng đã được chuyển cho bộ phận giao hàng.
            </p>
          </div>
          <CheckCircle className="w-6 h-6 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
        </div>
      </footer>
    );
  }

  if (orderStatus === 'HANDED_TO_CARRIER') {
    return (
      <footer className="flex-none p-6 bg-white dark:bg-[#1a2e22] border-t border-slate-200 dark:border-slate-700 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] z-30">
        <div className="flex items-center gap-3 p-4 rounded-lg bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800">
          <Send className="w-5 h-5 text-purple-600 dark:text-purple-400 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-bold text-purple-800 dark:text-purple-300">Đã bàn giao cho ĐVVC</p>
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
