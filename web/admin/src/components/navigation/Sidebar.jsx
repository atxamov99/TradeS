import { NavLink } from "react-router-dom";
import { getMenuForProfile } from "../../constants/menu";
import { useAuth } from "../../store";
import { useI18n } from "../../i18n";

// Simple icon map (text/emoji fallback until real icon lib added)
const icons = {
  home:     "⬜",
  users:    "👥",
  key:      "🔑",
  document: "📄",
  chart:    "📊",
  orders:   "🛒",
  products: "📦",
  cog:      "⚙"
};

export function Sidebar({ open, onClose }) {
  const { profile } = useAuth();
  const { t } = useI18n();
  const menu = getMenuForProfile(profile);

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/40 z-20 transition-opacity duration-200 lg:hidden
          ${open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
        onClick={onClose}
      />

      {/* Sidebar panel */}
      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-[#0e2037] text-white z-30 flex flex-col
          sidebar-slide lg:relative lg:translate-x-0
          ${open ? "translate-x-0" : "-translate-x-full"}`}
      >
        {/* Brand */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-white/10">
          <img
            src="/logo.png"
            alt="TradeS"
            className="w-9 h-9 rounded-xl object-contain shrink-0 bg-white"
          />
          <div className="min-w-0">
            <p className="font-semibold text-sm leading-tight truncate">{t("app.name")}</p>
          </div>
        </div>

        {/* Profile */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-white/10">
          <div className="w-8 h-8 rounded-full bg-primary/60 flex items-center justify-center text-xs font-bold shrink-0">
            {profile?.avatar || "A"}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium leading-tight truncate">{profile?.name}</p>
            <p className="text-xs text-white/40 mt-0.5 truncate">
              {profile?.isPrimary ? t("labels.roles.super_admin") : t("labels.roles.admin")}
            </p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-3 px-3">
          {menu.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl mb-1 text-sm transition-colors
                ${isActive
                  ? "bg-white/15 text-white font-medium"
                  : "text-white/60 hover:bg-white/8 hover:text-white"
                }`
              }
            >
              <span className="text-base w-5 text-center opacity-80">{icons[item.icon] || "·"}</span>
              <div className="min-w-0">
                <span className="block leading-tight">{t(`navigation.menu.${item.key}.label`)}</span>
                <span className="block text-xs opacity-50 leading-tight mt-0.5">{t(`navigation.menu.${item.key}.description`)}</span>
              </div>
            </NavLink>
          ))}
        </nav>

        {/* Bottom badge */}
        <div className="px-5 py-4 border-t border-white/10">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-400 shrink-0" />
            <span className="text-xs text-white/40">
              {profile?.email}
            </span>
          </div>
        </div>
      </aside>
    </>
  );
}
