import { create } from "zustand";
import { mmkv } from "./storage";

const ACTIVE_SHOP_KEY = "activeShopId";

// activeShopId — backend Shop.id (server id), not the local WatermelonDB row id.
// Every API call that needs a shop (GET /shops/:id/products, sync push payloads,
// order/sale creation) takes the server id directly, so storing that avoids an
// extra local→server lookup everywhere it's used.
interface ShopState {
  activeShopId: string | null;
  loaded: boolean;
  loadActiveShop: () => Promise<void>;
  setActiveShop: (shopId: string | null) => Promise<void>;
}

export const useShopStore = create<ShopState>((set) => ({
  activeShopId: null,
  loaded: false,

  loadActiveShop: async () => {
    const id = await mmkv.getString(ACTIVE_SHOP_KEY);
    set({ activeShopId: id, loaded: true });
  },

  setActiveShop: async (shopId) => {
    set({ activeShopId: shopId });
    if (shopId) {
      await mmkv.setString(ACTIVE_SHOP_KEY, shopId);
    } else {
      await mmkv.delete(ACTIVE_SHOP_KEY);
    }
  },
}));
