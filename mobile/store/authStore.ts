import { create } from "zustand";
import { mmkv } from "./storage";

function simpleHash(s: string): string {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h) ^ s.charCodeAt(i);
  return (h >>> 0).toString(36);
}

interface AuthState {
  token: string | null;
  refreshToken: string | null;
  loadToken: () => Promise<void>;
  setToken: (token: string, refreshToken: string) => Promise<void>;
  clearToken: () => Promise<void>;
  saveEmailCredentials: (email: string, password: string, token: string, refresh: string) => Promise<void>;
  verifyEmailOffline: (email: string, password: string) => Promise<string | null>;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  refreshToken: null,

  loadToken: async () => {
    const token = await mmkv.getString("token");
    const refreshToken = await mmkv.getString("refreshToken");
    set({ token, refreshToken });
  },

  setToken: async (token, refreshToken) => {
    set({ token, refreshToken }); // state first — triggers re-render immediately
    mmkv.setString("token", token).catch(() => {});
    mmkv.setString("refreshToken", refreshToken).catch(() => {});
  },

  clearToken: async () => {
    set({ token: null, refreshToken: null });
    mmkv.delete("token").catch(() => {});
    mmkv.delete("refreshToken").catch(() => {});
    mmkv.delete("emailHash").catch(() => {});
    mmkv.delete("emailToken").catch(() => {});
    mmkv.delete("emailRefresh").catch(() => {});
  },

  saveEmailCredentials: async (email, password, token, refresh) => {
    const hash = simpleHash(email.toLowerCase() + "::" + password);
    await mmkv.setString("emailHash", hash);
    await mmkv.setString("emailToken", token);
    await mmkv.setString("emailRefresh", refresh);
    await mmkv.setString("token", token);
    await mmkv.setString("refreshToken", refresh);
    set({ token, refreshToken: refresh });
  },

  verifyEmailOffline: async (email, password) => {
    const stored = await mmkv.getString("emailHash");
    if (!stored) return null;
    const hash = simpleHash(email.toLowerCase() + "::" + password);
    if (stored !== hash) return null;
    return (await mmkv.getString("emailToken")) ?? null;
  },

}));
