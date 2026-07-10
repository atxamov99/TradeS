/**
 * AsyncStorage asosidagi oddiy data store.
 * WatermelonDB o'rniga — Expo Go da ishlaydi.
 */
import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";

export interface Product {
  id: string;
  name: string;
  buyPrice: number;
  sellPrice: number;
  stockQty: number;
  unit: string;
  archivedAt: number | null;
  createdAt: number;
}

export interface Sale {
  id: string;
  productId: string;
  productName: string;
  qty: number;
  sellPrice: number;
  profit: number;
  note: string | null;
  soldAt: number;
}

interface DataState {
  products: Product[];
  sales: Sale[];
  loaded: boolean;
  loadData: () => Promise<void>;
  addProduct: (p: Omit<Product, "id" | "createdAt" | "archivedAt">) => Promise<void>;
  updateProduct: (id: string, updates: Partial<Product>) => Promise<void>;
  archiveProduct: (id: string) => Promise<void>;
  addSale: (s: Omit<Sale, "id" | "soldAt">) => Promise<void>;
}

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

async function persist(key: string, value: unknown) {
  await AsyncStorage.setItem(key, JSON.stringify(value));
}

export const useDataStore = create<DataState>((set, get) => ({
  products: [],
  sales: [],
  loaded: false,

  loadData: async () => {
    const [rawProducts, rawSales] = await Promise.all([
      AsyncStorage.getItem("products"),
      AsyncStorage.getItem("sales"),
    ]);
    set({
      products: rawProducts ? JSON.parse(rawProducts) : [],
      sales: rawSales ? JSON.parse(rawSales) : [],
      loaded: true,
    });
  },

  addProduct: async (p) => {
    const product: Product = {
      ...p,
      id: uid(),
      archivedAt: null,
      createdAt: Date.now(),
    };
    const products = [...get().products, product];
    set({ products });
    await persist("products", products);
  },

  updateProduct: async (id, updates) => {
    const products = get().products.map((p) =>
      p.id === id ? { ...p, ...updates } : p
    );
    set({ products });
    await persist("products", products);
  },

  archiveProduct: async (id) => {
    const products = get().products.map((p) =>
      p.id === id ? { ...p, archivedAt: Date.now() } : p
    );
    set({ products });
    await persist("products", products);
  },

  addSale: async (s) => {
    const sale: Sale = { ...s, id: uid(), soldAt: Date.now() };
    const sales = [sale, ...get().sales];

    // stock kamaytirish
    const products = get().products.map((p) =>
      p.id === s.productId ? { ...p, stockQty: p.stockQty - s.qty } : p
    );

    set({ sales, products });
    await Promise.all([persist("sales", sales), persist("products", products)]);
  },
}));
