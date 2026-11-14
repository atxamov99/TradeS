import { create } from 'zustand';

// "Your account is blocked" state. Not persisted on purpose: the server is the source of truth,
// every page load re-asks it (/auth/me answers 403 ACCOUNT_BLOCKED while the account is blocked).
const useBanStore = create((set) => ({
  banned: false,
  setBanned: (banned) => set({ banned }),
}));

export default useBanStore;
