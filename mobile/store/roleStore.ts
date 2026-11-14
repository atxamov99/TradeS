import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { secureStorage } from "./storage";

// Role now comes from the SERVER (/auth/me -> shopMemberships), not from a local switch + PIN.
//  - "admin"   = may manage products/employees: shop OWNER (solo or director) or platform ADMIN.
//  - "cashier" = only a CASHIER member of someone else's shop: can sell, cannot edit the catalogue.
// The server enforces the same rules on every request; this only drives what the app shows/allows.
import { deriveRole, type UserRole, type AccountKind } from "@/utils/deriveRole";
export type { UserRole, AccountKind };
export { deriveRole };

const ROLE_KEY = "server_role";
const KIND_KEY = "server_kind";

interface RoleState {
  role: UserRole;
  kind: AccountKind;
  load: () => Promise<void>;
  /** Fetch /auth/me and recompute the role. Offline / failed -> keeps the cached value. */
  refresh: (fetchMe: () => Promise<{ user?: any; shopMemberships?: any[] }>) => Promise<void>;
  /** Back to the default (call on logout so the next account never inherits a role). */
  reset: () => Promise<void>;
  /** Deprecated: roles are server-side now. Kept as a no-op so the old PIN screen cannot elevate anyone. */
  setRole: (role: UserRole) => Promise<void>;
  isAdmin: () => boolean;
  isDirector: () => boolean;
  setPIN: (pin: string) => Promise<void>;
  verifyPIN: (pin: string) => Promise<boolean>;
  hasPIN: () => Promise<boolean>;
}

export const useRoleStore = create<RoleState>((set, get) => ({
  role: "admin",
  kind: "SOLO",

  load: async () => {
    // The old locally-chosen role is gone: it must never grant or remove rights.
    await AsyncStorage.removeItem("user_role");
    const role = ((await AsyncStorage.getItem(ROLE_KEY)) as UserRole) || "admin";
    const kind = ((await AsyncStorage.getItem(KIND_KEY)) as AccountKind) || "SOLO";
    set({ role, kind });
  },

  refresh: async (fetchMe) => {
    try {
      const me = await fetchMe();
      const next = deriveRole(me);
      await AsyncStorage.multiSet([[ROLE_KEY, next.role], [KIND_KEY, next.kind]]);
      set(next);
    } catch {
      // offline / server asleep: keep the cached role
    }
  },

  reset: async () => {
    await AsyncStorage.multiRemove([ROLE_KEY, KIND_KEY]);
    set({ role: "admin", kind: "SOLO" });
  },

  setRole: async () => {
    // no-op by design (server-side roles)
  },

  isAdmin: () => get().role === "admin",
  isDirector: () => get().kind === "DIRECTOR" || get().kind === "ADMIN",

  // PIN is legacy (the PIN screen is no longer reachable); kept so old code compiles.
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
