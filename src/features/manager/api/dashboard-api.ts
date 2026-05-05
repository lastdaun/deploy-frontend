import { api } from '@/lib/axios';
import type { DashboardResult } from '../types/types';

function pickNum(r: Record<string, unknown>, camel: string, pascal: string): number {
  const v = r[camel] ?? r[pascal];
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  if (typeof v === 'string' && v.trim() !== '') return Number(v);
  return 0;
}

function normalizeDashboardPayload(data: unknown): DashboardResult {
  const body = data as Record<string, unknown>;
  const raw = (body.result ?? body.Result) as Record<string, unknown> | undefined;
  if (!raw || typeof raw !== 'object') {
    throw new Error('Dashboard API: thiếu result');
  }
  return {
    revenue: pickNum(raw, 'revenue', 'Revenue'),
    revenueGrowth: pickNum(raw, 'revenueGrowth', 'RevenueGrowth'),
    activeOrders: pickNum(raw, 'activeOrders', 'ActiveOrders'),
    ordersToday: pickNum(raw, 'ordersToday', 'OrdersToday'),
    returnPending: pickNum(raw, 'returnPending', 'ReturnPending'),
    lowStockItems: pickNum(raw, 'lowStockItems', 'LowStockItems'),
  };
}

export const dashboardApi = {
  getRevenue: async (): Promise<DashboardResult> => {
    const res = await api.get<unknown>('/dashboard/revenue');
    return normalizeDashboardPayload(res.data);
  },
};
