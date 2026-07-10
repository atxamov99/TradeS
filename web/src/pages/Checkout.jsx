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
    if (!cart?.items?.length) { toast.error('Cart is empty'); return; }

    setIsLoading(true);
    try {
      const { street, city, state, country, zipCode, paymentMethod } = form;
      const items = cart.items.map((i) => ({
        product: i.productId,
        quantity: i.quantity,
      }));

      await ordersApi.createOrder({
        items,
        shippingAddress: { street, city, state, country, zipCode },
        paymentMethod,
      });

      resetCart();
      toast.success('Order placed successfully!');
      navigate('/products');
    } catch (_) {
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="container py-20 text-center">
        <ShoppingBag className="h-16 w-16 text-gray-300 mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2">Your cart is empty</h2>
        <p className="text-gray-500 mb-6">Please login to checkout.</p>
        <Link to="/login" className="btn-primary btn">Login</Link>
      </div>
    );
  }

  if (!cart || cart.items?.length === 0) {
    return (
      <div className="container py-20 text-center">
        <ShoppingBag className="h-16 w-16 text-gray-300 mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2">Your cart is empty</h2>
        <p className="text-gray-500 mb-6">Add some products before checking out.</p>
        <Link to="/products" className="btn-primary btn">Browse Products</Link>
      </div>
    );
  }

  const subtotal = cart?.totalPrice || 0;
  const shipping = subtotal >= 50 ? 0 : 5;
  const tax = subtotal * 0.1;
  const total = subtotal + shipping + tax;

  return (
    <div className="container py-8">
      <h1 className="text-2xl font-bold mb-8">Checkout</h1>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            {/* Shipping */}
            <div className="card p-6">
              <h2 className="font-bold text-lg mb-4">Shipping Address</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <Input label="Street Address" name="street" value={form.street} onChange={handleChange} required placeholder="123 Main St" />
                </div>
                <Input label="City" name="city" value={form.city} onChange={handleChange} required placeholder="New York" />
                <Input label="State" name="state" value={form.state} onChange={handleChange} required placeholder="NY" />
                <Input label="Country" name="country" value={form.country} onChange={handleChange} required placeholder="United States" />
                <Input label="ZIP Code" name="zipCode" value={form.zipCode} onChange={handleChange} required placeholder="10001" />
              </div>
            </div>

            {/* Payment */}
            <div className="card p-6">
              <h2 className="font-bold text-lg mb-4">Payment Method</h2>
              <div className="space-y-3">
                {[
                  { value: 'cash_on_delivery', label: 'Cash on Delivery' },
                  { value: 'card', label: 'Credit / Debit Card (mock)' },
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
            <h2 className="font-bold text-lg border-b pb-3">Order Items ({cart?.totalItems})</h2>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {cart?.items?.map((item, i) => (
                <div key={i} className="flex justify-between text-sm">
                  <span className="text-gray-600 truncate mr-2">{item.product?.name} × {item.quantity}</span>
                  <span className="font-medium flex-shrink-0">{formatPrice(item.price * item.quantity)}</span>
                </div>
              ))}
            </div>
            <div className="space-y-2 border-t pt-3 text-sm">
              <div className="flex justify-between text-gray-500"><span>Subtotal</span><span>{formatPrice(subtotal)}</span></div>
              <div className="flex justify-between text-gray-500"><span>Shipping</span><span>{shipping === 0 ? 'Free' : formatPrice(shipping)}</span></div>
              <div className="flex justify-between text-gray-500"><span>Tax</span><span>{formatPrice(tax)}</span></div>
              <div className="flex justify-between font-bold text-lg border-t pt-2">
                <span>Total</span><span>{formatPrice(total)}</span>
              </div>
            </div>
            <Button type="submit" isLoading={isLoading} className="w-full" size="lg">
              <CheckCircle className="h-4 w-4" /> Place Order
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
