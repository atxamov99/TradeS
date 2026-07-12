import { useI18n } from "../../i18n";
import { useAuth } from "../../store";
import { Icon } from "../shared/Icon";
import { NotificationBell } from "./NotificationBell";

export function Header({ onMenuToggle }) {
  const { logout, profile } = useAuth();
  const { locale, setLocale, supportedLocales, t } = useI18n();

  return (
    <header className="h-16 sticky top-0 z-10 bg-surface/80 backdrop-blur-md border-b border-outline-variant flex justify-between items-center px-4 md:px-8">
      {/* Left: menu (mobile) + search */}
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <button
          type="button"
          onClick={onMenuToggle}
          className="lg:hidden p-2 rounded-lg text-on-surface-variant hover:bg-surface-container-low transition-colors"
          aria-label={t("common.menu", {}, "Menyu")}
        >
          <Icon name="menu" />
        </button>
        <div className="relative w-full max-w-md hidden sm:block">
          <Icon
            name="search"
            className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none text-[20px]"
          />
          <input
            type="text"
            placeholder={t("common.search", {}, "Qidiruv...")}
            className="w-full pl-10 pr-4 py-2 bg-surface-container-low border border-outline-variant rounded-full text-body-sm text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
          />
        </div>
      </div>

      {/* Right: language, notifications, logout, profile */}
      <div className="flex items-center gap-3 md:gap-5 shrink-0">
        <div className="hidden sm:flex items-center gap-1 rounded-full bg-surface-container-low border border-outline-variant px-1 py-1 text-xs">
          {supportedLocales.map((code) => (
            <button
              key={code}
              type="button"
              onClick={() => setLocale(code)}
              className={`rounded-full px-2.5 py-1 font-semibold uppercase transition-colors ${
                locale === code
                  ? "bg-primary-container text-on-primary-container"
                  : "text-on-surface-variant hover:text-on-surface"
              }`}
            >
              {code}
            </button>
          ))}
        </div>

        <NotificationBell />

        <button
          type="button"
          onClick={logout}
          className="hidden sm:flex items-center gap-1.5 text-body-sm text-on-surface-variant hover:text-error transition-colors"
        >
          <Icon name="logout" className="text-[20px]" />
          <span className="hidden md:inline">{t("common.signOut", {}, "Chiqish")}</span>
        </button>

        <div className="w-9 h-9 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center text-xs font-bold border border-outline-variant shrink-0">
          {profile?.avatar || "A"}
        </div>
      </div>
    </header>
  );
}
