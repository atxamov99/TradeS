// Sidebar menu — `icon` values are Material Symbols ligatures, `label` is the
// Uzbek design label (Stitch). Order follows the approved dashboard design.
const sidebarMenu = [
  { key: "dashboard", path: "/dashboard", icon: "dashboard",     label: "navigation.menu.dashboard.label" },
  { key: "products",  path: "/products",  icon: "inventory_2",   label: "navigation.menu.products.label" },
  { key: "orders",    path: "/orders",    icon: "shopping_cart", label: "navigation.menu.orders.label" },
  { key: "reports",   path: "/reports",   icon: "payments",      label: "navigation.menu.reports.label" },
  { key: "users",     path: "/users",     icon: "group",         label: "navigation.menu.users.label" },
  { key: "support",   path: "/support",   icon: "support_agent", label: "navigation.menu.support.label" },
  { key: "content",   path: "/content",   icon: "description",   label: "navigation.menu.content.label" },
  { key: "notifications", path: "/notifications", icon: "notifications", label: "navigation.menu.notifications.label" }
];

// Settings sits pinned to the bottom of the sidebar.
export const settingsItem = { key: "settings", path: "/settings", icon: "settings", label: "navigation.menu.settings.label" };

// Admins page — only shown to isPrimary (single ADMIN tier, always true for the one admin)
const primaryOnlyMenu = [
  { key: "admins", path: "/admins", icon: "admin_panel_settings", label: "navigation.menu.admins.label" }
];

export function getMenuForProfile(profile) {
  const base = sidebarMenu;
  if (profile?.isPrimary) {
    // Insert Adminlar right after Foydalanuvchilar
    const usersIdx = base.findIndex((m) => m.key === "users");
    return [
      ...base.slice(0, usersIdx + 1),
      ...primaryOnlyMenu,
      ...base.slice(usersIdx + 1)
    ];
  }
  return base;
}
