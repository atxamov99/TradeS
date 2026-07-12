// Sidebar menu — `icon` values are Material Symbols ligatures, `label` is the
// Uzbek design label (Stitch). Order follows the approved dashboard design.
const sidebarMenu = [
  { key: "dashboard", path: "/dashboard", icon: "dashboard",     label: "Boshqaruv paneli" },
  { key: "products",  path: "/products",  icon: "inventory_2",   label: "Mahsulotlar" },
  { key: "orders",    path: "/orders",    icon: "shopping_cart", label: "Buyurtmalar" },
  { key: "reports",   path: "/reports",   icon: "payments",      label: "Sotuvlar" },
  { key: "users",     path: "/users",     icon: "group",         label: "Foydalanuvchilar" },
  { key: "content",   path: "/content",   icon: "description",   label: "Kontent" }
];

// Settings sits pinned to the bottom of the sidebar.
export const settingsItem = { key: "settings", path: "/settings", icon: "settings", label: "Sozlamalar" };

// Admins page — only shown to isPrimary (SUPER_ADMIN)
const primaryOnlyMenu = [
  { key: "admins", path: "/admins", icon: "admin_panel_settings", label: "Adminlar" }
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
