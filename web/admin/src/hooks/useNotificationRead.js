import { useEffect, useState } from "react";

// Notifications here aren't backed by a DB model (see adminData.js —
// notificationFeed/recentActivity are computed fresh from users/audit-logs
// on every poll), so there's no server-side "read" flag to update. Read
// state is tracked client-side by a content-derived key, persisted to
// localStorage so it survives reloads and is shared between the header
// bell and the full Bildirishnomalar page.
//
// Module-level (not per-hook-instance) state + a subscriber list: both the
// bell and the page call useNotificationRead() independently, and without
// this a "mark all read" in one wouldn't repaint the other until it
// remounted (localStorage itself has no same-tab change notification).
const STORAGE_KEY = "trades-admin-notifications-read";

function loadReadKeys() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

let sharedReadKeys = loadReadKeys();
const listeners = new Set();

function commit(next) {
  sharedReadKeys = next;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...next]));
  } catch {
    /* localStorage unavailable — read state just won't persist */
  }
  listeners.forEach((fn) => fn(next));
}

export function useNotificationRead() {
  const [readKeys, setReadKeys] = useState(sharedReadKeys);

  useEffect(() => {
    listeners.add(setReadKeys);
    return () => listeners.delete(setReadKeys);
  }, []);

  const isRead = (key) => readKeys.has(key);

  const markRead = (key) => {
    if (readKeys.has(key)) return;
    commit(new Set(readKeys).add(key));
  };

  const markAllRead = (keys) => {
    commit(new Set([...readKeys, ...keys]));
  };

  return { isRead, markRead, markAllRead };
}
