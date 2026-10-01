import { create } from "zustand";

interface SyncState {
  isSyncing: boolean;
  isOnline: boolean;
  pendingCount: number;
  lastSyncedAt: number | null;
  lastError: string | null;
  setOnline: (online: boolean) => void;
  setSyncing: (syncing: boolean) => void;
  setPendingCount: (count: number) => void;
  setLastSynced: () => void;
  setLastError: (error: string | null) => void;
}

export const useSyncStore = create<SyncState>((set) => ({
  isSyncing: false,
  isOnline: true,
  pendingCount: 0,
  lastSyncedAt: null,
  lastError: null,

  setOnline: (isOnline) => set({ isOnline }),
  setSyncing: (isSyncing) => set({ isSyncing }),
  setPendingCount: (pendingCount) => set({ pendingCount }),
  setLastSynced: () => set({ lastSyncedAt: Date.now() }),
  setLastError: (lastError) => set({ lastError }),
}));
