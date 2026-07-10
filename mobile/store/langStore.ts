import { create } from "zustand";
import { mmkv } from "./storage";
import { Lang } from "@/i18n";

interface LangState {
  lang: Lang;
  loadLang: () => Promise<void>;
  setLang: (lang: Lang) => Promise<void>;
}

export const useLangStore = create<LangState>((set) => ({
  lang: "uz",

  loadLang: async () => {
    const stored = await mmkv.getString("lang");
    if (stored === "uz" || stored === "ru" || stored === "en") {
      set({ lang: stored });
    }
  },

  setLang: async (lang: Lang) => {
    await mmkv.setString("lang", lang);
    set({ lang });
  },
}));
