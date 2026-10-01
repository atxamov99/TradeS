/**
 * Oflayn sync engine — marketplace pivotidan keyin har mahsulot/sotuv bitta
 * do'konga (Shop) tegishli, shuning uchun bu yerdagi har bir pull/push
 * do'kon-context bilan ishlaydi:
 *
 *   GET  /shops/mine                       → foydalanuvchining o'z do'konlari (pullShops())
 *   GET  /shops/:id/products?limit=1000    → har do'konning o'z katalogi (pullProductCatalog())
 *   POST /sync/push  { operations: [...] } → mahalliy push (products + sales), har biri shopId bilan
 *   GET  /sync/pull?lastSyncAt=<ISO>       → foydalanuvchining barcha do'konlaridagi sotuvlari
 *
 * Eski versiyada `GET /products` (global, cheklanmagan katalog) ishlatilgan edi —
 * marketplace pivotidan keyin bu endpoint BUYER-side butun bozor katalogini qaytaradi
 * (barcha do'konlar), seller-side lokal POS bazasi uchun yaroqsiz. Shuning uchun endi
 * har bir egalik qilingan do'kon uchun alohida `GET /shops/:id/products` chaqiriladi.
 *
 * Konflikt qoidasi (ikkalasida ham): agar mahalliy yozuv hali push qilinmagan bo'lsa
 * (is_synced=false), pull uni ustidan yozmaydi — mahalliy tahrir har doim ustun, keyingi
 * sync push'da serverga jo'natiladi.
 *
 * runSync() — root layout da AppState "active" bo'lganda chaqiriladi.
 */
import {
  database,
  productsCollection,
  salesCollection,
  customersCollection,
  customerTxCollection,
  suppliersCollection,
  supplierTxCollection,
  employeesCollection,
  shopsCollection,
} from "@/db";
import { Product } from "@/db/models/Product";
import { Sale } from "@/db/models/Sale";
import { Q } from "@nozbe/watermelondb";
import { api } from "./api";
import { useSyncStore } from "@/store/syncStore";
import { useShopStore } from "@/store/shopStore";
import { mmkv } from "@/store/storage";

const LAST_PULL_KEY = "lastSyncAt";

type SyncOperation = {
  operation: "create" | "update" | "delete";
  entity: "product" | "sale";
  entityId: string;
  payload: Record<string, unknown>;
  clientUpdatedAt: number;
};

type SyncResult = { entityId: string; status: string; serverEntityId?: string };

type RemoteShop = {
  id: string;
  name: string;
  description: string;
  isBlocked: boolean;
};

type RemoteProduct = {
  id: string;
  name: string;
  buyPrice: number;
  sellPrice: number;
  stock: number;
  unit: string;
  isActive: boolean;
  shopId: string;
};

type RemoteSale = {
  id: string;
  shopId: string;
  productId: string | null;
  productName: string;
  quantity: number;
  sellPrice: number;
  profit: number;
  note: string | null;
  createdAt: string;
};

function toMillis(v: Date | number): number {
  return v instanceof Date ? v.getTime() : Number(v);
}

export async function runSync() {
  if (useSyncStore.getState().isSyncing) return;

  useSyncStore.getState().setSyncing(true);
  try {
    const pending = await getPendingCount();
    useSyncStore.getState().setPendingCount(pending);
    if (pending > 0) {
      await syncProducts();
      await syncSales();
    }
    // Pull har doim chaqiriladi — push uchun kutayotgan narsa bo'lmasa ham,
    // admin panel/webda qilingan o'zgarishlar bo'lishi mumkin.
    const shops = await pullShops();
    await pullProductCatalog(shops);
    await pullSync();
    useSyncStore.getState().setLastSynced();
    useSyncStore.getState().setLastError(null);
    useSyncStore.getState().setPendingCount(await getPendingCount());
  } catch (err: any) {
    console.warn("Sync error:", err);
    useSyncStore.getState().setLastError(err?.message ?? String(err));
    useSyncStore.getState().setPendingCount(await getPendingCount());
  } finally {
    useSyncStore.getState().setSyncing(false);
  }
}

async function syncProducts() {
  const allUnsynced = await database.collections
    .get<Product>("products")
    .query(Q.where("is_synced", false))
    .fetch();

  // A product created before any shop existed (or while offline, before the
  // active shop was resolved) has no shop_id yet — the backend requires one
  // on every synced product, so these are left pending rather than sent.
  const unsynced = allUnsynced.filter((p) => !!p.shopId);
  if (unsynced.length === 0) return;

  // Local id / server id → model, natijani qayta yozish uchun
  const byLocalId = new Map(unsynced.map((p) => [p.id, p]));
  const byServerId = new Map(
    unsynced.filter((p) => p.serverId).map((p) => [p.serverId as string, p])
  );

  // Stok ikki marta kamayib ketmasligi uchun (audit: CRITICAL) — mahalliy stok sotuv
  // yozilgan zahoti kamaytiriladi (`sales/add.tsx`), server esa har bir sotuv uchun
  // stokni O'ZI yana kamaytiradi (`backend/src/services/sale.service.js`). Agar biz
  // kamaytirilgan mahalliy stokni o'sha holicha yuborsak, ayni sotuv ikki marta
  // hisobdan chiqadi. Shuning uchun hali push qilinmagan sotuvlar miqdorini payload'da
  // QAYTA QO'SHAMIZ: server avval "sotuvlarsiz" stokni yozadi, keyin `syncSales()`
  // yuborgan har bir sotuv uni roppa-rosa bir marta kamaytiradi.
  // runSync() tartibi shuni kafolatlaydi: syncProducts() → syncSales().
  const pendingSales = await database.collections
    .get<Sale>("sales")
    .query(Q.where("is_synced", false))
    .fetch();
  const pendingQtyByProductId = new Map<string, number>();
  for (const s of pendingSales) {
    if (!s.productId) continue;
    pendingQtyByProductId.set(s.productId, (pendingQtyByProductId.get(s.productId) ?? 0) + s.qty);
  }

  const operations: SyncOperation[] = unsynced.map((p) => {
    // Faqat backend Product sxemasidagi maydonlar (payload prisma.create/update ga spread qilinadi)
    const payload = {
      shopId: p.shopId,
      name: p.name,
      buyPrice: p.buyPrice,
      sellPrice: p.sellPrice,
      price: p.sellPrice,
      // Hali yuborilmagan sotuvlar qaytarib qo'shiladi — yuqoridagi izohga qarang.
      stock: p.stockQty + (pendingQtyByProductId.get(p.id) ?? 0),
      unit: p.unit,
      isActive: p.archivedAt ? false : true,
    };

    if (p.serverId && p.archivedAt) {
      // Archived locally — tell the server to soft-delete (isActive:false) instead
      // of "update", which the server ignores for isActive (server-owned field).
      // Without this the product stays isActive:true forever and the next pull
      // resurrects the local archive too.
      return {
        operation: "delete",
        entity: "product",
        entityId: p.serverId,
        payload: { shopId: p.shopId },
        clientUpdatedAt: toMillis(p.updatedAt),
      };
    }
    if (p.serverId) {
      return {
        operation: "update",
        entity: "product",
        entityId: p.serverId,
        payload,
        clientUpdatedAt: toMillis(p.updatedAt),
      };
    }
    return {
      operation: "create",
      entity: "product",
      entityId: p.id,
      payload,
      clientUpdatedAt: toMillis(p.updatedAt),
    };
  });

  const { data: body } = await api.post("/sync/push", { operations });
  const results: SyncResult[] = body?.data?.results ?? body?.results ?? [];

  await database.write(async () => {
    for (const r of results) {
      if (r.status !== "synced") continue;
      const product = byLocalId.get(r.entityId) ?? byServerId.get(r.entityId);
      if (!product) continue;
      await product.update((p) => {
        if (r.serverEntityId) p.serverId = r.serverEntityId;
        p.isSynced = true;
      });
    }
  });
}

async function syncSales() {
  const allUnsynced = await database.collections
    .get<Sale>("sales")
    .query(Q.where("is_synced", false))
    .fetch();

  // Same reasoning as syncProducts(): a sale without a shop_id can't be pushed yet.
  const unsynced = allUnsynced.filter((s) => !!s.shopId);
  if (unsynced.length === 0) return;

  const byLocalId = new Map(unsynced.map((s) => [s.id, s]));

  const operations: SyncOperation[] = [];
  for (const s of unsynced) {
    // Local product id → server product id (backend faqat serverId bo'yicha stokni kamaytiradi).
    // Product hali sinxron bo'lmasa serverProductId=null — sotuv baribir yoziladi (stok kamaymaydi).
    let serverProductId: string | null = null;
    let buyPrice = 0;
    if (s.productId) {
      const local = await productsCollection.find(s.productId).catch(() => null);
      if (local) {
        serverProductId = local.serverId ?? null;
        buyPrice = local.buyPrice;
      }
    }
    // buyPrice topilmasa profit'dan hisoblaymiz (profit = (sell - buy) * qty)
    if (!buyPrice && s.qty > 0) buyPrice = s.sellPrice - s.profit / s.qty;

    operations.push({
      operation: "create",
      entity: "sale",
      entityId: s.id,
      payload: {
        shopId: s.shopId,
        product: serverProductId,
        productName: s.productName,
        quantity: s.qty,
        sellPrice: s.sellPrice,
        buyPrice,
        unit: "dona",
        note: s.note ?? "",
        createdAt: s.soldAt,
      },
      clientUpdatedAt: toMillis(s.updatedAt),
    });
  }

  const { data: body } = await api.post("/sync/push", { operations });
  const results: SyncResult[] = body?.data?.results ?? body?.results ?? [];

  await database.write(async () => {
    for (const r of results) {
      if (r.status !== "synced") continue;
      const sale = byLocalId.get(r.entityId);
      if (!sale) continue;
      await sale.update((s) => {
        if (r.serverEntityId) s.serverId = r.serverEntityId;
        s.isSynced = true;
      });
    }
  });
}

/**
 * Server → Mobile: foydalanuvchining o'z do'konlari ro'yxatini (`GET /shops/mine`)
 * olib kelib, mahalliy `shops` jadvaliga (serverId bo'yicha) upsert qiladi.
 * Bitta do'kon bo'lsa va hali faol do'kon tanlanmagan bo'lsa — avtomatik faollashtiradi.
 * Natijada qaytgan ro'yxat pullProductCatalog() ga uzatiladi (har do'kon uchun
 * alohida `GET /shops/:id/products` chaqirish uchun).
 */
async function pullShops(): Promise<RemoteShop[]> {
  const { data: body } = await api.get("/shops/mine");
  const payload = body?.data ?? body ?? {};
  const remoteShops: RemoteShop[] = payload.shops ?? [];

  const localByServerId = new Map(
    (await shopsCollection.query(Q.where("server_id", Q.oneOf(remoteShops.map((s) => s.id)))).fetch())
      .map((s) => [s.serverId, s])
  );

  await database.write(async () => {
    for (const rs of remoteShops) {
      const local = localByServerId.get(rs.id);
      if (local) {
        await local.update((s) => {
          s.name = rs.name;
          s.description = rs.description ?? "";
          s.isBlocked = rs.isBlocked;
          s.isSynced = true;
        });
      } else {
        await shopsCollection.create((s) => {
          s.serverId = rs.id;
          s.name = rs.name;
          s.description = rs.description ?? "";
          s.isBlocked = rs.isBlocked;
          s.isSynced = true;
        });
      }
    }
  });

  const { activeShopId, setActiveShop } = useShopStore.getState();
  if (!activeShopId && remoteShops.length === 1) {
    await setActiveShop(remoteShops[0].id);
  }

  return remoteShops;
}

/**
 * Server → Mobile: har bir do'kon uchun `GET /shops/:id/products` chaqirib,
 * mahalliy bazaga (serverId bo'yicha) upsert qiladi. Hali push qilinmagan
 * mahalliy yozuvlar (is_synced=false) ustidan yozilmaydi. Incremental emas —
 * har safar to'liq katalog qayta olinadi (kichik-o'rta do'kon uchun bu yetarli
 * va eng sodda yechim).
 *
 * MUHIM: bloklangan do'kondagi mahsulotlar ham keladi (owner sifatida), shuning
 * uchun bu funksiya `isBlocked` ni tekshirmaydi — do'konning o'zi UI'da bloklangan
 * deb ko'rsatiladi, mahsulotlar esa lokal saqlanaveradi.
 */
async function pullProductCatalog(shops: RemoteShop[]) {
  if (shops.length === 0) return;

  const remoteProducts: RemoteProduct[] = [];
  for (const shop of shops) {
    const { data: body } = await api.get(`/shops/${shop.id}/products`, { params: { limit: 1000 } });
    const payload = body?.data ?? body ?? {};
    const products: Omit<RemoteProduct, "shopId">[] = payload.products ?? [];
    for (const p of products) remoteProducts.push({ ...p, shopId: shop.id });
  }
  if (remoteProducts.length === 0) return;

  const localByServerId = new Map(
    (await productsCollection.query(Q.where("server_id", Q.oneOf(remoteProducts.map((p) => p.id)))).fetch())
      .map((p) => [p.serverId as string, p])
  );

  await database.write(async () => {
    for (const rp of remoteProducts) {
      const local = localByServerId.get(rp.id);
      if (local) {
        // Mahalliy tahrir hali serverga jo'natilmagan bo'lsa — pull uni bosib o'tmasin.
        if (!local.isSynced) continue;
        await local.update((p) => {
          p.name = rp.name;
          p.buyPrice = rp.buyPrice;
          p.sellPrice = rp.sellPrice;
          p.stockQty = rp.stock;
          p.unit = rp.unit;
          p.archivedAt = rp.isActive ? null : (p.archivedAt ?? Date.now());
          p.isSynced = true;
          p.shopId = rp.shopId;
        });
      } else {
        await productsCollection.create((p) => {
          p.name = rp.name;
          p.buyPrice = rp.buyPrice;
          p.sellPrice = rp.sellPrice;
          p.stockQty = rp.stock;
          p.unit = rp.unit;
          p.barcode = null;
          p.categoryId = null;
          p.archivedAt = rp.isActive ? null : Date.now();
          p.isSynced = true;
          p.serverId = rp.id;
          p.shopId = rp.shopId;
        });
      }
    }
  });
}

/**
 * Server → Mobile: shu foydalanuvchining sotuvlarini (boshqa qurilmada yozilgan bo'lsa)
 * olib kelib, mahalliy bazaga (serverId bo'yicha) qo'shadi.
 */
async function pullSync() {
  const lastSyncAt = await mmkv.getString(LAST_PULL_KEY);

  const { data: body } = await api.get("/sync/pull", {
    params: lastSyncAt ? { lastSyncAt } : undefined,
  });
  const payload = body?.data ?? body ?? {};
  const remoteSales: RemoteSale[] = payload.sales ?? [];
  const serverTime: string | undefined = payload.serverTime;

  if (remoteSales.length > 0) {
    const existingServerIds = new Set(
      (await salesCollection.query(Q.where("server_id", Q.oneOf(remoteSales.map((s) => s.id)))).fetch())
        .map((s) => s.serverId)
    );
    const newRemoteSales = remoteSales.filter((s) => !existingServerIds.has(s.id));

    if (newRemoteSales.length > 0) {
      // productId → mahalliy mahsulot id (topilmasa bo'sh qoldiriladi, UI productName'ga tayanadi)
      const remoteProductIds = [...new Set(newRemoteSales.map((s) => s.productId).filter(Boolean))] as string[];
      const localProductByServerId = new Map(
        remoteProductIds.length > 0
          ? (await productsCollection.query(Q.where("server_id", Q.oneOf(remoteProductIds))).fetch())
              .map((p) => [p.serverId as string, p.id])
          : []
      );

      await database.write(async () => {
        for (const rs of newRemoteSales) {
          await salesCollection.create((s) => {
            s.productId = (rs.productId && localProductByServerId.get(rs.productId)) || "";
            s.productName = rs.productName;
            s.qty = rs.quantity;
            s.sellPrice = rs.sellPrice;
            s.profit = rs.profit;
            s.note = rs.note ?? null;
            s.soldAt = new Date(rs.createdAt).getTime();
            s.shopId = rs.shopId;
            s.isSynced = true;
            s.serverId = rs.id;
          });
        }
      });
    }
  }

  if (serverTime) {
    await mmkv.setString(LAST_PULL_KEY, serverTime);
  }
}

export async function getPendingCount(): Promise<number> {
  const [products, sales] = await Promise.all([
    database.collections.get<Product>("products").query(Q.where("is_synced", false)).fetchCount(),
    database.collections.get<Sale>("sales").query(Q.where("is_synced", false)).fetchCount(),
  ]);
  return products + sales;
}

/**
 * Logout'dan OLDIN chaqiriladi (audit: CRITICAL) — `clearLocalData()` butun bazani
 * o'chiradi, lekin sync faqat products+sales bilan ishlaydi. Mijoz/yetkazuvchi qarz
 * daftari (`customers`, `suppliers` va ularning tranzaksiyalari) hamda `employees`
 * serverga umuman yuborilmaydi, ya'ni o'chirilsa tiklab bo'lmaydi. Shuning uchun
 * chiqishdan oldin foydalanuvchi nima yo'qotishini aniq ko'rsatish kerak.
 *
 *   pendingSync — serverga hali yuborilmagan tovar/sotuvlar (sync qilinsa saqlanadi)
 *   localOnly   — umuman sync qilinmaydigan yozuvlar (qaytarib bo'lmaydi)
 */
export async function getLocalDataAtRisk(): Promise<{ pendingSync: number; localOnly: number }> {
  const [pendingSync, customers, customerTx, suppliers, supplierTx, employees] = await Promise.all([
    getPendingCount(),
    customersCollection.query().fetchCount(),
    customerTxCollection.query().fetchCount(),
    suppliersCollection.query().fetchCount(),
    supplierTxCollection.query().fetchCount(),
    employeesCollection.query().fetchCount(),
  ]);

  return {
    pendingSync,
    localOnly: customers + customerTx + suppliers + supplierTx + employees,
  };
}

/**
 * Logout'da chaqiriladi (audit: HIGH H3) — lokal WatermelonDB'ni butunlay tozalaydi,
 * shu qurilmada keyingi kirgan foydalanuvchi avvalgi hisobning tovar/sotuvlarini
 * ko'rmasin. `lastSyncAt` ham reset qilinadi, aks holda keyingi foydalanuvchi uchun
 * `pullSync()` eski sanadan boshlab tortishga urinib, tarixiy sotuvlarni to'liq
 * qayta tiklamasligi mumkin.
 */
export async function clearLocalData() {
  await database.write(async () => {
    await database.unsafeResetDatabase();
  });
  await mmkv.delete(LAST_PULL_KEY);
  // Faol do'kon ham shu qurilma-foydalanuvchi juftligiga tegishli — aks holda
  // shu qurilmaga keyin kirgan boshqa foydalanuvchi avvalgi egasining do'kon
  // ID'sini "faol" deb meros qilib oladi.
  await useShopStore.getState().setActiveShop(null);
}
