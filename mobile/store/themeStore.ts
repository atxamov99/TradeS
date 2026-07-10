import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface ThemeState {
  isDark: boolean;
  loadTheme: () => Promise<void>;
  toggleTheme: () => Promise<void>;
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  isDark: false,

  loadTheme: async () => {
    const val = await AsyncStorage.getItem("theme");
    set({ isDark: val === "dark" });
  },

  toggleTheme: async () => {
    const next = !get().isDark;
    await AsyncStorage.setItem("theme", next ? "dark" : "light");
    set({ isDark: next });
  },
}));
