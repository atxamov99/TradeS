import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { ShoppingCart, Store, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import useShopStore from '../../store/shopStore';
import * as shopApi from '../../api/shop.api';

const STATUS_COLORS = {
  pending: 'bg-amber-100 text-amber-700',
  paid: 'bg-blue-100 text-blue-700',
  processing: 'bg-blue-100 text-blue-700',
  shipped: 'bg-indigo-100 text-indigo-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
};

// Next available action(s) for the seller from the order's current status.
const NEXT_ACTIONS = {
  pending: [
    { status: 'processing', labelKey: 'mark_processing', className: 'bg-green-500 hover:bg-green-600 text-white' },
    { status: 'cancelled', labelKey: 'mark_cancelled', className: 'border border-[#E2E8F0] dark:border-[#334155] text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10' },
  ],
  processing: [
    { status: 'shipped', labelKey: 'mark_shipped', className: 'bg-green-500 hover:bg-green-600 text-white' },
  ],
  shipped: [
    { status: 'delivered', labelKey: 'mark_delivered', className: 'bg-green-500 hover:bg-green-600 text-white' },
  ],
};

export default function IncomingOrders() {
  const { t, i18n } = useTranslation();
  const locale = i18n.language.startsWith('uz') ? 'uz-UZ' : i18n.language.startsWith('ru') ? 'ru-RU' : 'en-US';
  const activeShopId = useShopStore((s) => s.activeShopId);
  const shops = useShopStore((s) => s.shops);
  const activeShop = shops.find((s) => s.id === activeShopId);
  const qc = useQueryClient();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['shop-orders', activeShopId],
    queryFn: () => shopApi.getShopOrders(activeShopId, { limit: 50 }),
    enabled: !!activeShopId,
  });

  const orders = data?.data?.data?.orders || [];

  const statusMutation = useMutation({
    mutationFn: ({ orderId, orderStatus }) => shopApi.updateShopOrderStatus(activeShopId, orderId, orderStatus),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['shop-orders', activeShopId] });
      toast.success(t('order_status_updated'));
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || t('error_loading'));
    },
  });

  function fmt(n) {
    return Number(n || 0).toLocaleString(locale) + ' ' + t('currency');
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0F172A]">
      <div className="bg-white dark:bg-[#1E293B] border-b border-[#E2E8F0] dark:border-[#334155] px-5 py-4 sticky top-0 z-10">
        <h1 className="text-lg font-bold text-[#0F172A] dark:text-slate-100">{t('incoming_orders_nav')}</h1>
        {activeShop && <p className="text-xs text-[#64748B] dark:text-slate-400 mt-0.5">{activeShop.name}</p>}
      </div>

      <div className="px-4 sm:px-6 py-5 max-w-3xl mx-auto flex flex-col gap-4">
        {!activeShopId ? (
          <div className="text-center py-16 text-[#64748B] dark:text-slate-400">
            <Store size={40} className="mx-auto mb-3 opacity-40" />
            <p className="font-semibold">{t('select_shop_first')}</p>
          </div>
        ) : isError ? (
          <div className="text-center py-16">
            <AlertCircle size={40} className="mx-auto mb-3 text-red-400" />
            <p className="font-semibold text-red-500">{t('error_loading')}</p>
            <button onClick={() => refetch()} className="mt-3 text-sm text-green-600 font-semibold hover:underline">{t('retry')}</button>
          </div>
        ) : isLoading ? (
          <div className="flex flex-col gap-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white dark:bg-[#1E293B] rounded-2xl border border-[#E2E8F0] dark:border-[#334155] p-4 h-24 animate-pulse" />
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-16 text-[#64748B] dark:text-slate-400">
            <ShoppingCart size={40} className="mx-auto mb-3 opacity-40" />
            <p className="font-semibold">{t('no_orders_yet')}</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {orders.map((order) => (
              <div key={order.id} className="bg-white dark:bg-[#1E293B] rounded-2xl border border-[#E2E8F0] dark:border-[#334155] p-4">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="text-sm font-bold text-[#0F172A] dark:text-slate-100">{t('order_number_label')} {order.orderNumber}</p>
                    <p className="text-xs text-[#64748B] dark:text-slate-400 mt-0.5">
                      {t('buyer_label')}: {order.user?.name || '—'} {order.user?.phone ? `· ${order.user.phone}` : ''}
                    </p>
                  </div>
                  <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${STATUS_COLORS[order.orderStatus] || 'bg-gray-100 text-gray-600'}`}>
                    {t(`order_status_${order.orderStatus}`)}
                  </span>
                </div>
                <div className="space-y-1 border-t border-[#E2E8F0] dark:border-[#334155] pt-2 mt-2">
                  {(order.items || []).map((item, i) => (
                    <div key={i} className="flex justify-between text-sm">
                      <span className="text-[#64748B] dark:text-slate-400 truncate mr-2">{item.name} × {item.quantity}</span>
                      <span className="font-medium text-[#0F172A] dark:text-slate-100">{fmt(item.price * item.quantity)}</span>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between font-bold text-sm border-t border-[#E2E8F0] dark:border-[#334155] mt-2 pt-2">
                  <span className="text-[#64748B] dark:text-slate-400">{t('order_total_label')}</span>
                  <span className="text-[#0F172A] dark:text-slate-100">{fmt(order.totalPrice)}</span>
                </div>
                {(NEXT_ACTIONS[order.orderStatus] || []).length > 0 && (
                  <div className="flex gap-2 border-t border-[#E2E8F0] dark:border-[#334155] mt-2 pt-3">
                    {NEXT_ACTIONS[order.orderStatus].map((action) => (
                      <button
                        key={action.status}
                        disabled={statusMutation.isPending}
                        onClick={() => statusMutation.mutate({ orderId: order.id, orderStatus: action.status })}
                        className={`flex-1 h-10 rounded-xl text-sm font-semibold transition disabled:opacity-60 ${action.className}`}
                      >
                        {t(action.labelKey)}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
