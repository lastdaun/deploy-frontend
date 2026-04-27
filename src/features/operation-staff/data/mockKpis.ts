import type { KPIData } from '@/features/operation-staff/types/types';

export const mockKpis: KPIData[] = [
  {
    id: 'waiting-orders',
    title: 'Tổng đơn chờ',
    value: 22,
    unit: 'đơn hàng',
    percentage: 45,
    variant: 'neutral',
    icon: 'file-text',
    description: 'Đơn hàng cần xử lý',
  },
  {
    id: 'ready-orders',
    title: 'Đơn đã duyệt',
    value: 15,
    unit: 'đơn hàng',
    percentage: 68,
    variant: 'success',
    icon: 'package',
    description: 'Đơn hàng đã được duyệt',
  },
];
