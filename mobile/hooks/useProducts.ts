import { useEffect, useState } from "react";
import { productsCollection } from "@/db";
import { Product } from "@/db/models/Product";
import { Q } from "@nozbe/watermelondb";
import { useShopStore } from "@/store/shopStore";

function useDebounce<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

/** Faol do'konning aktiv tovarlari (real-time observable). Faol do'kon tanlanmagan
 * bo'lsa bo'sh ro'yxat qaytaradi — seller ekranlari endi do'kon-kontekstiga bog'liq. */
export function useProducts(search?: string, categoryId?: string | null) {
  const [products, setProducts] = useState<Product[]>([]);
  const debouncedSearch = useDebounce(search ?? "", 300);
  const activeShopId = useShopStore((s) => s.activeShopId);

  useEffect(() => {
    if (!activeShopId) {
      setProducts([]);
      return;
    }
    const conditions = [Q.where("archived_at", null), Q.where("shop_id", activeShopId)];
    if (debouncedSearch) {
      conditions.push(Q.where("name", Q.like(`%${Q.sanitizeLikeString(debouncedSearch)}%`)));
    }
    if (categoryId) {
      conditions.push(Q.where("category_id", categoryId));
    }
    const sub = productsCollection.query(...conditions).observe().subscribe(setProducts);
    return () => sub.unsubscribe();
  }, [debouncedSearch, categoryId, activeShopId]);

  return products;
}

/** Bitta tovar (ID bo'yicha) */
export function useProduct(id: string) {
  const [product, setProduct] = useState<Product | null>(null);

  useEffect(() => {
    if (!id) return;
    const sub = productsCollection.query(Q.where("id", id)).observe().subscribe((rows) => {
      setProduct(rows[0] ?? null);
    });
    return () => sub.unsubscribe();
  }, [id]);

  return product;
}

/** Faol do'konda kam qolgan tovarlar soni (real-time) — tab badge uchun */
export function useLowStockCount() {
  const [count, setCount] = useState(0);
  const activeShopId = useShopStore((s) => s.activeShopId);

  useEffect(() => {
    if (!activeShopId) {
      setCount(0);
      return;
    }
    const sub = productsCollection
      .query(Q.where("archived_at", null), Q.where("stock_qty", Q.lte(5)), Q.where("shop_id", activeShopId))
      .observeCount()
      .subscribe(setCount);
    return () => sub.unsubscribe();
  }, [activeShopId]);

  return count;
}

/** Faol do'konda kam qolgan tovarlar ro'yxati (≤5) — home dashboard uchun */
export function useLowStockProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const activeShopId = useShopStore((s) => s.activeShopId);

  useEffect(() => {
    if (!activeShopId) {
      setProducts([]);
      return;
    }
    const sub = productsCollection
      .query(Q.where("archived_at", null), Q.where("stock_qty", Q.lte(5)), Q.where("shop_id", activeShopId))
      .observe()
      .subscribe(setProducts);
    return () => sub.unsubscribe();
  }, [activeShopId]);

  return products;
}

/** Faol do'kondagi jami aktiv tovarlar soni (tarif limiti uchun) */
export function useProductCount() {
  const [count, setCount] = useState(0);
  const activeShopId = useShopStore((s) => s.activeShopId);

  useEffect(() => {
    if (!activeShopId) {
      setCount(0);
      return;
    }
    const sub = productsCollection
      .query(Q.where("archived_at", null), Q.where("shop_id", activeShopId))
      .observeCount()
      .subscribe(setCount);
    return () => sub.unsubscribe();
  }, [activeShopId]);

  return count;
}
