import React from 'react';
import { Filter } from 'lucide-react';
import OrdersTabs from './OrdersTabs';
import type { TabItem, BEOrderStatus } from '@/features/operation-staff/types/types';

type StatusFilterId = 'CONFIRMED' | 'PROCESSING' | 'READY_TO_SHIP';

type StatusOption = {
  id: StatusFilterId;
  label: string;
  statuses: BEOrderStatus[];
};

interface OrdersToolbarProps {
  tabs: TabItem[];
  onTabChange: (tabId: string) => void;
  onFilterClick: () => void;
  isFilterActive?: boolean;
  isFilterOpen?: boolean;
  selectedStatuses: StatusFilterId[];
  statusOptions: StatusOption[];
  onStatusToggle: (status: StatusFilterId) => void;
  onClearStatusFilters: () => void;
}

const STATUS_DOTS: Record<StatusFilterId, string> = {
  CONFIRMED: 'bg-blue-500',
  PROCESSING: 'bg-orange-500',
  READY_TO_SHIP: 'bg-emerald-500',
};

const OrdersToolbar: React.FC<OrdersToolbarProps> = ({
  tabs,
  onTabChange,
  onFilterClick,
  isFilterActive = false,
  isFilterOpen = false,
  selectedStatuses,
  statusOptions,
  onStatusToggle,
  onClearStatusFilters,
}) => {
  return (
    <div className="relative px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <OrdersTabs tabs={tabs} onTabChange={onTabChange} />

      <div className="flex items-center gap-3">
        <button
          onClick={onFilterClick}
          className={`h-11 flex items-center gap-2 px-4 text-sm font-semibold border rounded-xl shadow-sm transition-all ${
            isFilterActive
              ? 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700 shadow-blue-200'
              : 'text-slate-700 bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
          }`}
        >
          <Filter className="w-4 h-4" />
          {isFilterActive ? `Bộ lọc (${selectedStatuses.length})` : 'Bộ lọc'}
        </button>
      </div>

      {isFilterOpen && (
        <div className="absolute right-6 top-full z-20 mt-2 w-72 rounded-xl border border-slate-100 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-900 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800">
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Lọc theo trạng thái</p>
            <button
              type="button"
              onClick={onClearStatusFilters}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700"
            >
              Xóa lọc
            </button>
          </div>

          <div className="py-1 max-h-72 overflow-y-auto">
            {statusOptions.map((status) => {
              const checked = selectedStatuses.includes(status.id);
              return (
                <button
                  key={status.id}
                  type="button"
                  onClick={() => onStatusToggle(status.id)}
                  className={`flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm font-medium transition-colors cursor-pointer ${
                    checked
                      ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300'
                      : 'text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${STATUS_DOTS[status.id] ?? 'bg-slate-400'}`} />
                  <span className="flex-1">{status.label}</span>
                  {checked && (
                    <span className="text-blue-600 text-xs font-bold">✓</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default OrdersToolbar;
