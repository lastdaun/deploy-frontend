import React, { useState, useEffect, useMemo } from 'react';
import { Package, Truck } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import Pagination from '@/features/operation-staff/components/dashboard/Pagination';
import type { PaginationInfo } from '@/features/operation-staff/types/types';
import { useShippingStore } from '@/features/operation-staff/store/shippingStore.ts';
import ReadyToShipOrderTable from '@/features/operation-staff/components/shipping/ReadyToShipOrderTable.tsx';
import { sortOrdersByCreatedAtDesc } from '@/lib/orderSort';

const ITEMS_PER_PAGE = 10;

type ShippingStatusFilter = 'ALL' | 'READY_TO_SHIP' | 'DELIVERING' | 'DELIVERED';

const FILTER_OPTIONS: { value: ShippingStatusFilter; label: string }[] = [
  { value: 'ALL', label: 'Tất cả' },
  { value: 'READY_TO_SHIP', label: 'Sẵn sàng vận chuyển' },
  { value: 'DELIVERING', label: 'Đang giao hàng' },
  { value: 'DELIVERED', label: 'Đã giao hàng' },
];

const ShippingPage: React.FC = () => {
  const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<ShippingStatusFilter>('ALL');

  const allShippingOrders = useShippingStore((state) => state.allShippingOrders);
  const loading = useShippingStore((state) => state.loading);
  const error = useShippingStore((state) => state.error);
  const fetchAllShippingOrders = useShippingStore((state) => state.fetchAllShippingOrders);
  const bulkReadyToShip = useShippingStore((state) => state.bulkReadyToShip);
  const clearError = useShippingStore((state) => state.clearError);

  useEffect(() => {
    fetchAllShippingOrders();
  }, [fetchAllShippingOrders]);

  const filteredOrders = useMemo(() => {
    const base =
      statusFilter === 'ALL'
        ? allShippingOrders
        : allShippingOrders.filter((o) => o.orderStatus === statusFilter);
    return sortOrdersByCreatedAtDesc(base);
  }, [allShippingOrders, statusFilter]);

  const pagination: PaginationInfo = {
    currentPage,
    totalPages: Math.ceil((filteredOrders?.length || 0) / ITEMS_PER_PAGE),
    totalItems: filteredOrders?.length || 0,
    itemsPerPage: ITEMS_PER_PAGE,
    startIndex: (currentPage - 1) * ITEMS_PER_PAGE + 1,
    endIndex: Math.min(currentPage * ITEMS_PER_PAGE, filteredOrders?.length || 0),
  };

  const paginatedOrders =
    filteredOrders?.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE) || [];

  const handleSelectionChange = (orderId: string, selected: boolean) => {
    setSelectedOrders((prev) => {
      const newSet = new Set(prev);
      if (selected) {
        newSet.add(orderId);
      } else {
        newSet.delete(orderId);
      }
      return newSet;
    });
  };

  const handleBulkShipping = async () => {
    if (selectedOrders.size === 0) return;
    try {
      await bulkReadyToShip(Array.from(selectedOrders));
      setSelectedOrders(new Set());
    } catch (error) {
      console.error('Failed to process orders:', error);
    }
  };

  const handleFilterChange = (value: string) => {
    setStatusFilter(value as ShippingStatusFilter);
    setCurrentPage(1);
    setSelectedOrders(new Set());
  };

  return (
    <div className="flex flex-col gap-6 h-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-primary/10 rounded-lg">
            <Truck className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Sẵn sàng vận chuyển</h1>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Quản lý các đơn hàng đã hoàn tất và sẵn sàng bàn giao cho shipper
            </p>
          </div>
        </div>

        {selectedOrders.size > 0 && (
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-600 dark:text-slate-400">
              Đã chọn {selectedOrders.size} đơn hàng
            </span>
            <button
              onClick={handleBulkShipping}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Package className="w-4 h-4" />
              {loading ? 'Đang xử lý...' : 'Chuyển sang sẵn sàng vận chuyển'}
            </button>
          </div>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-red-700 dark:text-red-300">{error}</span>
            <button
              onClick={clearError}
              className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Orders Table */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between gap-4">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white shrink-0">
            Danh sách đơn hàng ({filteredOrders?.length || 0})
          </h2>

          {/* Status Filter */}
          <Select value={statusFilter} onValueChange={handleFilterChange}>
            <SelectTrigger className="w-52 h-10 rounded-xl border-slate-200 bg-white shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
              <SelectValue placeholder="Lọc theo trạng thái" />
            </SelectTrigger>
            <SelectContent className="rounded-xl shadow-xl border-slate-200">
              {FILTER_OPTIONS.map((opt) => (
                <SelectItem
                  key={opt.value}
                  value={opt.value}
                  className="cursor-pointer rounded-lg focus:bg-blue-50 focus:text-blue-700"
                >
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-slate-500">Đang tải...</div>
          </div>
        ) : paginatedOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Package className="w-12 h-12 text-slate-400 mb-4" />
            <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
              Không có đơn hàng nào
            </h3>
            <p className="text-slate-500 dark:text-slate-400">
              Hiện tại không có đơn hàng nào trong trạng thái này.
            </p>
          </div>
        ) : (
          <ReadyToShipOrderTable
            orders={paginatedOrders}
            selectedOrders={selectedOrders}
            onSelectionChange={handleSelectionChange}
          />
        )}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <Pagination pagination={pagination} onPageChange={setCurrentPage} />
      )}
    </div>
  );
};

export default ShippingPage;
