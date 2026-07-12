import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { OrderStatusBadge } from '../../components/ui/Badge';
import Pagination from '../../components/ui/Pagination';
import { TableSkeleton } from '../../components/ui/Skeleton';
import * as adminApi from '../../api/admin.api';
import toast from 'react-hot-toast';

const STATUS_OPTIONS = ['pending', 'paid', 'shipped', 'delivered', 'cancelled'];

export default function AdminOrders() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-orders', page, statusFilter],
    queryFn: () => adminApi.getAllOrders({ page, limit: 15, status: statusFilter }),
    keepPreviousData: true,
  });

  const result = data?.data?.data || {};
  const orders = result.orders || [];

  const updateMutation = useMutation({
    mutationFn: ({ id, orderStatus }) => adminApi.updateOrderStatus(id, { orderStatus }),
    onSuccess: () => { qc.invalidateQueries(['admin-orders']); toast.success(t('admin_order_status_updated')); },
  });

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t('admin_orders_title')}</h1>
        <span className="text-sm text-gray-500 dark:text-gray-400">{result.total || 0} {t('admin_total_suffix')}</span>
      </div>

      <div>
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} className="input w-auto">
          <option value="">{t('admin_all_statuses')}</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s} className="capitalize">{t(`order_status_${s}`)}</option>
          ))}
        </select>
      </div>

      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="p-6"><TableSkeleton rows={8} cols={5} /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr className="text-left text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  <th className="px-4 py-3 font-medium">{t('admin_order_number')}</th>
                  <th className="px-4 py-3 font-medium">{t('admin_customer')}</th>
                  <th className="px-4 py-3 font-medium">{t('admin_col_date')}</th>
                  <th className="px-4 py-3 font-medium">{t('admin_col_status')}</th>
                  <th className="px-4 py-3 font-medium">{t('admin_col_total')}</th>
                  <th className="px-4 py-3 font-medium">{t('admin_update_status_col')}</th>
                </tr>
              </thead>
              <tbody className="divide-y dark:divide-gray-700">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="px-4 py-3 font-mono text-xs">{order.orderNumber}</td>
                    <td className="px-4 py-3">
                      <p className="font-medium">{order.user?.name}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">{order.user?.email}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{new Date(order.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 py-3"><OrderStatusBadge status={order.orderStatus} /></td>
                    <td className="px-4 py-3 font-bold">${order.totalPrice?.toFixed(2)}</td>
                    <td className="px-4 py-3">
                      <select
                        value={order.orderStatus}
                        onChange={(e) => updateMutation.mutate({ id: order.id, orderStatus: e.target.value })}
                        className="input py-1.5 text-xs w-32"
                      >
                        {STATUS_OPTIONS.map((s) => (
                          <option key={s} value={s} className="capitalize">{t(`order_status_${s}`)}</option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="flex justify-end">
        <Pagination page={page} pages={result.pages || 1} onPageChange={setPage} />
      </div>
    </div>
  );
}
