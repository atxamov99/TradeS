import { useQuery } from '@tanstack/react-query';
import { Users, Package, ShoppingBag, DollarSign } from 'lucide-react';
import { OrderStatusBadge } from '../../components/ui/Badge';
import { TableSkeleton } from '../../components/ui/Skeleton';
import * as adminApi from '../../api/admin.api';

function StatCard({ icon: Icon, label, value, color }) {
  const colors = {
    blue: 'bg-blue-50 text-blue-600 dark:bg-blue-900/30',
    green: 'bg-green-50 text-green-600 dark:bg-green-900/30',
    purple: 'bg-purple-50 text-purple-600 dark:bg-purple-900/30',
    yellow: 'bg-yellow-50 text-yellow-600 dark:bg-yellow-900/30',
  };
  return (
    <div className="card p-6 flex items-center gap-4">
      <div className={`h-12 w-12 rounded-xl flex items-center justify-center flex-shrink-0 ${colors[color]}`}>
        <Icon className="h-6 w-6" />
      </div>
      <div>
        <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
        <p className="text-2xl font-bold">{value}</p>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: adminApi.getDashboardStats,
    refetchInterval: 30000,
  });

  const stats = data?.data?.data || {};

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Users} label="Total Users" value={stats.totalUsers ?? '—'} color="blue" />
        <StatCard icon={Package} label="Total Products" value={stats.totalProducts ?? '—'} color="purple" />
        <StatCard icon={ShoppingBag} label="Total Orders" value={stats.totalOrders ?? '—'} color="yellow" />
        <StatCard icon={DollarSign} label="Revenue" value={`$${(stats.totalRevenue || 0).toFixed(2)}`} color="green" />
      </div>

      {/* Orders by status */}
      {stats.ordersByStatus && (
        <div className="card p-6">
          <h2 className="font-bold mb-4">Orders by Status</h2>
          <div className="flex flex-wrap gap-3">
            {stats.ordersByStatus.map(({ _id, count }) => (
              <div key={_id} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-50 dark:bg-gray-800">
                <OrderStatusBadge status={_id} />
                <span className="font-bold">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent orders */}
      <div className="card p-6">
        <h2 className="font-bold mb-4">Recent Orders</h2>
        {isLoading ? (
          <TableSkeleton rows={5} cols={4} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b dark:border-gray-700 text-left text-gray-500 dark:text-gray-400">
                  <th className="pb-3 font-medium">Order #</th>
                  <th className="pb-3 font-medium">Customer</th>
                  <th className="pb-3 font-medium">Status</th>
                  <th className="pb-3 font-medium text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y dark:divide-gray-700">
                {(stats.recentOrders || []).map((order) => (
                  <tr key={order.id}>
                    <td className="py-3 font-mono text-xs">{order.orderNumber}</td>
                    <td className="py-3">{order.user?.name}</td>
                    <td className="py-3"><OrderStatusBadge status={order.orderStatus} /></td>
                    <td className="py-3 text-right font-medium">${order.totalPrice?.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
