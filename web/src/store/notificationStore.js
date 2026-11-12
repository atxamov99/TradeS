import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const MAX_ITEMS = 50;
const MAX_TOASTS = 3;
let seq = 0;

/**
 * Notification centre.
 *  - `items`  : the history shown in the bell panel (persisted, newest first)
 *  - `toasts` : ids of items currently floating as small pop-ups (transient, swipe/auto dismissed)
 * `key` de-duplicates recurring alerts (e.g. "low:<productId>"): the same alert with the same text is
 * not added or popped again, a changed text refreshes it and pops it once more.
 */
const useNotificationStore = create(
  persist(
    (set, get) => ({
      items: [],
      toasts: [],
      panelOpen: false,

      notify: ({ type = 'info', title, message = '', key, link, toast = true }) => {
        const now = Date.now();
        const { items, toasts } = get();
        if (key) {
          const existing = items.find((n) => n.key === key);
          if (existing) {
            if (existing.title === title && existing.message === message) return existing.id;
            set({
              items: items.map((n) => (n.id === existing.id ? { ...n, type, title, message, link, ts: now, read: false } : n)),
              toasts: toast ? [...toasts.filter((x) => x !== existing.id), existing.id].slice(-MAX_TOASTS) : toasts,
            });
            return existing.id;
          }
        }
        const id = `${now}-${++seq}`;
        set({
          items: [{ id, type, title, message, link, key, ts: now, read: false }, ...items].slice(0, MAX_ITEMS),
          toasts: toast ? [...toasts, id].slice(-MAX_TOASTS) : toasts,
        });
        return id;
      },

      dismissToast: (id) => set({ toasts: get().toasts.filter((x) => x !== id) }),
      markRead: (id) => set({ items: get().items.map((n) => (n.id === id ? { ...n, read: true } : n)) }),
      markAllRead: () => set({ items: get().items.map((n) => ({ ...n, read: true })) }),
      remove: (id) => set({ items: get().items.filter((n) => n.id !== id), toasts: get().toasts.filter((x) => x !== id) }),
      removeByKey: (key) => {
        const ids = get().items.filter((n) => n.key === key).map((n) => n.id);
        if (!ids.length) return;
        set({ items: get().items.filter((n) => n.key !== key), toasts: get().toasts.filter((x) => !ids.includes(x)) });
      },
      clear: () => set({ items: [], toasts: [] }),
      setPanelOpen: (open) => set({ panelOpen: open }),
    }),
    { name: 'savdo-notifications', partialize: (s) => ({ items: s.items }) }
  )
);

/** Convenience for non-React code (e.g. the axios interceptor). */
export const notify = (payload) => useNotificationStore.getState().notify(payload);

export default useNotificationStore;
