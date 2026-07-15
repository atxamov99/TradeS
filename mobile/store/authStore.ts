import { create } from "zustand";
import { secureStorage } from "./storage";

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
    const token = await secureStorage.getString("token");
    const refreshToken = await secureStorage.getString("refreshToken");
    set({ token, refreshToken });
  },

  setToken: async (token, refreshToken) => {
    set({ token, refreshToken }); // state first — triggers re-render immediately
    secureStorage.setString("token", token).catch(() => {});
    secureStorage.setString("refreshToken", refreshToken).catch(() => {});
  },

  clearToken: async () => {
    set({ token: null, refreshToken: null });
    secureStorage.delete("token").catch(() => {});
    secureStorage.delete("refreshToken").catch(() => {});
    secureStorage.delete("emailHash").catch(() => {});
    secureStorage.delete("emailToken").catch(() => {});
    secureStorage.delete("emailRefresh").catch(() => {});
  },

  saveEmailCredentials: async (email, password, token, refresh) => {
    const hash = simpleHash(email.toLowerCase() + "::" + password);
    await secureStorage.setString("emailHash", hash);
    await secureStorage.setString("emailToken", token);
    await secureStorage.setString("emailRefresh", refresh);
    await secureStorage.setString("token", token);
    await secureStorage.setString("refreshToken", refresh);
    set({ token, refreshToken: refresh });
  },

  verifyEmailOffline: async (email, password) => {
    const stored = await secureStorage.getString("emailHash");
    if (!stored) return null;
    const hash = simpleHash(email.toLowerCase() + "::" + password);
    if (stored !== hash) return null;
    return (await secureStorage.getString("emailToken")) ?? null;
  },

}));
