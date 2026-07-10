/**
 * Oflayn sync engine — TradeS backend `/sync/push` kontrakti bilan.
 *
 * Backend kontrakti (backend/src/controllers/sync.controller.js):
 *   POST /sync/push  { operations: [{ operation, entity, entityId, payload, clientUpdatedAt }] }
 *   → { data: { results: [{ entityId, status: 'synced'|'failed', serverEntityId }] } }
 *
 * Strategiya: local-first push. Har bir sinxronlanmagan yozuv bitta operatsiyaga
 * aylantiriladi va batch qilib yuboriladi. Server "Last Write Wins" (clientUpdatedAt
 * vs updatedAt) bo'yicha product update'ni hal qiladi.
 *
 * runSync() — root layout da AppState "active" bo'lganda chaqiriladi.
 */
import { database } from "@/db";
import { Product } from "@/db/models/Product";
import { Sale } from "@/db/models/Sale";
import { Q } from "@nozbe/watermelondb";
import { api } from "./api";
import { useSyncStore } from "@/store/syncStore";

type SyncOperation = {
  operation: "create" | "update" | "delete";
  entity: "product" | "sale";
  entityId: string;
  payload: Record<string, unknown>;
  clientUpdatedAt: number;
};

type SyncResult = { entityId: string; status: string; serverEntityId?: string };

function toMillis(v: Date | number): number {
  return v instanceof Date ? v.getTime() : Number(v);
}

export async function runSync() {
  if (useSyncStore.getState().isSyncing) return;

  const pending = await getPendingCount();
  useSyncStore.getState().setPendingCount(pending);
  if (pending === 0) return;

  useSyncStore.getState().setSyncing(true);
  try {
    await syncProducts();
    await syncSales();
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

  const productsCollection = database.collections.get<Product>("products");
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

export async function getPendingCount(): Promise<number> {
  const [products, sales] = await Promise.all([
    database.collections.get<Product>("products").query(Q.where("is_synced", false)).fetchCount(),
    database.collections.get<Sale>("sales").query(Q.where("is_synced", false)).fetchCount(),
  ]);
  return products + sales;
}
