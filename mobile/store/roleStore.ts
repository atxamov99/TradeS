import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";

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
  },

  setRole: async (role) => {
    await AsyncStorage.setItem("user_role", role);
    set({ role });
  },

  isAdmin: () => get().role === "admin",

  setPIN: async (pin) => {
    await AsyncStorage.setItem("admin_pin", pin);
  },

  verifyPIN: async (pin) => {
    const stored = await AsyncStorage.getItem("admin_pin");
    if (!stored) return pin === "0000";
    return stored === pin;
  },

  hasPIN: async () => {
    const stored = await AsyncStorage.getItem("admin_pin");
    return stored !== null;
  },
}));
