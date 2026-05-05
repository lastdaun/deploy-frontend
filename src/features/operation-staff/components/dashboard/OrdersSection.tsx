import React, { useState, useMemo, useEffect } from 'react';
import OrdersToolbar from '@/features/operation-staff/components/dashboard/OrdersToolbar';
import OrdersTable from '@/features/operation-staff/components/dashboard/OrdersTable';
import Pagination from '@/features/operation-staff/components/dashboard/Pagination';
import OrderProcessingDrawer from '@/features/operation-staff/components/dashboard/OrderProcessingDrawer.tsx';
import type {
  TabItem,
  PaginationInfo,
  BEOrder,
  BEOrderStatus,
} from '@/features/operation-staff/types/types';
import { useProductionStore } from '@/features/operation-staff/store/productionStore.ts';
import { sortOrdersByCreatedAtDesc } from '@/lib/orderSort';

const ITEMS_PER_PAGE = 10;
type StatusFilterKey =
  | 'CONFIRMED'
  | 'PROCESSING'
  | 'READY_TO_SHIP';

type StatusFilterOption = {
  id: StatusFilterKey;
  label: string;
  statuses: BEOrderStatus[];
};

// Gom nhóm hiển thị (UI) — khác với flow nghiệp vụ BE: ví dụ BE dùng IN_PRODUCTION nhưng tab "Đang xử lý" vẫn gộp PREPARING/PRODUCED để không sót đơn cũ hoặc dữ liệu lệch.
const FILTERABLE_STATUSES: StatusFilterOption[] = [
  { id: 'CONFIRMED', label: 'Đã xác nhận', statuses: ['CONFIRMED', 'PREORDER_CONFIRMED'] },
  {
    id: 'PROCESSING',
    label: 'Đang xử lý',
    statuses: ['STOCK_REQUESTED', 'STOCK_READY', 'IN_PRODUCTION', 'PROCESSING', 'PREPARING', 'PRODUCED'],
  },
  {
    id: 'READY_TO_SHIP',
    label: 'Sẵn sàng vận chuyển',
    statuses: ['READY_TO_SHIP'],
  },
];

interface OrdersSectionProps {
  orders?: BEOrder[];
  isSearchResult?: boolean;
  /** Nội dung gợi ý khi danh sách theo bối cảnh (ví dụ trang pre-order) trống */
  emptyListHint?: string;
}

const OrdersSection: React.FC<OrdersSectionProps> = ({
  orders: propOrders,
  isSearchResult = false,
  emptyListHint,
}) => {
  const [activeTab, setActiveTab] = useState<string>('all');
  const [selectedStatuses, setSelectedStatuses] = useState<StatusFilterKey[]>([]);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  // Use production store directly when no props provided
  const storeProcessingOrders = useProductionStore((state) => state.processingOrders);
  const loading = useProductionStore((state) => state.loading);
  const error = useProductionStore((state) => state.error);
  const fetchProcessingOrders = useProductionStore((state) => state.fetchProcessingOrders);
  const clearError = useProductionStore((state) => state.clearError);

  const orders = propOrders ?? storeProcessingOrders;

  useEffect(() => {
    if (propOrders === undefined) {
      fetchProcessingOrders();
    }
  }, [propOrders, fetchProcessingOrders]);

  const tabs: TabItem[] = isSearchResult
    ? [{ id: 'all', label: 'Kết quả tìm kiếm', isActive: activeTab === 'all' }]
    : [{ id: 'all', label: 'Tất cả', isActive: activeTab === 'all' }];

  const filteredOrders = useMemo(() => {
    const sortedOrders = sortOrdersByCreatedAtDesc(orders);

    let visibleOrders = sortedOrders;

    const selectedFilterStatuses = selectedStatuses.flatMap((statusKey) => {
      const option = FILTERABLE_STATUSES.find((item) => item.id === statusKey);
      return option?.statuses ?? [];
    });

    if (!isSearchResult && activeTab !== 'all') {
      visibleOrders = visibleOrders.filter((order) => order.orderStatus === activeTab);
    }

    if (selectedFilterStatuses.length > 0) {
      const selectedStatusSet = new Set(selectedFilterStatuses);
      visibleOrders = visibleOrders.filter((order) => selectedStatusSet.has(order.orderStatus));
    }

    return visibleOrders;
  }, [orders, activeTab, isSearchResult, selectedStatuses]);

  const pagination: PaginationInfo = useMemo(() => {
    const totalItems = filteredOrders?.length || 0;
    const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE + 1;
    const endIndex = Math.min(currentPage * ITEMS_PER_PAGE, totalItems);

    return {
      currentPage,
      totalPages,
      totalItems,
      itemsPerPage: ITEMS_PER_PAGE,
      startIndex,
      endIndex,
    };
  }, [filteredOrders, currentPage]);

  const paginatedOrders = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredOrders?.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredOrders, currentPage]);

  const tableEmptyMessage = useMemo(() => {
    if (paginatedOrders.length > 0) return '';
    if (isSearchResult) {
      return 'Không có đơn hàng nào trên trang này.';
    }
    if (orders.length === 0) {
      return emptyListHint ?? 'Chưa có đơn hàng cần xử lý.';
    }
    if (filteredOrders.length === 0) {
      return 'Không có đơn nào khớp bộ lọc trạng thái. Hãy xóa lọc hoặc thử từ khóa khác.';
    }
    return 'Chưa có đơn hàng phù hợp.';
  }, [
    paginatedOrders.length,
    isSearchResult,
    orders.length,
    filteredOrders.length,
    emptyListHint,
  ]);

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    setIsFilterOpen(false);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleFilterClick = () => {
    setIsFilterOpen((current) => !current);
  };

  const handleStatusToggle = (status: StatusFilterKey) => {
    setSelectedStatuses((current) =>
      current.includes(status)
        ? current.filter((item) => item !== status)
        : [...current, status],
    );
    setCurrentPage(1);
  };

  const handleClearStatusFilters = () => {
    setSelectedStatuses([]);
    setCurrentPage(1);
  };

  const handleRetry = () => {
    clearError();
    fetchProcessingOrders();
  };

  // Show loading state
  if (loading && orders?.length === 0) {
    return (
      <section className="bg-white dark:bg-[#1a262d] rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex-1 flex items-center justify-center py-6">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-slate-200 dark:border-slate-700 border-t-blue-600 mx-auto mb-4"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-4 w-4 bg-blue-600 rounded-full animate-pulse"></div>
            </div>
          </div>
          <p className="text-slate-600 dark:text-slate-400 font-medium">Đang tải đơn hàng...</p>
          <p className="text-slate-500 dark:text-slate-500 text-sm mt-1">
            Vui lòng chờ trong giây lát
          </p>
        </div>
        <OrderProcessingDrawer />
      </section>
    );
  }

  // Show error state
  if (error && orders?.length === 0) {
    return (
      <section className="bg-white dark:bg-[#1a262d] rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex-1 flex items-center justify-center py-6">
        <div className="text-center max-w-md mx-auto px-6">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-red-600 dark:text-red-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
            Không thể tải dữ liệu
          </h3>
          <p className="text-red-600 dark:text-red-400 mb-6 text-sm">{error}</p>
          <button
            onClick={handleRetry}
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors shadow-sm hover:shadow-md"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            Thử lại
          </button>
        </div>
        <OrderProcessingDrawer />
      </section>
    );
  }

  // Show empty state for search results
  if (isSearchResult && orders?.length === 0) {
    return (
      <section className="bg-white dark:bg-[#1a262d] rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex-1 flex items-center justify-center py-6">
        <div className="text-center max-w-md mx-auto px-6">
          <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-slate-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
            Không tìm thấy kết quả
          </h3>
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            Không có đơn hàng nào khớp với từ khóa tìm kiếm của bạn.
          </p>
        </div>
        <OrderProcessingDrawer />
      </section>
    );
  }

  return (
    <section className="bg-white dark:bg-[#1a262d] rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex-1 flex flex-col">
      <OrdersToolbar
        tabs={tabs}
        onTabChange={handleTabChange}
        onFilterClick={handleFilterClick}
        isFilterActive={selectedStatuses.length > 0}
        isFilterOpen={isFilterOpen}
        selectedStatuses={selectedStatuses}
        statusOptions={FILTERABLE_STATUSES}
        onStatusToggle={handleStatusToggle}
        onClearStatusFilters={handleClearStatusFilters}
      />

      <OrdersTable orders={paginatedOrders} emptyMessage={tableEmptyMessage} />

      <Pagination pagination={pagination} onPageChange={handlePageChange} />

      <OrderProcessingDrawer />
    </section>
  );
};

export default OrdersSection;
