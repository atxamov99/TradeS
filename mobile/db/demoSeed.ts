import { database } from "./index";

const CATEGORIES = [
  { name: "Non mahsulotlari", color: "#F59E0B" },
  { name: "Ichimliklar", color: "#3B82F6" },
  { name: "Shirinliklar", color: "#EC4899" },
  { name: "Konserva", color: "#10B981" },
  { name: "Sut mahsulotlari", color: "#8B5CF6" },
];

const PRODUCTS = [
  { name: "Oq non", buyPrice: 3000, sellPrice: 5000, stockQty: 25, unit: "dona", category: "Non mahsulotlari" },
  { name: "Baget", buyPrice: 3500, sellPrice: 6000, stockQty: 15, unit: "dona", category: "Non mahsulotlari" },
  { name: "Lavash", buyPrice: 4000, sellPrice: 7000, stockQty: 10, unit: "dona", category: "Non mahsulotlari" },
  { name: "Coca-Cola 1L", buyPrice: 8000, sellPrice: 12000, stockQty: 20, unit: "shisha", category: "Ichimliklar" },
  { name: "Fanta 1.5L", buyPrice: 9000, sellPrice: 14000, stockQty: 15, unit: "shisha", category: "Ichimliklar" },
  { name: "Suv 0.5L", buyPrice: 1500, sellPrice: 2500, stockQty: 50, unit: "shisha", category: "Ichimliklar" },
  { name: "Sharbat olma 1L", buyPrice: 10000, sellPrice: 16000, stockQty: 8, unit: "paket", category: "Ichimliklar" },
  { name: "Choy ko'k", buyPrice: 5000, sellPrice: 10000, stockQty: 12, unit: "paket", category: "Ichimliklar" },
  { name: "Pechene", buyPrice: 6000, sellPrice: 10000, stockQty: 18, unit: "paket", category: "Shirinliklar" },
  { name: "Konfet", buyPrice: 12000, sellPrice: 20000, stockQty: 7, unit: "kg", category: "Shirinliklar" },
  { name: "Shokolad", buyPrice: 10000, sellPrice: 18000, stockQty: 14, unit: "dona", category: "Shirinliklar" },
  { name: "Tort", buyPrice: 25000, sellPrice: 45000, stockQty: 3, unit: "dona", category: "Shirinliklar" },
  { name: "Tuzlangan bodring", buyPrice: 8000, sellPrice: 14000, stockQty: 10, unit: "banka", category: "Konserva" },
  { name: "Pomidor pastasi", buyPrice: 7000, sellPrice: 12000, stockQty: 9, unit: "banka", category: "Konserva" },
  { name: "Konserva no'xat", buyPrice: 9000, sellPrice: 15000, stockQty: 6, unit: "banka", category: "Konserva" },
  { name: "Sut 1L", buyPrice: 7000, sellPrice: 11000, stockQty: 12, unit: "paket", category: "Sut mahsulotlari" },
  { name: "Qatiq", buyPrice: 5000, sellPrice: 9000, stockQty: 20, unit: "dona", category: "Sut mahsulotlari" },
  { name: "Pishloq", buyPrice: 15000, sellPrice: 25000, stockQty: 5, unit: "kg", category: "Sut mahsulotlari" },
  { name: "Yog' 200g", buyPrice: 11000, sellPrice: 18000, stockQty: 8, unit: "dona", category: "Sut mahsulotlari" },
  { name: "Tuxum 30 dona", buyPrice: 18000, sellPrice: 28000, stockQty: 4, unit: "quti", category: "Sut mahsulotlari" },
];

const SUPPLIERS = [
  { name: "Aziz oziq-ovqat", phone: "+998901234567", debt: 150000 },
  { name: "Bunyod distributori", phone: "+998902345678", debt: 0 },
  { name: "G'iyosiddin ulgurji", phone: "+998903456789", debt: 85000 },
];

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomDate(daysAgo: number) {
  const d = new Date();
  d.setDate(d.getDate() - randomInt(0, daysAgo));
  return d.getTime();
}

export async function seedDemoData() {
  const existing = await database.collections.get("products").query().fetchCount();
  if (existing > 0) return;

  const now = Date.now();

  await database.write(async () => {
    const catRecords: Record<string, string> = {};
    for (const c of CATEGORIES) {
      const record = await database.collections.get("categories").create((p: any) => {
        p.name = c.name;
        p.color = c.color;
        p._raw.created_at = now;
        p._raw.updated_at = now;
      });
      catRecords[c.name] = record.id;
    }

    for (const p of PRODUCTS) {
      await database.collections.get("products").create((r: any) => {
        r.name = p.name;
        r.buyPrice = p.buyPrice;
        r.sellPrice = p.sellPrice;
        r.stockQty = p.stockQty;
        r.unit = p.unit;
        r.categoryId = catRecords[p.category];
        r.isSynced = true;
        r._raw.created_at = now;
        r._raw.updated_at = now;
      });
    }

    for (const s of SUPPLIERS) {
      await database.collections.get("suppliers").create((r: any) => {
        r.name = s.name;
        r.phone = s.phone;
        r.debt = s.debt;
        r._raw.created_at = now;
        r._raw.updated_at = now;
      });
    }

    const allProducts = await database.collections.get("products").query().fetch();

    const saleDates = [1, 2, 3, 4, 7, 10, 14];
    for (const daysAgo of saleDates) {
      const count = randomInt(2, 5);
      for (let i = 0; i < count; i++) {
        const product = allProducts[randomInt(0, allProducts.length - 1)];
        const qty = randomInt(1, 5);
        const sellPrice = product.sellPrice;
        const buyPrice = product.buyPrice;
        const profit = (sellPrice - buyPrice) * qty;
        await database.collections.get("sales").create((r: any) => {
          r.productId = product.id;
          r.productName = product.name;
          r.qty = qty;
          r.sellPrice = sellPrice;
          r.profit = profit;
          r.soldAt = randomDate(daysAgo);
          r.isSynced = true;
          r._raw.created_at = now;
          r._raw.updated_at = now;
        });
      }
    }
  });
}
