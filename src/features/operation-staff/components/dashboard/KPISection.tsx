import React from 'react';
import KPICard from './KPICard';
import { useProductionStore } from '@/features/operation-staff/store/productionStore.ts';
import type { KPIData } from '@/features/operation-staff/types/types';

const WAITING_STATUSES = new Set([
  'CONFIRMED',
  'PREORDER_CONFIRMED',
]);

const PROCESSING_STATUSES = new Set([
  'STOCK_REQUESTED',
  'STOCK_READY',
  'PROCESSING',
  'PREPARING',
  'IN_PRODUCTION',
  'PRODUCED',
]);

const DONE_STATUSES = new Set([
  'READY_TO_SHIP',
]);

const KPISection: React.FC = () => {
  const processingOrders = useProductionStore((state) => state.processingOrders);

  const total = processingOrders.filter((o) => WAITING_STATUSES.has(o.orderStatus)).length;
  const processing = processingOrders.filter((o) => PROCESSING_STATUSES.has(o.orderStatus)).length;
  const done = processingOrders.filter((o) => DONE_STATUSES.has(o.orderStatus)).length;
  const allOrders = processingOrders.length;
  const processingPercent = allOrders > 0 ? Math.round((processing / allOrders) * 100) : 0;
  const donePercent = allOrders > 0 ? Math.round((done / allOrders) * 100) : 0;

  const kpis: KPIData[] = [
    {
      id: 'waiting-orders',
      title: 'Tổng đơn chờ',
      value: total,
      unit: 'đơn hàng',
      percentage: 100,
      variant: 'neutral',
      icon: 'file-text',
      description: 'Đơn hàng cần xử lý',
    },
    {
      id: 'processing-orders',
      title: 'Đơn đang xử lý',
      value: processing,
      unit: 'đơn hàng',
      percentage: processingPercent,
      variant: 'neutral',
      icon: 'inventory',
      description: 'Đơn hàng đang ở công đoạn xử lý',
    },
    {
      id: 'done-orders',
      title: 'Đơn đã hoàn thành',
      value: done,
      unit: 'đơn hàng',
      percentage: donePercent,
      variant: 'success',
      icon: 'package',
      description: 'Đơn hàng sẵn sàng vận chuyển',
    },
  ];

  return (
    <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {kpis.map((kpi) => (
        <KPICard key={kpi.id} data={kpi} />
      ))}
    </section>
  );
};

export default KPISection;
