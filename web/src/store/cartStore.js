import { create } from 'zustand';
import * as cartApi from '../api/cart.api';
import toast from 'react-hot-toast';

const useCartStore = create((set, get) => ({
  cart: null,
  isLoading: false,

  fetchCart: async () => {
    set({ isLoading: true });
    try {
      const res = await cartApi.getCart();
      set({ cart: res.data.data.cart });
    } finally {
      set({ isLoading: false });
    }
  },

  addItem: async (productId, quantity = 1) => {
    try {
      const res = await cartApi.addToCart({ productId, quantity });
      set({ cart: res.data.data.cart });
      toast.success('Added to cart');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to add item');
    }
  },

  removeItem: async (productId) => {
    try {
      const res = await cartApi.removeFromCart(productId);
      set({ cart: res.data.data.cart });
      toast.success('Removed from cart');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to remove item');
    }
  },

  updateItem: async (productId, quantity) => {
    try {
      const res = await cartApi.updateCartItem(productId, { quantity });
      set({ cart: res.data.data.cart });
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to update item');
    }
  },

  clearCart: async () => {
    try {
      await cartApi.clearCart();
      set({ cart: { items: [], totalItems: 0, totalPrice: 0 } });
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to clear cart');
    }
  },

  resetCart: () => set({ cart: null }),

  itemCount: () => get().cart?.totalItems || 0,
  totalPrice: () => get().cart?.totalPrice || 0,
}));

export default useCartStore;
