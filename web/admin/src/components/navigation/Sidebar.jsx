import { NavLink } from "react-router-dom";
import { getMenuForProfile, settingsItem } from "../../constants/menu";
import { useAuth } from "../../store";
import { Icon } from "../shared/Icon";

function NavItem({ item, onClose }) {
  return (
    <NavLink
      to={item.path}
      onClick={onClose}
      end={item.path === "/dashboard"}
      className={({ isActive }) =>
        `flex items-center gap-3 mx-2 px-4 py-3 rounded-lg text-body-md transition-colors ${
          isActive
            ? "bg-primary-container text-on-primary-container font-semibold"
            : "text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface"
        }`
      }
    >
      {({ isActive }) => (
        <>
          <Icon name={item.icon} fill={isActive} />
          <span>{item.label}</span>
        </>
      )}
    </NavLink>
  );
}

export function Sidebar({ open, onClose }) {
  const { profile } = useAuth();
  const menu = getMenuForProfile(profile);

  return (
    <>
      {/* Backdrop (mobile) */}
      <div
        className={`fixed inset-0 bg-inverse-surface/40 z-20 transition-opacity duration-200 lg:hidden
          ${open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
        onClick={onClose}
      />

      {/* Sidebar panel */}
      <aside
        className={`fixed top-0 left-0 h-full w-[280px] bg-surface border-r border-outline-variant z-30 flex flex-col py-6
          sidebar-slide lg:relative lg:translate-x-0
          ${open ? "translate-x-0" : "-translate-x-full"}`}
      >
        {/* Brand */}
        <div className="px-6 mb-8 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-surface-container-lowest border border-outline-variant flex items-center justify-center overflow-hidden shrink-0">
            <img src="/logo.png" alt="TradeS" className="w-full h-full object-contain" />
          </div>
          <div className="min-w-0">
            <h1 className="font-display-lg text-primary font-bold leading-tight text-xl truncate">TradeS</h1>
            <p className="font-label-caps text-label-caps text-on-surface-variant">Savdo boshqaruvi</p>
          </div>
        </div>

        {/* Profile */}
        <div className="px-4 mb-4">
          <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-surface-container-low border border-outline-variant">
            <div className="w-9 h-9 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center text-xs font-bold shrink-0">
              {profile?.avatar || "A"}
            </div>
            <div className="min-w-0">
              <p className="text-body-sm font-semibold text-on-surface leading-tight truncate">{profile?.name}</p>
              <p className="text-xs text-on-surface-variant leading-tight truncate mt-0.5">
                {profile?.isPrimary ? "SUPER ADMIN" : "ADMIN"}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-2 space-y-1">
          {menu.map((item) => (
            <NavItem key={item.path} item={item} onClose={onClose} />
          ))}
        </nav>

        {/* Settings pinned bottom */}
        <div className="px-2 mt-4 pt-4 border-t border-outline-variant">
          <NavItem item={settingsItem} onClose={onClose} />
        </div>
      </aside>
    </>
  );
}
