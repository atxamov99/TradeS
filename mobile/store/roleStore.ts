import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { secureStorage } from "./storage";

export type UserRole = "admin" | "cashier";

interface RoleState {
  role: UserRole;
  load: () => Promise<void>;
  setRole: (role: UserRole) => Promise<void>;
  isAdmin: () => boolean;
  setPIN: (pin: string) => Promise<void>;
  verifyPIN: (pin: string) => Promise<boolean>;
  hasPIN: () => Promise<boolean>;
}

export const useRoleStore = create<RoleState>((set, get) => ({
  role: "admin",

  load: async () => {
    const role = ((await AsyncStorage.getItem("user_role")) as UserRole) || "admin";
    set({ role });

    // Bir martalik ko'chirish: eski (shifrlanmagan) AsyncStorage'dagi PIN topilsa
    // secure-store'ga o'tkaziladi — foydalanuvchi yangilanishdan keyin PIN'ini
    // qayta o'rnatishga majbur bo'lmasin.
    const legacyPin = await AsyncStorage.getItem("admin_pin");
    if (legacyPin) {
      const alreadyMigrated = await secureStorage.getString("admin_pin");
      if (!alreadyMigrated) await secureStorage.setString("admin_pin", legacyPin);
      await AsyncStorage.removeItem("admin_pin");
    }
  },

  setRole: async (role) => {
    await AsyncStorage.setItem("user_role", role);
    set({ role });
  },

  isAdmin: () => get().role === "admin",

  // PIN oddiy AsyncStorage'da emas — secure-store (Keychain/Keystore) da saqlanadi
  // (audit: HIGH H1, admin PIN oddiy matnda saqlanmasin).
  setPIN: async (pin) => {
    await secureStorage.setString("admin_pin", pin);
  },

  verifyPIN: async (pin) => {
    const stored = await secureStorage.getString("admin_pin");
    if (!stored) return pin === "0000";
    return stored === pin;
  },

  hasPIN: async () => {
    const stored = await secureStorage.getString("admin_pin");
    return stored !== null;
  },
}));
