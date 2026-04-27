import React, { useEffect, useMemo } from 'react';
import OrdersSection from '@/features/operation-staff/components/dashboard/OrdersSection';
import { useSearchStore } from '@/features/operation-staff/store/searchStore';
import { useProductionStore } from '@/features/operation-staff/store/productionStore';
import { isPreorderOrder } from '@/features/operation-staff/utils/orderKind';

export type OpsOrderKind = 'preorder' | 'standard';

const PAGE_COPY: Record<OpsOrderKind, { title: string; description: string }> = {
  preorder: {
    title: 'Đơn đặt trước',
    description:
      'Theo dõi đơn pre-order: yêu cầu nhập hàng, sản xuất và bàn giao theo trạng thái mà bộ phận vận hành xử lý.',
  },
  standard: {
    title: 'Đơn hàng thường',
    description:
      'Quản lý đơn kính cận / hàng thường (không còn dòng pre-order) — lọc theo bước xử lý giống tổng quan.',
  },
};

interface OpsStaffOrderKindPageProps {
  kind: OpsOrderKind;
}

const OpsStaffOrderKindPage: React.FC<OpsStaffOrderKindPageProps> = ({ kind }) => {
  const { searchQuery, searchOrders, searchResults } = useSearchStore();
  const { processingOrders, fetchProcessingOrders } = useProductionStore();

  const scopedOrders = useMemo(() => {
    if (kind === 'preorder') {
      return processingOrders.filter(isPreorderOrder);
    }
    return processingOrders.filter((o) => !isPreorderOrder(o));
  }, [processingOrders, kind]);

  useEffect(() => {
    fetchProcessingOrders();
  }, [fetchProcessingOrders]);

  useEffect(() => {
    if (searchQuery.trim()) {
      searchOrders(scopedOrders, searchQuery);
    }
  }, [searchQuery, scopedOrders, searchOrders]);

  const displayOrders = searchQuery.trim() ? searchResults : scopedOrders;
  const copy = PAGE_COPY[kind];

  return (
    <div className="flex flex-col gap-6 h-full">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
          {copy.title}
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
          {copy.description}
        </p>
      </div>
      <OrdersSection
        orders={displayOrders}
        isSearchResult={!!searchQuery.trim()}
        emptyListHint={
          kind === 'preorder'
            ? 'Chưa có đơn đặt trước nào trong danh sách vận hành hiện tại.'
            : 'Chưa có đơn hàng thường nào trong danh sách vận hành hiện tại.'
        }
      />
    </div>
  );
};

export default OpsStaffOrderKindPage;
