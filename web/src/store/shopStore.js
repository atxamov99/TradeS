import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import * as shopApi from '../api/shop.api';

// Seller-side "which of my shops am I managing right now" — mirrors the shop
// switcher built on mobile. Only `activeShopId` needs to survive a refresh;
// the shop list itself is refetched every session.
const useShopStore = create(
  persist(
    (set, get) => ({
      shops: [],
      max: 10,
      activeShopId: null,
      isLoading: false,

      fetchMyShops: async () => {
        set({ isLoading: true });
        try {
          const res = await shopApi.getMyShops();
          const { shops, max } = res.data.data;
          set((state) => {
            const stillValid = shops.some((s) => s.id === state.activeShopId);
            return {
              shops,
              max,
              activeShopId: stillValid ? state.activeShopId : (shops[0]?.id || null),
              isLoading: false,
            };
          });
          return shops;
        } catch (err) {
          set({ isLoading: false });
          throw err;
        }
      },

      createShop: async (data) => {
        const res = await shopApi.createShop(data);
        const shop = res.data.data.shop;
        set((state) => ({ shops: [...state.shops, shop], activeShopId: shop.id }));
        return shop;
      },

      setActiveShop: (shopId) => set({ activeShopId: shopId }),

      activeShop: () => get().shops.find((s) => s.id === get().activeShopId) || null,
    }),
    {
      name: 'savdo-active-shop',
      partialize: (state) => ({ activeShopId: state.activeShopId }),
    }
  )
);

export default useShopStore;
