import { useLocation } from "react-router-dom";
import { useI18n } from "../../i18n";
import { useAuth } from "../../store";
import { useTheme } from "../../theme";

const pathKeyMap = {
  "/dashboard": "dashboard",
  "/users": "users",
  "/admins": "admins",
  "/content": "content",
  "/reports": "reports",
  "/settings": "settings",
  "/customers": "users",
  "/orders": "orders",
  "/products": "products"
};

export function Header({ onMenuToggle }) {
  const location = useLocation();
  const { logout, profile } = useAuth();
  const { locale, setLocale, supportedLocales, t } = useI18n();
  const { theme, toggleTheme } = useTheme();

  const pathKey = "/" + location.pathname.split("/")[1];
  const metaKey = pathKeyMap[pathKey] || "fallback";
  const meta = {
    title: t(`navigation.menu.${metaKey}.label`, {}, t("navigation.pageMeta.fallback.title")),
    sub: t(`navigation.pageMeta.${metaKey}.eyebrow`, {}, "")
  };

  return (
    <header className="sticky top-0 z-10 bg-[#0f1a2d]/90 backdrop-blur border-b border-slate-700/70 text-white">
      <div className="flex items-center justify-between gap-4 px-4 md:px-6 h-14">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={onMenuToggle}
            className="lg:hidden p-2 rounded-lg text-white/70 hover:bg-white/10 transition-colors"
            aria-label={t("common.menu")}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="min-w-0">
            <h1 className="text-base font-semibold text-white leading-tight truncate">{meta.title}</h1>
            {meta.sub && <p className="text-xs text-gray-200 leading-tight hidden sm:block">{meta.sub}</p>}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {profile?.isPrimary && (
            <span className="hidden sm:flex items-center gap-1.5 text-xs font-medium text-primary bg-primary/8 px-3 py-1 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-primary" />
              {t("labels.roles.super_admin")}
            </span>
          )}

          <div className="flex items-center gap-2 rounded-lg border border-white/20 bg-white/10 px-2 py-1 text-xs">
            <span className="hidden sm:inline text-white/70">{t("common.language")}:</span>
            {supportedLocales.map((code) => (
              <button
                key={code}
                type="button"
                onClick={() => setLocale(code)}
                className={`rounded-md px-2 py-1 transition-colors font-medium ${
                  locale === code
                    ? "bg-primary text-white"
                    : "text-white/80 hover:bg-white/20 hover:text-white"
                }`}
                aria-label={`${t("common.language")}: ${t(`languages.${code}`)}`}
              >
                {t(`languages.${code}`)}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={logout}
            className="text-sm text-gray-500 hover:text-danger transition-colors px-2 py-1"
          >
            {t("common.signOut")}
          </button>
        </div>
      </div>
    </header>
  );
}
