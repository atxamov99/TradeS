import { create } from "zustand";
import { mmkv } from "./storage";

export interface AppUser {
  id?: string;
  name?: string;
  phone?: string;
  email?: string;
  role?: string;
}

interface UserState {
  user: AppUser | null;
  loadUser: () => Promise<void>;
  setUser: (user: AppUser | null | undefined) => Promise<void>;
  clearUser: () => Promise<void>;
}

export const useUserStore = create<UserState>((set) => ({
  user: null,

  loadUser: async () => {
    const raw = await mmkv.getString("user");
    if (!raw) return;
    try {
      set({ user: JSON.parse(raw) });
    } catch {
      // buzilgan JSON — e'tiborsiz qoldiramiz
    }
  },

  setUser: async (user) => {
    if (!user) return;
    set({ user });
    mmkv.setString("user", JSON.stringify(user)).catch(() => {});
  },

  clearUser: async () => {
    set({ user: null });
    mmkv.delete("user").catch(() => {});
  },
}));
