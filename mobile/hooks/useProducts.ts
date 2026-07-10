import { useEffect, useState } from "react";
import { productsCollection } from "@/db";
import { Product } from "@/db/models/Product";
import { Q } from "@nozbe/watermelondb";

function useDebounce<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

/** Barcha aktiv tovarlar (real-time observable) */
export function useProducts(search?: string, categoryId?: string | null) {
  const [products, setProducts] = useState<Product[]>([]);
  const debouncedSearch = useDebounce(search ?? "", 300);

  useEffect(() => {
    const conditions = [Q.where("archived_at", null)];
    if (debouncedSearch) {
      conditions.push(Q.where("name", Q.like(`%${Q.sanitizeLikeString(debouncedSearch)}%`)));
    }
    if (categoryId) {
      conditions.push(Q.where("category_id", categoryId));
    }
    const sub = productsCollection.query(...conditions).observe().subscribe(setProducts);
    return () => sub.unsubscribe();
  }, [debouncedSearch, categoryId]);

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

/** Kam qolgan tovarlar soni (real-time) — tab badge uchun */
export function useLowStockCount() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const sub = productsCollection
      .query(Q.where("archived_at", null), Q.where("stock_qty", Q.lte(5)))
      .observeCount()
      .subscribe(setCount);
    return () => sub.unsubscribe();
  }, []);

  return count;
}

/** Kam qolgan tovarlar ro'yxati (≤5) — home dashboard uchun */
export function useLowStockProducts() {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    const sub = productsCollection
      .query(Q.where("archived_at", null), Q.where("stock_qty", Q.lte(5)))
      .observe()
      .subscribe(setProducts);
    return () => sub.unsubscribe();
  }, []);

  return products;
}

/** Jami aktiv tovarlar soni (tarif limiti uchun) */
export function useProductCount() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const sub = productsCollection
      .query(Q.where("archived_at", null))
      .observeCount()
      .subscribe(setCount);
    return () => sub.unsubscribe();
  }, []);

  return count;
}
