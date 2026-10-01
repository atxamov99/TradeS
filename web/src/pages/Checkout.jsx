import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CheckCircle, ShoppingBag } from 'lucide-react';
import useCartStore from '../store/cartStore';
import useAuthStore from '../store/authStore';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import * as ordersApi from '../api/orders.api';
import formatPrice from '../utils/formatPrice';
import toast from 'react-hot-toast';

export default function Checkout() {
  const { cart, fetchCart, resetCart } = useCartStore();
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [form, setForm] = useState({
    street: '', city: '', state: '', country: '', zipCode: '',
    paymentMethod: 'cash_on_delivery',
  });

  useEffect(() => {
    if (user) fetchCart();
  }, [user]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!cart?.items?.length) { toast.error("Savat bo'sh"); return; }

    setIsLoading(true);
    try {
      const { street, city, state, country, zipCode, paymentMethod } = form;
      const items = cart.items.map((i) => ({
        product: i.productId,
        quantity: i.quantity,
      }));

      const res = await ordersApi.createOrder({
        items,
        shippingAddress: { street, city, state, country, zipCode },
        paymentMethod,
      });

      const orders = res.data?.data?.orders || [];
      resetCart();
      toast.success(
        orders.length > 1
          ? `${orders.length} ta buyurtma yaratildi (har do'kon uchun alohida)`
          : 'Buyurtma muvaffaqiyatli yaratildi!'
      );
      navigate('/my-orders');
    } catch (err) {
      // The global axios interceptor toasts most errors but skips 401/422
      // (auth / validation) — surface those here so the user always gets feedback.
      const status = err.response?.status;
      if (status === 401 || status === 422) {
        toast.error(err.response?.data?.message || "Buyurtma berib bo'lmadi. Ma'lumotlarni tekshiring.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="container py-20 text-center">
        <ShoppingBag className="h-16 w-16 text-gray-300 mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2">Savat bo'sh</h2>
        <p className="text-gray-500 mb-6">Buyurtma berish uchun tizimga kiring.</p>
        <Link to="/login" className="btn-primary btn">Kirish</Link>
      </div>
    );
  }

  if (!cart || cart.items?.length === 0) {
    return (
      <div className="container py-20 text-center">
        <ShoppingBag className="h-16 w-16 text-gray-300 mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2">Savat bo'sh</h2>
        <p className="text-gray-500 mb-6">Buyurtma berishdan oldin mahsulot qo'shing.</p>
        <Link to="/products" className="btn-primary btn">Mahsulotlarni ko'rish</Link>
      </div>
    );
  }

  const total = cart?.totalPrice || 0;

  return (
    <div className="container py-8">
      <h1 className="text-2xl font-bold mb-8">Buyurtma berish</h1>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            {/* Shipping */}
            <div className="card p-6">
              <h2 className="font-bold text-lg mb-4">Yetkazib berish manzili</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <Input label="Ko'cha manzili" name="street" value={form.street} onChange={handleChange} required placeholder="Masalan: Amir Temur ko'chasi 12" />
                </div>
                <Input label="Shahar" name="city" value={form.city} onChange={handleChange} required placeholder="Toshkent" />
                <Input label="Viloyat" name="state" value={form.state} onChange={handleChange} required placeholder="Toshkent viloyati" />
                <Input label="Davlat" name="country" value={form.country} onChange={handleChange} required placeholder="O'zbekiston" />
                <Input label="Pochta indeksi" name="zipCode" value={form.zipCode} onChange={handleChange} required placeholder="100000" />
              </div>
            </div>

            {/* Payment */}
            <div className="card p-6">
              <h2 className="font-bold text-lg mb-4">To'lov usuli</h2>
              <div className="space-y-3">
                {[
                  { value: 'cash_on_delivery', label: 'Yetkazib berilganda naqd to\'lov' },
                  { value: 'card', label: 'Karta (mock)' },
                  { value: 'paypal', label: 'PayPal (mock)' },
                ].map((m) => (
                  <label key={m.value} className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 has-[:checked]:border-primary-500 has-[:checked]:bg-primary-50 dark:has-[:checked]:bg-primary-900/20">
                    <input type="radio" name="paymentMethod" value={m.value} checked={form.paymentMethod === m.value} onChange={handleChange} className="text-primary-600" />
                    <span className="text-sm font-medium">{m.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Summary */}
          <div className="card p-6 h-fit space-y-4">
            <h2 className="font-bold text-lg border-b pb-3">Buyurtma tarkibi ({cart?.totalItems})</h2>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {cart?.items?.map((item, i) => (
                <div key={i} className="flex justify-between text-sm">
                  <span className="text-gray-600 truncate mr-2">{item.product?.name} × {item.quantity}</span>
                  <span className="font-medium flex-shrink-0">{formatPrice(item.price * item.quantity)}</span>
                </div>
              ))}
            </div>
            <div className="space-y-2 border-t pt-3 text-sm">
              <div className="flex justify-between font-bold text-lg">
                <span>Jami</span><span>{formatPrice(total)}</span>
              </div>
            </div>
            <Button type="submit" isLoading={isLoading} className="w-full" size="lg">
              <CheckCircle className="h-4 w-4" /> Buyurtmani rasmiylashtirish
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
