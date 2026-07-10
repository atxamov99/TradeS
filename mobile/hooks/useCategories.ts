import { useEffect, useState } from "react";
import { categoriesCollection } from "@/db";
import { Category } from "@/db/models/Category";

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    const sub = categoriesCollection.query().observe().subscribe(setCategories);
    return () => sub.unsubscribe();
  }, []);

  return categories;
}

export function useCategory(id: string | null) {
  const [category, setCategory] = useState<Category | null>(null);

  useEffect(() => {
    if (!id) { setCategory(null); return; }
    categoriesCollection.find(id).then(setCategory).catch(() => setCategory(null));
  }, [id]);

  return category;
}
