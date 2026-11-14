// Same palette as the website (web/tailwind.config.js): one look on web, admin panel and app.
export const light = {
  bg:         "#F8FAFC",
  bgCard:     "#FFFFFF",
  bgMuted:    "#F1F5F9",
  border:     "#E2E8F0",
  primary:    "#22C55E",
  primaryDark:"#16A34A",
  accent:     "#4ADE80",
  text:       "#0E150F",
  textSub:    "#475569",
  textMuted:  "#94A3B8",
  danger:     "#DC2626",
  warn:       "#D97706",
  tabBar:     "#FFFFFF",
  tabBorder:  "#E2E8F0",
  success:    "#16A34A",
};

export const dark = {
  bg:         "#080D09",
  bgCard:     "#0E150F",
  bgMuted:    "#121B14",
  border:     "#223027",
  primary:    "#22C55E",
  primaryDark:"#16A34A",
  accent:     "#4ADE80",
  text:       "#F1F5F9",
  textSub:    "#94A3B8",
  textMuted:  "#64748B",
  danger:     "#EF4444",
  warn:       "#F59E0B",
  tabBar:     "#0E150F",
  tabBorder:  "#223027",
  success:    "#22C55E",
};

export type Theme = typeof light;
