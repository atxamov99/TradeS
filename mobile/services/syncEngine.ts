/**
 * Oflayn sync engine — TradeS backend bilan ikki xil pull manbasi ishlatiladi:
 *
 *   POST /sync/push  { operations: [...] } → mahalliy push (products + sales)
 *   GET  /sync/pull?lastSyncAt=<ISO>       → SALES pull (foydalanuvchi bo'yicha to'g'ri
 *                                            cheklangan — backend/src/services/sale.service.js
 *                                            ham xuddi shunday scoping ishlatadi, web bilan mos)
 *   GET  /products?limit=1000              → PRODUCTS pull — bu GLOBAL KATALOG endpoint'i
 *                                            (backend/src/services/product.service.js: "shared
 *                                            global catalog... No ownerId filter on reads").
 *
 * MUHIM: mahsulotlar uchun /sync/pull ISHLATILMAYDI — chunki
 * backend/src/services/sync.service.js'dagi pullData() mahsulotlarni `createdById: userId`
 * bo'yicha cheklaydi (faqat shu foydalanuvchi yaratgan tovarlar). Bu web'dagi global katalog
 * bilan mos kelmaydi — boshqa foydalanuvchi (yoki admin panel) qo'shgan tovar hech qachon
 * mobilga qaytmas edi. Shuning uchun tovar katalogi uchun alohida, cheklanmagan
 * `GET /products` ishlatiladi (pullProductCatalog()).
 *
 * Konflikt qoidasi (ikkalasida ham): agar mahalliy yozuv hali push qilinmagan bo'lsa
 * (is_synced=false), pull uni ustidan yozmaydi — mahalliy tahrir har doim ustun, keyingi
 * sync push'da serverga jo'natiladi.
 *
 * runSync() — root layout da AppState "active" bo'lganda chaqiriladi.
 */
import { database, productsCollection, salesCollection } from "@/db";
import { Product } from "@/db/models/Product";
import { Sale } from "@/db/models/Sale";
import { Q } from "@nozbe/watermelondb";
import { api } from "./api";
import { useSyncStore } from "@/store/syncStore";
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

type RemoteProduct = {
  id: string;
  name: string;
  buyPrice: number;
  sellPrice: number;
  stock: number;
  unit: string;
  isActive: boolean;
};

type RemoteSale = {
  id: string;
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
    await pullProductCatalog();
    await pullSync();
    useSyncStore.getState().setLastSynced();
    useSyncStore.getState().setPendingCount(await getPendingCount());
  } catch (err) {
    console.warn("Sync error:", err);
    useSyncStore.getState().setPendingCount(await getPendingCount());
  } finally {
    useSyncStore.getState().setSyncing(false);
  }
}

async function syncProducts() {
  const unsynced = await database.collections
    .get<Product>("products")
    .query(Q.where("is_synced", false))
    .fetch();

  if (unsynced.length === 0) return;

  // Local id / server id → model, natijani qayta yozish uchun
  const byLocalId = new Map(unsynced.map((p) => [p.id, p]));
  const byServerId = new Map(
    unsynced.filter((p) => p.serverId).map((p) => [p.serverId as string, p])
  );

  const operations: SyncOperation[] = unsynced.map((p) => {
    // Faqat backend Product sxemasidagi maydonlar (payload prisma.create/update ga spread qilinadi)
    const payload = {
      name: p.name,
      buyPrice: p.buyPrice,
      sellPrice: p.sellPrice,
      price: p.sellPrice,
      stock: p.stockQty,
      unit: p.unit,
      isActive: p.archivedAt ? false : true,
    };

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
  const unsynced = await database.collections
    .get<Sale>("sales")
    .query(Q.where("is_synced", false))
    .fetch();

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
 * Server → Mobile: global tovar katalogini (`GET /products`, cheklanmagan — hamma
 * foydalanuvchining tovarlari) olib kelib, mahalliy bazaga (serverId bo'yicha) upsert
 * qiladi. Hali push qilinmagan mahalliy yozuvlar (is_synced=false) ustidan yozilmaydi.
 * Incremental emas — har safar to'liq katalog qayta olinadi (kichik-o'rta do'kon uchun
 * bu yetarli va eng sodda yechim).
 */
async function pullProductCatalog() {
  const { data: body } = await api.get("/products", { params: { limit: 1000 } });
  const payload = body?.data ?? body ?? {};
  const remoteProducts: RemoteProduct[] = payload.products ?? [];
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
