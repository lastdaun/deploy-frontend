import React, { useState, useEffect } from 'react';
import { Package2, ChevronDown, ChevronUp, DollarSign } from 'lucide-react';
import type { BEOrderItem } from '@/features/operation-staff/types/types';
import PrescriptionSection from '@/features/operation-staff/components/dashboard/PrescriptionSection.tsx';
import { resolveProductImageUrl } from '@/lib/prescriptionImageUrl';
import { useOrderDrawerStore } from '@/features/operation-staff/store/orderDrawerStore.ts';

interface PickingListSectionProps {
  items: BEOrderItem[];
  orderStatus?: string;
  orderId?: string;
  /** Đồng bộ tiến độ thao tác theo từng dòng để footer quyết định hiện nút. */
  onItemActionProgressChange?: (progress: { hasAnyProcessed: boolean; allProcessed: boolean }) => void;
}

const PickingListSection: React.FC<PickingListSectionProps> = ({
  items,
  orderStatus,
  orderId,
  onItemActionProgressChange,
}) => {
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [requestingItemId, setRequestingItemId] = useState<string | null>(null);
  const [processingItem, setProcessingItem] = useState<string | null>(null);
  const [brokenProductImages, setBrokenProductImages] = useState<Set<string>>(new Set());
  const itemActionsByOrder = useOrderDrawerStore((state) => state.itemActionsByOrder);
  const markRequestedItem = useOrderDrawerStore((state) => state.markRequestedItem);
  const markProcessedItem = useOrderDrawerStore((state) => state.markProcessedItem);

  const requestedItemIds = new Set(
    orderId ? (itemActionsByOrder[orderId]?.requestedItemIds ?? []) : [],
  );
  const processedItemIds = new Set(
    orderId ? (itemActionsByOrder[orderId]?.processedItemIds ?? []) : [],
  );

  // PRE_ORDER trên dòng hàng = loại sản phẩm (đặt trước / có sẵn), không phải orderStatus. PREORDER_CONFIRMED = đơn có ít nhất một dòng PRE_ORDER đã được sale xác nhận.
  const isPreOrderStatus = orderStatus === 'PREORDER_CONFIRMED';
  const isConfirmed = orderStatus === 'CONFIRMED';
  const isDone = orderStatus === 'READY_TO_SHIP';

  useEffect(() => {
    setRequestingItemId(null);
    setProcessingItem(null);
    setBrokenProductImages(new Set());
  }, [orderId]);

  useEffect(() => {
    if (!onItemActionProgressChange) return;

    const list = items ?? [];
    const actionableItems = list.filter((item) => {
      const isItemPreOrder = item.orderItemType === 'PRE_ORDER';
      const needsStock = isPreOrderStatus && isItemPreOrder;
      const canProcess = isConfirmed || (isPreOrderStatus && !isItemPreOrder);
      return needsStock || canProcess;
    });

    if (actionableItems.length === 0) {
      onItemActionProgressChange({ hasAnyProcessed: false, allProcessed: false });
      return;
    }

    const handledCount = actionableItems.filter(
      (item) => requestedItemIds.has(item.orderItemId) || processedItemIds.has(item.orderItemId),
    ).length;

    onItemActionProgressChange({
      hasAnyProcessed: handledCount > 0,
      allProcessed: handledCount === actionableItems.length,
    });
  }, [
    items,
    requestedItemIds,
    processedItemIds,
    isPreOrderStatus,
    isConfirmed,
    onItemActionProgressChange,
  ]);

  const handleProcessItem = async (orderItemId: string) => {
    if (!orderId || processingItem) return;
    setProcessingItem(orderItemId);
    try {
      markProcessedItem(orderId, orderItemId);
    } catch (error) {
      console.error('Failed to start order:', error);
    } finally {
      setProcessingItem(null);
    }
  };

  const handleRequestStockForItem = async (orderItemId: string) => {
    if (!orderId || requestingItemId) return;
    setRequestingItemId(orderItemId);
    try {
      markRequestedItem(orderId, orderItemId);
    } catch (error) {
      console.error('Failed to request stock:', error);
    } finally {
      setRequestingItemId(null);
    }
  };

  const toggleExpanded = (orderItemId: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(orderItemId)) {
      newExpanded.delete(orderItemId);
    } else {
      newExpanded.add(orderItemId);
    }
    setExpandedItems(newExpanded);
  };

  const formatCurrency = (amount: number | null | undefined) => {
    if (!amount || amount === 0) {
      return '0 ₫';
    }
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  const displayValue = (value: number | null | undefined) => {
    return formatCurrency(value);
  };

  return (
    <section>
      <div className="flex items-center gap-2 mb-4">
        <Package2 className="w-5 h-5 text-slate-400" />
        <h3 className="text-slate-900 dark:text-white text-lg font-bold uppercase tracking-wide">
          Danh sách hàng
        </h3>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {items?.map((item) => {
          const productImgSrc = resolveProductImageUrl(item?.productImage ?? null);
          const showProductImage = Boolean(productImgSrc) && !brokenProductImages.has(item.orderItemId);
          return (
          <div
            key={item.orderItemId}
            className="group bg-white dark:bg-[#1a2e22] rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden hover:shadow-md transition-shadow"
          >
            {/* Main item content */}
            <div className="flex flex-col md:flex-row">
              <div className="w-full md:w-32 h-32 md:h-auto bg-slate-100 relative shrink-0">
                {showProductImage ? (
                  <img
                    src={productImgSrc}
                    alt=""
                    className="absolute inset-0 w-full h-full object-cover"
                    onError={() =>
                      setBrokenProductImages((prev) => new Set(prev).add(item.orderItemId))
                    }
                  />
                ) : (
                  <div className="absolute inset-0 bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                    <Package2 className="w-8 h-8 text-slate-400" />
                  </div>
                )}
              </div>

              <div className="flex-1 p-5 flex flex-col justify-center">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Tên sản phẩm
                  </span>
                </div>
                <h4 className="text-xl font-bold text-slate-900 dark:text-white mb-1">
                  {item.productName}
                </h4>
              </div>

              <div className="p-3 flex items-center justify-end gap-2">
                {(() => {
                  const isItemPreOrder = item.orderItemType === 'PRE_ORDER';
                  const needsStock = isPreOrderStatus && isItemPreOrder;
                  const canProcess = isConfirmed || (isPreOrderStatus && !isItemPreOrder);
                  const alreadyRequested = requestedItemIds.has(item.orderItemId);
                  const alreadyProcessed = processedItemIds.has(item.orderItemId);

                  if (isDone) {
                    return (
                      <span className="inline-flex items-center px-3 py-2 rounded-lg text-xs font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                        Đã hoàn thành
                      </span>
                    );
                  }

                  if (needsStock) {
                    return alreadyRequested ? (
                      <span className="inline-flex items-center px-3 py-2 rounded-lg text-xs font-bold bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200">
                        Đang xử lý
                      </span>
                    ) : (
                      <>
                        <span className="inline-flex items-center px-3 py-2 rounded-lg text-xs font-bold bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300">
                          Hết hàng
                        </span>
                        <button
                          onClick={() => handleRequestStockForItem(item.orderItemId)}
                          disabled={requestingItemId === item.orderItemId}
                          className="inline-flex items-center px-3 py-2 rounded-lg text-xs font-bold bg-orange-500 text-white hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {requestingItemId === item.orderItemId ? 'Đang gửi...' : 'Nhập hàng và xử lý đơn'}
                        </button>
                      </>
                    );
                  }

                  if (canProcess) {
                    return alreadyProcessed ? (
                      <span className="inline-flex items-center px-3 py-2 rounded-lg text-xs font-bold bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200">
                        Đang xử lý
                      </span>
                    ) : (
                      <button
                        onClick={() => handleProcessItem(item.orderItemId)}
                        disabled={processingItem === item.orderItemId}
                        className="inline-flex items-center px-3 py-2 rounded-lg text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {processingItem === item.orderItemId ? 'Đang xử lý...' : isConfirmed ? 'Chuẩn bị hàng' : 'Xử lý đơn hàng'}
                      </button>
                    );
                  }

                  return (
                    <span className="inline-flex items-center px-3 py-2 rounded-lg text-xs font-bold bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200">
                      Đang xử lý
                    </span>
                  );
                })()}
              </div>
            </div>

            {/* Expand/Collapse button */}
            <div className="border-t border-slate-200 dark:border-slate-700">
              <button
                onClick={() => toggleExpanded(item.orderItemId)}
                className="w-full px-5 py-3 flex items-center justify-between text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                <span className="font-medium">Chi tiết</span>
                {expandedItems.has(item.orderItemId) ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </button>
            </div>

            {/* Expanded content */}
            {expandedItems.has(item.orderItemId) && (
              <div className="border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-5">
                {/* Lens name section */}
                <div className="flex items-center gap-2 mb-4">
                  <Package2 className="w-5 h-5 text-slate-400" />
                  <h4 className="text-slate-900 dark:text-white text-sm font-bold uppercase tracking-wide">
                    Thông tin tròng kính
                  </h4>
                </div>
                <div className="flex justify-between mb-4">
                  <span className="text-sm text-slate-600 dark:text-slate-400">Tên tròng:</span>
                  <span className="text-sm font-medium text-slate-900 dark:text-white">
                    {item.lensName || 'N/A'}
                  </span>
                </div>

                {/* Prescription section inside lens info */}
                <div className="mb-6">
                  <PrescriptionSection
                    prescription={item.prescription}
                    prescriptionImageUrl={item.prescriptionImageUrl}
                  />
                </div>

                {/* Price details section */}
                <div className="flex items-center gap-2 mb-4">
                  <DollarSign className="w-5 h-5 text-slate-400" />
                  <h4 className="text-slate-900 dark:text-white text-sm font-bold uppercase tracking-wide">
                    Chi tiết giá
                  </h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-600 dark:text-slate-400">
                      Giá gọng kính:
                    </span>
                    <span className="text-sm font-medium text-slate-900 dark:text-white">
                      {displayValue(item.unitPrice)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-600 dark:text-slate-400">
                      Giá tròng kính:
                    </span>
                    <span className="text-sm font-medium text-slate-900 dark:text-white">
                      {displayValue(item.lensPrice)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-600 dark:text-slate-400">Tổng giá:</span>
                    <span className="text-sm font-bold text-slate-900 dark:text-white text-lg">
                      {displayValue(item.totalPrice)}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
          );
        })}
      </div>
    </section>
  );
};

export default PickingListSection;
