import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Package, ShoppingBag } from 'lucide-react';
import * as ordersApi from '../api/orders.api';
import formatPrice from '../utils/formatPrice';

const STATUS_LABELS = {
  pending: "Kutilmoqda",
  paid: "To'landi",
  processing: 'Tayyorlanmoqda',
  shipped: "Jo'natildi",
  delivered: 'Yetkazildi',
  cancelled: 'Bekor qilindi',
};

const STATUS_COLORS = {
  pending: 'bg-amber-100 text-amber-700',
  paid: 'bg-blue-100 text-blue-700',
  processing: 'bg-blue-100 text-blue-700',
  shipped: 'bg-indigo-100 text-indigo-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
};

export default function MyOrders() {
  const { data, isLoading } = useQuery({
    queryKey: ['my-orders'],
    queryFn: () => ordersApi.getMyOrders({ limit: 50 }),
  });

  const orders = data?.data?.data?.orders || [];

  return (
    <div className="container py-8">
      <h1 className="text-2xl font-bold mb-8">Buyurtmalarim</h1>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="card p-5 h-24 animate-pulse bg-gray-100 dark:bg-gray-800" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <ShoppingBag className="h-16 w-16 mx-auto mb-4 text-gray-300" />
          <p className="text-lg font-medium">Hali buyurtma yo'q</p>
          <Link to="/products" className="btn-primary btn mt-4 inline-flex">Xarid qilishni boshlash</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="card p-5">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="font-semibold text-sm">№ {order.orderNumber}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {order.shop?.name && <span className="mr-2">{order.shop.name}</span>}
                    {new Date(order.createdAt).toLocaleDateString('uz-UZ')}
                  </p>
                </div>
                <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${STATUS_COLORS[order.orderStatus] || 'bg-gray-100 text-gray-600'}`}>
                  {STATUS_LABELS[order.orderStatus] || order.orderStatus}
                </span>
              </div>

              <div className="space-y-1.5 border-t pt-3">
                {(order.items || []).map((item, i) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span className="text-gray-600 truncate mr-2 flex items-center gap-1.5">
                      <Package className="h-3.5 w-3.5 flex-shrink-0" /> {item.name} × {item.quantity}
                    </span>
                    <span className="font-medium flex-shrink-0">{formatPrice(item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>

              <div className="flex justify-between font-bold text-sm border-t mt-3 pt-3">
                <span>Jami</span>
                <span>{formatPrice(order.totalPrice)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
