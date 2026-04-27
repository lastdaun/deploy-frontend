import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  Clock3,
  Loader2,
  MapPin,
  Package,
  Phone,
  RefreshCw,
  Search,
  ShieldCheck,
  Truck,
  User,
  Banknote,
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useShipperStore } from '@/features/shipper/store/shipperStore.ts';
import { cn } from '@/lib/utils';
import { getOrderCollectAmount } from '@/features/shipper/utils/order-money';
import ConfirmDeliveryModal from '@/features/shipper/components/ConfirmDeliveryModal';
import { sortOrdersByCreatedAtDesc } from '@/lib/orderSort';
import { orderStatusLabel, orderStatusRowPillClassName } from '@/lib/orderStatusUi';

type Screen = 'select' | 'list' | 'detail';
type StatusFilter = 'ALL' | 'READY_TO_SHIP' | 'DELIVERING' | 'DELIVERED';

const STATUS_FILTER_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: 'ALL', label: 'Tất cả' },
  { value: 'READY_TO_SHIP', label: 'Sẵn sàng vận chuyển' },
  { value: 'DELIVERING', label: 'Đang giao hàng' },
  { value: 'DELIVERED', label: 'Đã giao hàng' },
];

const formatCurrency = (amount: number) => new Intl.NumberFormat('vi-VN').format(amount) + '₫';

const getStatusMeta = (status: string) => ({
  label: orderStatusLabel(status),
  className: orderStatusRowPillClassName(status),
});

const ShipperDashboardPage: React.FC = () => {
  const [screen, setScreen] = useState<Screen>('select');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());
  const [startedIds, setStartedIds] = useState<Set<string>>(new Set());
  const [activeOrderId, setActiveOrderId] = useState<string | null>(null);
  const [confirmOrderId, setConfirmOrderId] = useState<string | null>(null);

  const readyToShipOrders = useShipperStore((state) => state.readyToShipOrders);
  const acceptedOrders = useShipperStore((state) => state.acceptedOrders);
  const loading = useShipperStore((state) => state.loading);
  const error = useShipperStore((state) => state.error);
  const fetchReadyToShipOrders = useShipperStore((state) => state.fetchReadyToShipOrders);
  const acceptOrders = useShipperStore((state) => state.acceptOrders);
  const fetchAcceptedOrders = useShipperStore((state) => state.fetchAcceptedOrders);
  const startDelivery = useShipperStore((state) => state.startDelivery);
  const confirmDelivered = useShipperStore((state) => state.confirmDelivered);
  const clearError = useShipperStore((state) => state.clearError);

  const deliveringCount = acceptedOrders.filter((order) =>
    ['DELIVERING', 'SHIPPED'].includes(order.orderStatus),
  ).length;
  const completedCount = acceptedOrders.filter((order) => order.orderStatus === 'DELIVERED').length;
  const hasDeliveringOrder = acceptedOrders.some((order) =>
    ['DELIVERING', 'SHIPPED'].includes(order.orderStatus),
  );

  const activeOrder = useMemo(
    () => acceptedOrders.find((order) => order.orderId === activeOrderId) || null,
    [acceptedOrders, activeOrderId],
  );

  useEffect(() => {
    fetchReadyToShipOrders();
    fetchAcceptedOrders();
  }, [fetchReadyToShipOrders, fetchAcceptedOrders]);

  const acceptSingleOrder = useCallback(
    async (orderId: string) => {
      try {
        await acceptOrders([orderId]);
        // Refresh data but keep current filter
        await Promise.all([fetchReadyToShipOrders(), fetchAcceptedOrders()]);
      } catch (error) {
        console.error('Failed to accept order:', error);
      }
    },
    [acceptOrders, fetchReadyToShipOrders, fetchAcceptedOrders],
  );

  const startOrder = useCallback(
    async (id: string) => {
      const currentOrder = acceptedOrders.find((order) => order.orderId === id);
      if (currentOrder && ['DELIVERING', 'SHIPPED'].includes(currentOrder.orderStatus)) {
        setActiveOrderId(id);
        setScreen('detail');
        return;
      }

      try {
        await startDelivery(id);
        setActiveOrderId(id);
        setStartedIds((prev) => new Set(prev).add(id));
        setScreen('detail');
      } catch (error) {
        console.error('Failed to start delivery:', error);
      }
    },
    [startDelivery],
  );

  const goBackToList = useCallback(() => {
    setScreen('list');
  }, []);

  const openConfirmDeliveryModal = useCallback((orderId: string) => {
    setConfirmOrderId(orderId);
  }, []);

  const handleConfirmDelivered = useCallback(
    async (orderId: string, file: File) => {
      await confirmDelivered(orderId, file);
      setCompletedIds((prev) => new Set(prev).add(orderId));
      if (activeOrderId === orderId) {
        setActiveOrderId(null);
        setScreen('list');
      }
    },
    [activeOrderId, confirmDelivered],
  );

  const goToDeliveryList = useCallback(() => {
    setScreen('list');
  }, []);

  const handleRetry = useCallback(() => {
    clearError();
    if (screen === 'list') {
      fetchAcceptedOrders();
    } else {
      fetchReadyToShipOrders();
    }
  }, [clearError, fetchAcceptedOrders, fetchReadyToShipOrders, screen]);

  const handleStatusFilterChange = (value: string) => {
    const newFilter = value as StatusFilter;
    setStatusFilter(newFilter);
    if (newFilter === 'ALL') {
      setScreen('select'); // use select screen as base for unified table
      fetchReadyToShipOrders();
      fetchAcceptedOrders();
    } else if (newFilter === 'READY_TO_SHIP') {
      setScreen('select');
      fetchReadyToShipOrders();
    } else {
      setScreen('list');
      fetchAcceptedOrders();
    }
  };

  const sortedReadyToShip = useMemo(
    () => sortOrdersByCreatedAtDesc(readyToShipOrders),
    [readyToShipOrders],
  );
  const sortedAccepted = useMemo(
    () => sortOrdersByCreatedAtDesc(acceptedOrders),
    [acceptedOrders],
  );

  const allOrders = useMemo(
    () => sortOrdersByCreatedAtDesc([...readyToShipOrders, ...acceptedOrders]),
    [readyToShipOrders, acceptedOrders],
  );

  const filteredAcceptedOrders = useMemo(() => {
    if (statusFilter === 'DELIVERING') {
      return sortedAccepted.filter((o) => ['DELIVERING', 'SHIPPED'].includes(o.orderStatus));
    }
    if (statusFilter === 'DELIVERED') {
      return sortedAccepted.filter((o) => o.orderStatus === 'DELIVERED');
    }
    return sortedAccepted;
  }, [sortedAccepted, statusFilter]);

  const renderAllTable = () => {
    if (allOrders.length === 0) {
      return renderEmpty('Không có đơn nào', 'Chưa có đơn hàng nào trong hệ thống.');
    }

    return (
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/60 text-[11px] font-bold uppercase tracking-widest text-slate-400">
              <th className="px-6 py-4">Mã đơn</th>
              <th className="px-6 py-4">Khách hàng</th>
              <th className="px-6 py-4">Địa chỉ</th>
              <th className="px-6 py-4 text-right">Giá tiền</th>
              <th className="px-6 py-4 text-center">Trạng thái</th>
              <th className="px-6 py-4 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {allOrders.map((order) => {
              const priceAmount = getOrderCollectAmount(order);
              const statusMeta = getStatusMeta(order.orderStatus);
              const isReady = order.orderStatus === 'READY_TO_SHIP';
              const isDelivering = ['DELIVERING', 'SHIPPED'].includes(order.orderStatus);
              const isDone = completedIds.has(order.orderId) || order.orderStatus === 'DELIVERED';
              const started = startedIds.has(order.orderId) || isDelivering;

              return (
                <tr key={order.orderId} className="group hover:bg-slate-50/60 transition-colors">
                  <td className="px-6 py-5 align-top">
                    <div className="font-bold text-slate-900">#{order.orderId.slice(0, 8)}</div>
                    <div className="mt-1 text-xs text-slate-400">{order.orderId}</div>
                  </td>
                  <td className="px-6 py-5 align-top">
                    <div className="font-semibold text-slate-800">{order.recipientName}</div>
                    <div className="mt-1 text-xs text-slate-400">{order.phoneNumber}</div>
                  </td>
                  <td className="px-6 py-5 align-top text-sm text-slate-600">{order.deliveryAddress}</td>
                  <td className="px-6 py-5 align-top text-right font-bold text-slate-900">
                    {formatCurrency(priceAmount)}
                  </td>
                  <td className="px-6 py-5 align-top text-center">
                    <span className={cn('inline-flex rounded-full border px-3 py-1 text-xs font-semibold', statusMeta.className)}>
                      {statusMeta.label}
                    </span>
                  </td>
                  <td className="px-6 py-5 align-top text-right">
                    {isReady && (
                      <button
                        type="button"
                        onClick={() => acceptSingleOrder(order.orderId)}
                        disabled={loading}
                        className={cn(
                          'inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-colors',
                          loading
                            ? 'cursor-not-allowed bg-slate-100 text-slate-400'
                            : 'bg-emerald-600 text-white hover:bg-emerald-700',
                        )}
                      >
                        <Truck className="h-4 w-4" />
                        Nhận đơn hàng
                      </button>
                    )}
                    {!isReady && !isDone && (
                      <button
                        type="button"
                        onClick={() =>
                          started
                            ? openConfirmDeliveryModal(order.orderId)
                            : startOrder(order.orderId)
                        }
                        disabled={loading || (hasDeliveringOrder && !started)}
                        className={cn(
                          'inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-colors',
                          loading || (hasDeliveringOrder && !started)
                            ? 'cursor-not-allowed bg-slate-100 text-slate-400'
                            : 'bg-blue-600 text-white hover:bg-blue-700',
                        )}
                      >
                        <Truck className="h-4 w-4" />
                        {started ? 'Xác nhận giao' : loading ? 'Đang xử lý...' : 'Bắt đầu giao'}
                      </button>
                    )}
                    {isDone && (
                      <span className="inline-flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700">
                        <CheckCircle2 className="h-4 w-4" />
                        Đã giao hàng
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  const renderToolbar = () => (
    <div className="flex flex-col gap-4 border-b border-slate-100 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-2xl font-black tracking-tight text-slate-900">Tổng quan giao hàng</h1>
        <p className="mt-1 text-sm text-slate-500">
          Theo dõi đơn chờ nhận, lộ trình đang giao và hoàn tất giao hàng trong cùng một màn hình.
        </p>
      </div>

      <Select value={statusFilter} onValueChange={handleStatusFilterChange}>
        <SelectTrigger className="w-56 h-10 rounded-xl border-slate-200 bg-white shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
          <SelectValue placeholder="Lọc theo trạng thái" />
        </SelectTrigger>
        <SelectContent className="rounded-xl shadow-xl border-slate-200">
          {STATUS_FILTER_OPTIONS.map((opt) => (
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
  );

  const renderSummaryCard = (
    title: string,
    value: string | number,
    description: string,
    icon: React.ReactNode,
    accent: string,
  ) => (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">{title}</p>
          <p className="mt-2 text-3xl font-black tracking-tight text-slate-900">{value}</p>
          <p className="mt-2 text-sm text-slate-500">{description}</p>
        </div>
        <div className={cn('flex h-11 w-11 items-center justify-center rounded-xl', accent)}>
          {icon}
        </div>
      </div>
    </div>
  );

  const renderEmpty = (title: string, message: string) => (
    <div className="flex flex-1 items-center justify-center px-6 py-16 text-center">
      <div className="max-w-sm">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-slate-400">
          <Search className="h-7 w-7" />
        </div>
        <h3 className="text-lg font-bold text-slate-900">{title}</h3>
        <p className="mt-2 text-sm text-slate-500">{message}</p>
      </div>
    </div>
  );

  const renderSelectTable = () => {
    if (sortedReadyToShip.length === 0) {
      return renderEmpty('Chưa có đơn chờ nhận', 'Hệ thống sẽ hiển thị các đơn đủ điều kiện giao hàng tại đây.');
    }

    return (
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/60 text-[11px] font-bold uppercase tracking-widest text-slate-400">
              <th className="px-6 py-4">Mã đơn</th>
              <th className="px-6 py-4">Khách hàng</th>
              <th className="px-6 py-4">Sản phẩm</th>
              <th className="px-6 py-4 text-right">Giá tiền</th>
              <th className="px-6 py-4 text-center">Trạng thái</th>
              <th className="px-6 py-4 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {sortedReadyToShip.map((order) => {
              const priceAmount = getOrderCollectAmount(order);
              const statusMeta = getStatusMeta(order.orderStatus);

              return (
                <tr key={order.orderId} className="group hover:bg-emerald-50/30 transition-colors">
                  <td className="px-6 py-5 align-top">
                    <div className="font-bold text-slate-900">#{order.orderId.slice(0, 8)}</div>
                    <div className="mt-1 text-xs text-slate-400">{order.orderId}</div>
                  </td>
                  <td className="px-6 py-5 align-top">
                    <div className="font-semibold text-slate-800">{order.recipientName}</div>
                    <div className="mt-1 text-xs text-slate-500">{order.deliveryAddress}</div>
                    <div className="mt-1 text-xs text-slate-400">{order.phoneNumber}</div>
                  </td>
                  <td className="px-6 py-5 align-top text-sm text-slate-700">
                    {order.items.length} sản phẩm
                  </td>
                  <td className="px-6 py-5 align-top text-right font-bold text-slate-900">
                    {formatCurrency(priceAmount)}
                  </td>
                  <td className="px-6 py-5 align-top text-center">
                    <span className={cn('inline-flex rounded-full border px-3 py-1 text-xs font-semibold', statusMeta.className)}>
                      {statusMeta.label}
                    </span>
                  </td>
                  <td className="px-6 py-5 align-top text-right">
                    <button
                      type="button"
                      onClick={() => acceptSingleOrder(order.orderId)}
                      disabled={loading}
                      className={cn(
                        'inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-colors',
                        loading
                          ? 'cursor-not-allowed bg-slate-100 text-slate-400'
                          : 'bg-emerald-600 text-white hover:bg-emerald-700',
                      )}
                    >
                      <Truck className="h-4 w-4" />
                      Nhận đơn hàng
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  const renderAcceptedTable = () => {
    if (filteredAcceptedOrders.length === 0) {
      return renderEmpty('Không có đơn nào', 'Không có đơn hàng nào trong trạng thái này.');
    }

    return (
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/60 text-[11px] font-bold uppercase tracking-widest text-slate-400">
              <th className="px-6 py-4">Mã đơn</th>
              <th className="px-6 py-4">Khách hàng</th>
              <th className="px-6 py-4">Địa chỉ</th>
              <th className="px-6 py-4">Giá tiền</th>
              <th className="px-6 py-4 text-center">Trạng thái</th>
              <th className="px-6 py-4 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filteredAcceptedOrders.map((order) => {
              const done = completedIds.has(order.orderId) || order.orderStatus === 'DELIVERED';
              const started =
                startedIds.has(order.orderId) || ['DELIVERING', 'SHIPPED'].includes(order.orderStatus);
              const priceAmount = getOrderCollectAmount(order);
              const statusMeta = getStatusMeta(order.orderStatus);

              return (
                <tr key={order.orderId} className="group hover:bg-blue-50/30 transition-colors">
                  <td className="px-6 py-5 align-top font-bold text-slate-900">#{order.orderId.slice(0, 8)}</td>
                  <td className="px-6 py-5 align-top">
                    <div className="font-semibold text-slate-800">{order.recipientName}</div>
                    <div className="mt-1 text-xs text-slate-400">{order.phoneNumber}</div>
                  </td>
                  <td className="px-6 py-5 align-top text-sm text-slate-600">{order.deliveryAddress}</td>
                  <td className="px-6 py-5 align-top font-bold text-slate-900">{formatCurrency(priceAmount)}</td>
                  <td className="px-6 py-5 align-top text-center">
                    <span className={cn('inline-flex rounded-full border px-3 py-1 text-xs font-semibold', statusMeta.className)}>
                      {done ? 'Đã giao hàng' : started ? 'Đang giao hàng' : statusMeta.label}
                    </span>
                  </td>
                  <td className="px-6 py-5 align-top text-right">
                    {done ? (
                      <span className="inline-flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700">
                        <CheckCircle2 className="h-4 w-4" />
                        Đã giao hàng
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() =>
                          started
                            ? openConfirmDeliveryModal(order.orderId)
                            : startOrder(order.orderId)
                        }
                        disabled={loading || (hasDeliveringOrder && !started)}
                        className={cn(
                          'inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-colors',
                          loading || (hasDeliveringOrder && !started)
                            ? 'cursor-not-allowed bg-slate-100 text-slate-400'
                            : 'bg-blue-600 text-white hover:bg-blue-700',
                        )}
                      >
                        <Truck className="h-4 w-4" />
                        {started ? 'Xác nhận giao' : loading ? 'Đang xử lý...' : 'Bắt đầu giao'}
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  const renderDetailView = () => {
    if (!activeOrder) {
      return renderEmpty('Chưa có đơn đang giao', 'Chọn một đơn từ danh sách đã nhận để mở chi tiết giao hàng.');
    }

    const priceAmount = getOrderCollectAmount(activeOrder);

    return (
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-5 lg:col-span-2">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-slate-500">
                <Package className="h-4 w-4" />
                <span className="text-xs font-bold uppercase tracking-[0.2em]">Đang giao hàng</span>
              </div>
              <h3 className="mt-2 text-2xl font-black tracking-tight text-slate-900">
                Đơn #{activeOrder.orderId.slice(0, 8)}
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                Bấm &quot;Xác nhận đã giao&quot; — bạn cần tải ảnh minh chứng bàn giao (ảnh sản phẩm, người nhận, v.v.) trước khi hệ thống ghi nhận.
              </p>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={goBackToList}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
              >
                <ArrowLeft className="h-4 w-4" />
                Quay lại
              </button>
              <button
                type="button"
                onClick={() => activeOrderId && openConfirmDeliveryModal(activeOrderId)}
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
              >
                <ShieldCheck className="h-4 w-4" />
                Xác nhận đã giao
              </button>
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-white/70 bg-white p-4 shadow-sm">
              <div className="flex items-center gap-2 text-slate-500">
                <User className="h-4 w-4" />
                <span className="text-sm font-medium">Khách hàng</span>
              </div>
              <p className="mt-2 text-lg font-bold text-slate-900">{activeOrder.recipientName}</p>
            </div>
            <div className="rounded-xl border border-white/70 bg-white p-4 shadow-sm">
              <div className="flex items-center gap-2 text-slate-500">
                <Phone className="h-4 w-4" />
                <span className="text-sm font-medium">Số điện thoại</span>
              </div>
              <p className="mt-2 text-lg font-bold text-slate-900">{activeOrder.phoneNumber}</p>
            </div>
            <div className="rounded-xl border border-white/70 bg-white p-4 shadow-sm md:col-span-2">
              <div className="flex items-center gap-2 text-slate-500">
                <MapPin className="h-4 w-4" />
                <span className="text-sm font-medium">Địa chỉ giao hàng</span>
              </div>
              <p className="mt-2 text-lg font-bold leading-snug text-slate-900">
                {activeOrder.deliveryAddress}
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-4 lg:col-span-1">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2 text-slate-500">
              <Banknote className="h-4 w-4" />
              <span className="text-sm font-medium">Giá tiền</span>
            </div>
            <p className="mt-3 text-2xl font-black text-slate-900">{formatCurrency(priceAmount)}</p>
            <p className="mt-1 text-sm text-slate-500">Tổng tiền: {formatCurrency(activeOrder.totalAmount)}</p>
            <p className="text-sm text-slate-500">Đã cọc: -{formatCurrency(activeOrder.depositAmount)}</p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2 text-slate-500">
              <Package className="h-4 w-4" />
              <span className="text-sm font-medium">Sản phẩm</span>
            </div>
            <div className="mt-4 space-y-3">
              {activeOrder.items.map((item) => (
                <div key={item.orderItemId} className="flex items-start justify-between gap-4 border-b border-slate-100 pb-3 last:border-0 last:pb-0">
                  <div>
                    <p className="font-semibold text-slate-900">{item.lensName}</p>
                    <p className="text-xs text-slate-500">SL: {item.quantity}</p>
                  </div>
                  <p className="text-sm font-bold text-slate-900">{formatCurrency(item.totalPrice)}</p>
                </div>
              ))}
            </div>
          </div>

          {activeOrder.comboName && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5 shadow-sm">
              <div className="flex items-center gap-2 text-emerald-700">
                <Clock3 className="h-4 w-4" />
                <span className="text-sm font-medium">Combo</span>
              </div>
              <p className="mt-3 font-bold text-emerald-900">{activeOrder.comboName}</p>
              {activeOrder.comboDiscountAmount ? (
                <p className="mt-1 text-sm text-emerald-700">
                  Giảm: {formatCurrency(activeOrder.comboDiscountAmount)}
                </p>
              ) : null}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-full flex-col gap-6">
      <ConfirmDeliveryModal
        open={!!confirmOrderId}
        orderId={confirmOrderId}
        onClose={() => setConfirmOrderId(null)}
        onConfirm={handleConfirmDelivered}
      />

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {renderSummaryCard(
          'Đơn chờ nhận',
          readyToShipOrders.length,
          'Các đơn sẵn sàng để shipper chấp nhận.',
          <Package className="h-5 w-5 text-emerald-600" />,
          'bg-emerald-50',
        )}
        {renderSummaryCard(
          'Đã nhận',
          acceptedOrders.length,
          'Số đơn đã được gán vào lộ trình hiện tại.',
          <Truck className="h-5 w-5 text-blue-600" />,
          'bg-blue-50',
        )}
        {renderSummaryCard(
          'Đang giao hàng',
          deliveringCount,
          'Đơn shipper đang xử lý tại hiện trường.',
          <RefreshCw className="h-5 w-5 text-amber-600" />,
          'bg-amber-50',
        )}
        {renderSummaryCard(
          'Hoàn tất',
          completedCount,
          'Đơn đã được xác nhận giao thành công.',
          <CheckCircle2 className="h-5 w-5 text-slate-600" />,
          'bg-slate-100',
        )}
      </section>

      <section className="bg-white dark:bg-[#1a262d] rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex-1 flex flex-col overflow-hidden">
        {renderToolbar()}

        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div>
            <p className="mt-1 text-sm text-slate-500">
              {screen === 'detail'
                ? activeOrder ? `Xử lý đơn ${activeOrder.orderId}` : 'Chi tiết đơn giao hàng'
                : statusFilter === 'ALL'
                  ? `${allOrders.length} đơn`
                  : statusFilter === 'READY_TO_SHIP'
                    ? `${sortedReadyToShip.length} đơn chờ nhận`
                    : `${filteredAcceptedOrders.length} đơn`}
            </p>
          </div>

        </div>

        {error && (
          <div className="border-b border-red-100 bg-red-50 px-6 py-3 text-sm text-red-700">
            <div className="flex items-center justify-between gap-4">
              <span>{error}</span>
              <button type="button" onClick={handleRetry} className="font-semibold underline">
                Thử lại
              </button>
            </div>
          </div>
        )}

        {loading && allOrders.length === 0 ? (
          <div className="flex flex-1 items-center justify-center py-20">
            <div className="text-center">
              <Loader2 className="mx-auto h-10 w-10 animate-spin text-emerald-600" />
              <p className="mt-3 text-sm font-medium text-slate-500">Đang tải dữ liệu...</p>
            </div>
          </div>
        ) : screen === 'detail' ? (
          renderDetailView()
        ) : statusFilter === 'ALL' ? (
          renderAllTable()
        ) : statusFilter === 'READY_TO_SHIP' ? (
          renderSelectTable()
        ) : (
          renderAcceptedTable()
        )}
      </section>
    </div>
  );
};

export default ShipperDashboardPage;
