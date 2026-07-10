import { useThemeStore } from "@/store/themeStore";
import { dark } from "@/theme/colors";
import { unix } from "@/theme/unix";

export function useTheme() {
  const isDark = useThemeStore((s) => s.isDark);
  return { c: isDark ? dark : unix, isDark };
}
