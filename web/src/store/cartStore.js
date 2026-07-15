import { create } from 'zustand';
import * as cartApi from '../api/cart.api';
import toast from 'react-hot-toast';

const useCartStore = create((set, get) => ({
  cart: null,
  isLoading: false,

  // Read: non-fatal on failure — keep any existing cart, the axios interceptor
  // surfaces the error toast. Called fire-and-forget from effects.
  fetchCart: async () => {
    set({ isLoading: true });
    try {
      const res = await cartApi.getCart();
      set({ cart: res.data.data.cart });
    } catch (err) {
      console.error('Failed to fetch cart', err);
    } finally {
      set({ isLoading: false });
    }
  },

  // Mutations: rethrow so callers can react (e.g. revert optimistic UI). The
  // axios interceptor already shows the user-facing error toast.
  addItem: async (productId, quantity = 1) => {
    try {
      const res = await cartApi.addToCart({ productId, quantity });
      set({ cart: res.data.data.cart });
      toast.success('Added to cart');
    } catch (err) {
      throw err;
    }
  },

  removeItem: async (productId) => {
    try {
      const res = await cartApi.removeFromCart(productId);
      set({ cart: res.data.data.cart });
      toast.success('Removed from cart');
    } catch (err) {
      throw err;
    }
  },

  updateItem: async (productId, quantity) => {
    try {
      const res = await cartApi.updateCartItem(productId, { quantity });
      set({ cart: res.data.data.cart });
    } catch (err) {
      throw err;
    }
  },

  clearCart: async () => {
    try {
      await cartApi.clearCart();
      set({ cart: { items: [], totalItems: 0, totalPrice: 0 } });
    } catch (err) {
      throw err;
    }
  },

  resetCart: () => set({ cart: null }),

  itemCount: () => get().cart?.totalItems || 0,
  totalPrice: () => get().cart?.totalPrice || 0,
}));

export default useCartStore;
