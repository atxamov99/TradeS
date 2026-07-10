import { useEffect, useState } from "react";
import { salesCollection } from "@/db";
import { Sale } from "@/db/models/Sale";
import { Q } from "@nozbe/watermelondb";

type Period = "today" | "week" | "month";

const RANGES: Record<Period, number> = {
  today: 86_400_000,
  week: 7 * 86_400_000,
  month: 30 * 86_400_000,
};

/** Sotuvlar (davr bo'yicha, real-time) */
export function useSales(period: Period = "today") {
  const [sales, setSales] = useState<Sale[]>([]);

  useEffect(() => {
    const from = Date.now() - RANGES[period];
    const sub = salesCollection
      .query(Q.where("sold_at", Q.gte(from)), Q.sortBy("sold_at", Q.desc))
      .observe()
      .subscribe(setSales);
    return () => sub.unsubscribe();
  }, [period]);

  return sales;
}

/** Bugungi statistika */
export function useTodayStats() {
  const sales = useSales("today");
  const revenue = sales.reduce((s, x) => s + x.sellPrice * x.qty, 0);
  const profit = sales.reduce((s, x) => s + x.profit, 0);
  return { revenue, profit, count: sales.length, sales };
}
