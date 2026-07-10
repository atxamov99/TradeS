import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { api } from "@/services/api";

export type Plan = "free" | "pro" | "biznes";

const PLAN_LIMITS: Record<Plan, number> = {
  free: 30,
  pro: 250,
  biznes: Infinity,
};

interface SubscriptionState {
  plan: Plan;
  expiresAt: number | null;
  load: () => Promise<void>;
  upgrade: (plan: Plan, durationDays: number) => Promise<void>;
  getProductLimit: () => number;
  isPro: () => boolean;
  isBiznes: () => boolean;
}

export const useSubscriptionStore = create<SubscriptionState>((set, get) => ({
  plan: "free",
  expiresAt: null,

  load: async () => {
    try {
      const res = await api.get("/subscriptions");
      const sub = res.data?.data?.subscription;
      if (sub) {
        const expires = sub.expiresAt ? new Date(sub.expiresAt).getTime() : null;
        if (expires && expires < Date.now()) {
          set({ plan: "free", expiresAt: null });
        } else {
          set({ plan: sub.plan, expiresAt: expires });
        }
        await AsyncStorage.setItem("sub_plan", sub.plan);
        if (expires) await AsyncStorage.setItem("sub_expires", String(expires));
        return;
      }
    } catch {}
    const plan = ((await AsyncStorage.getItem("sub_plan")) as Plan) || "free";
    const expiresStr = await AsyncStorage.getItem("sub_expires");
    const expiresAt = expiresStr ? Number(expiresStr) : null;
    if (expiresAt && expiresAt < Date.now()) {
      await AsyncStorage.removeItem("sub_plan");
      await AsyncStorage.removeItem("sub_expires");
      set({ plan: "free", expiresAt: null });
    } else {
      set({ plan, expiresAt });
    }
  },

  upgrade: async (plan, durationDays) => {
    const expiresAt = Date.now() + durationDays * 24 * 60 * 60 * 1000;
    await AsyncStorage.setItem("sub_plan", plan);
    await AsyncStorage.setItem("sub_expires", String(expiresAt));
    set({ plan, expiresAt });
  },

  getProductLimit: () => PLAN_LIMITS[get().plan],
  isPro: () => get().plan === "pro" || get().plan === "biznes",
  isBiznes: () => get().plan === "biznes",
}));
