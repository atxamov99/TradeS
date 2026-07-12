/**
 * IndexedDB wrapper for POS offline support.
 *
 * Stores:
 *   products     — cached product list from server
 *   pendingSales — sales queued while offline
 */

const DB_NAME = 'savdo_offline';
const DB_VERSION = 2;

let _db = null;

function openDB() {
  if (_db) return Promise.resolve(_db);

  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);

    req.onupgradeneeded = (e) => {
      const db = e.target.result;

      // v1 mistakenly used keyPath '_id' (Prisma uses 'id') — every product write
      // silently threw a DataError. Recreate the store correctly on upgrade.
      if (db.objectStoreNames.contains('products')) {
        db.deleteObjectStore('products');
      }
      db.createObjectStore('products', { keyPath: 'id' });

      if (!db.objectStoreNames.contains('pendingSales')) {
        const store = db.createObjectStore('pendingSales', {
          keyPath: 'id',
          autoIncrement: true,
        });
        store.createIndex('createdAt', 'createdAt');
      }

      if (!db.objectStoreNames.contains('meta')) {
        db.createObjectStore('meta', { keyPath: 'key' });
      }
    };

    req.onsuccess = (e) => {
      _db = e.target.result;
      resolve(_db);
    };

    req.onerror = () => reject(req.error);
  });
}

// ── Products ──────────────────────────────────────────────────────────────────

export async function cacheProducts(products) {
  const db = await openDB();
  const tx = db.transaction('products', 'readwrite');
  const store = tx.objectStore('products');

  // Clear old cache and write fresh
  store.clear();
  for (const p of products) {
    store.put(p);
  }

  return new Promise((res, rej) => {
    tx.oncomplete = () => res();
    tx.onerror = () => rej(tx.error);
  });
}

export async function getCachedProducts() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('products', 'readonly');
    const req = tx.objectStore('products').getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

// ── Pending sales ─────────────────────────────────────────────────────────────

export async function addPendingSale(sale) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('pendingSales', 'readwrite');
    const req = tx.objectStore('pendingSales').add({
      ...sale,
      createdAt: new Date().toISOString(),
    });
    req.onsuccess = () => resolve(req.result); // returns auto-generated id
    req.onerror = () => reject(req.error);
  });
}

export async function getPendingSales() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('pendingSales', 'readonly');
    const req = tx.objectStore('pendingSales').getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

export async function removePendingSale(id) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('pendingSales', 'readwrite');
    tx.objectStore('pendingSales').delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function clearPendingSales() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('pendingSales', 'readwrite');
    tx.objectStore('pendingSales').clear();
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// ── Meta (last sync time) ─────────────────────────────────────────────────────

export async function getLastSyncAt() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('meta', 'readonly');
    const req = tx.objectStore('meta').get('lastSyncAt');
    req.onsuccess = () => resolve(req.result?.value || null);
    req.onerror = () => reject(req.error);
  });
}

export async function setLastSyncAt(isoString) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('meta', 'readwrite');
    tx.objectStore('meta').put({ key: 'lastSyncAt', value: isoString });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
