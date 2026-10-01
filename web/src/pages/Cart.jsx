import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Minus, Plus, Trash2, ShoppingBag } from 'lucide-react';
import useCartStore from '../store/cartStore';
import useAuthStore from '../store/authStore';
import Button from '../components/ui/Button';
import formatPrice from '../utils/formatPrice';

export default function Cart() {
  const { cart, fetchCart, updateItem, removeItem, isLoading } = useCartStore();
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();

  useEffect(() => {
    if (user) fetchCart();
  }, [user]);

  if (!user) {
    return (
      <div className="container py-20 text-center">
        <ShoppingBag className="h-16 w-16 text-gray-300 mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2">Savat bo'sh</h2>
        <p className="text-gray-500 mb-6">Savatni ko'rish uchun tizimga kiring.</p>
        <Link to="/login" className="btn-primary btn">Kirish</Link>
      </div>
    );
  }

  if (!cart || cart.items?.length === 0) {
    return (
      <div className="container py-20 text-center">
        <ShoppingBag className="h-16 w-16 text-gray-300 mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2">Savat bo'sh</h2>
        <p className="text-gray-500 mb-6">Boshlash uchun mahsulot qo'shing.</p>
        <Link to="/products" className="btn-primary btn">Mahsulotlarni ko'rish</Link>
      </div>
    );
  }

  const items = cart.items || [];
  const total = cart.totalPrice || 0;

  return (
    <div className="container py-8">
      <h1 className="text-2xl font-bold mb-8">Savat ({cart.totalItems} ta mahsulot)</h1>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Items */}
        <div className="lg:col-span-2 space-y-3">
          {items.map((item) => {
            const product = item.product;
            const productId = item.productId;
            const image = product?.images?.[0]?.url || 'https://placehold.co/100x100';
            return (
              <div key={item.id || productId} className="card p-4 flex gap-4">
                <Link to={`/products/${product?.slug || product?.id}`}>
                  <img src={image} alt={product?.name} className="h-20 w-20 rounded-lg object-cover bg-gray-100" />
                </Link>
                <div className="flex-1 min-w-0">
                  <Link to={`/products/${product?.slug || product?.id}`} className="font-medium text-sm hover:text-primary-600 line-clamp-1">
                    {product?.name}
                  </Link>
                  <p className="text-primary-600 font-semibold mt-1">{formatPrice(item.price)}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <div className="flex items-center border rounded-lg">
                      <button
                        onClick={() => (item.quantity > 1 ? updateItem(productId, item.quantity - 1) : removeItem(productId)).catch(() => {})}
                        className="p-1.5 hover:bg-gray-50 dark:hover:bg-gray-800"
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <span className="px-3 text-sm">{item.quantity}</span>
                      <button
                        onClick={() => updateItem(productId, item.quantity + 1).catch(() => {})}
                        disabled={item.quantity >= (product?.stock || 99)}
                        className="p-1.5 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <button
                      onClick={() => removeItem(productId).catch(() => {})}
                      className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-bold">{formatPrice(item.price * item.quantity)}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Summary */}
        <div className="card p-6 h-fit space-y-3">
          <h2 className="font-bold text-lg border-b pb-3">Buyurtma xulosasi</h2>
          <div className="flex justify-between font-bold text-lg pt-1">
            <span>Jami</span>
            <span>{formatPrice(total)}</span>
          </div>
          <Button className="w-full" size="lg" onClick={() => navigate('/checkout')}>
            Buyurtma berish
          </Button>
          <Link to="/products" className="block text-center text-sm text-primary-600 hover:text-primary-700">
            Xaridni davom ettirish
          </Link>
        </div>
      </div>
    </div>
  );
}
