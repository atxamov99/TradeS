import { create } from "zustand";

// "Account blocked by an admin" state. Not persisted: the server decides (every /auth/me answers 403
// ACCOUNT_BLOCKED while blocked, 200 again after an unblock).
interface BanState {
  banned: boolean;
  setBanned: (banned: boolean) => void;
}

export const useBanStore = create<BanState>((set) => ({
  banned: false,
  setBanned: (banned) => set({ banned }),
}));
