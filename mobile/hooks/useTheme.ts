import { useThemeStore } from "@/store/themeStore";
import { dark, light } from "@/theme/colors";

export function useTheme() {
  const isDark = useThemeStore((s) => s.isDark);
  return { c: isDark ? dark : light, isDark };
}
