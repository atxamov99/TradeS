import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Check, LogOut, Sun, Moon } from 'lucide-react';
import useAuthStore from '../store/authStore';
import useThemeStore from '../store/themeStore';

function getInitials(name) {
  if (!name) return '?';
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function getAvatarGradient(name) {
  const gradients = [
    'from-green-400 to-emerald-600',
    'from-blue-400 to-blue-600',
    'from-violet-400 to-purple-600',
    'from-orange-400 to-amber-600',
    'from-pink-400 to-rose-600',
    'from-teal-400 to-cyan-600',
  ];
  const idx = name ? name.charCodeAt(0) % gradients.length : 0;
  return gradients[idx];
}

const LANGS = [
  { code: 'uz', label: "O'zbek", native: "O'zbekcha", flag: '🇺🇿' },
  { code: 'ru', label: 'Русский', native: 'Русский', flag: '🇷🇺' },
  { code: 'en', label: 'English', native: 'English', flag: '🇬🇧' },
];

export default function Settings() {
  const { t, i18n } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const { theme, toggleTheme } = useThemeStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const roleMap = {
    USER: { label: t('role_user'), cls: 'bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-300' },
    ADMIN: { label: t('role_admin'), cls: 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300' },
    SUPER_ADMIN: { label: t('role_super_admin'), cls: 'bg-purple-100 text-purple-700 dark:bg-purple-500/15 dark:text-purple-300' },
  };

  const initials = getInitials(user?.name);
  const avatarGradient = getAvatarGradient(user?.name || '');
  const role = roleMap[user?.role] || roleMap.USER;

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0F172A]">
      {/* Header */}
      <div className="bg-white dark:bg-[#1E293B] border-b border-[#E2E8F0] dark:border-[#334155] px-5 py-4 sticky top-0 z-10">
        <h1 className="text-lg font-bold text-[#0F172A] dark:text-slate-100">{t('settings')}</h1>
      </div>

      <div className="px-4 sm:px-6 py-5 max-w-3xl mx-auto flex flex-col gap-4">

        {/* ── Profile ───────────────────────────────── */}
        <div className="bg-white dark:bg-[#1E293B] rounded-2xl border border-[#E2E8F0] dark:border-[#334155] overflow-hidden">
          <div className="px-5 py-3 border-b border-[#E2E8F0] dark:border-[#334155]">
            <p className="text-xs font-semibold text-[#94A3B8] dark:text-slate-400 uppercase tracking-wider">
              {t('profile')}
            </p>
          </div>
          <div className="px-5 py-5 flex items-center gap-4">
            {/* Avatar */}
            <div
              className={`w-[60px] h-[60px] rounded-2xl bg-gradient-to-br ${avatarGradient} flex items-center justify-center flex-shrink-0 shadow-sm`}
            >
              <span className="text-white text-xl font-bold leading-none">{initials}</span>
            </div>
            {/* Info */}
            <div className="flex-1 min-w-0">
              <p className="text-base font-bold text-[#0F172A] dark:text-slate-100 truncate">{user?.name || '—'}</p>
              <p className="text-sm text-[#64748B] dark:text-slate-400 truncate mt-0.5">{user?.email || '—'}</p>
              {user?.role && (
                <span className={`inline-block mt-2 px-2.5 py-0.5 rounded-lg text-xs font-bold ${role.cls}`}>
                  {role.label}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* ── Appearance ────────────────────────────── */}
        <div className="bg-white dark:bg-[#1E293B] rounded-2xl border border-[#E2E8F0] dark:border-[#334155] overflow-hidden">
          <div className="px-5 py-3 border-b border-[#E2E8F0] dark:border-[#334155]">
            <p className="text-xs font-semibold text-[#94A3B8] dark:text-slate-400 uppercase tracking-wider">
              {t('appearance')}
            </p>
          </div>
          <div className="p-3 flex flex-col gap-2">
            {/* Light */}
            <button
              onClick={() => { if (theme !== 'light') toggleTheme(); }}
              className={`flex items-center justify-between w-full px-4 py-3.5 rounded-xl border transition-all ${
                theme === 'light'
                  ? 'border-green-500 bg-green-50 dark:bg-green-500/10'
                  : 'border-[#E2E8F0] dark:border-[#334155] bg-white dark:bg-[#1E293B] hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center gap-3">
                <Sun size={22} className={theme === 'light' ? 'text-green-600 dark:text-green-400' : 'text-[#64748B] dark:text-slate-400'} />
                <div className="text-left">
                  <p className={`text-sm font-bold leading-tight ${theme === 'light' ? 'text-green-700 dark:text-green-400' : 'text-[#0F172A] dark:text-slate-100'}`}>
                    {t('theme_light')}
                  </p>
                </div>
              </div>
              {theme === 'light' ? (
                <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                  <Check size={13} className="text-white" strokeWidth={3} />
                </div>
              ) : (
                <div className="w-6 h-6 rounded-full border-2 border-[#E2E8F0] dark:border-[#334155] flex-shrink-0" />
              )}
            </button>
            {/* Dark */}
            <button
              onClick={() => { if (theme !== 'dark') toggleTheme(); }}
              className={`flex items-center justify-between w-full px-4 py-3.5 rounded-xl border transition-all ${
                theme === 'dark'
                  ? 'border-green-500 bg-green-50 dark:bg-green-500/10'
                  : 'border-[#E2E8F0] dark:border-[#334155] bg-white dark:bg-[#1E293B] hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center gap-3">
                <Moon size={22} className={theme === 'dark' ? 'text-green-600 dark:text-green-400' : 'text-[#64748B] dark:text-slate-400'} />
                <div className="text-left">
                  <p className={`text-sm font-bold leading-tight ${theme === 'dark' ? 'text-green-700 dark:text-green-400' : 'text-[#0F172A] dark:text-slate-100'}`}>
                    {t('theme_dark')}
                  </p>
                </div>
              </div>
              {theme === 'dark' ? (
                <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                  <Check size={13} className="text-white" strokeWidth={3} />
                </div>
              ) : (
                <div className="w-6 h-6 rounded-full border-2 border-[#E2E8F0] dark:border-[#334155] flex-shrink-0" />
              )}
            </button>
          </div>
        </div>

        {/* ── Language ──────────────────────────────── */}
        <div className="bg-white dark:bg-[#1E293B] rounded-2xl border border-[#E2E8F0] dark:border-[#334155] overflow-hidden">
          <div className="px-5 py-3 border-b border-[#E2E8F0] dark:border-[#334155]">
            <p className="text-xs font-semibold text-[#94A3B8] dark:text-slate-400 uppercase tracking-wider">
              {t('language')}
            </p>
          </div>
          <div className="p-3 flex flex-col gap-2">
            {LANGS.map((lang) => {
              const isActive = i18n.language.startsWith(lang.code);
              return (
                <button
                  key={lang.code}
                  onClick={() => i18n.changeLanguage(lang.code)}
                  className={`flex items-center justify-between w-full px-4 py-3.5 rounded-xl border transition-all ${
                    isActive
                      ? 'border-green-500 bg-green-50 dark:bg-green-500/10'
                      : 'border-[#E2E8F0] dark:border-[#334155] bg-white dark:bg-[#1E293B] hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl leading-none">{lang.flag}</span>
                    <div className="text-left">
                      <p className={`text-sm font-bold leading-tight ${isActive ? 'text-green-700 dark:text-green-400' : 'text-[#0F172A] dark:text-slate-100'}`}>
                        {lang.native}
                      </p>
                    </div>
                  </div>
                  {isActive ? (
                    <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                      <Check size={13} className="text-white" strokeWidth={3} />
                    </div>
                  ) : (
                    <div className="w-6 h-6 rounded-full border-2 border-[#E2E8F0] dark:border-[#334155] flex-shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── About ─────────────────────────────────── */}
        <div className="bg-white dark:bg-[#1E293B] rounded-2xl border border-[#E2E8F0] dark:border-[#334155] overflow-hidden">
          <div className="px-5 py-3 border-b border-[#E2E8F0] dark:border-[#334155]">
            <p className="text-xs font-semibold text-[#94A3B8] dark:text-slate-400 uppercase tracking-wider">
              {t('about')}
            </p>
          </div>
          <div className="divide-y divide-[#E2E8F0] dark:divide-[#334155]">
            <div className="flex items-center justify-between px-5 py-4">
              <span className="text-sm font-medium text-[#0F172A] dark:text-slate-100">{t('app_name')}</span>
              <span className="text-sm font-extrabold text-green-600 tracking-tight">TradeS</span>
            </div>
            <div className="flex items-center justify-between px-5 py-4">
              <span className="text-sm font-medium text-[#0F172A] dark:text-slate-100">{t('version')}</span>
              <span className="text-sm font-medium text-[#64748B] dark:text-slate-400">1.0.0</span>
            </div>
          </div>
        </div>

        {/* ── Logout ────────────────────────────────── */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-3 h-14 bg-white dark:bg-[#1E293B] border border-red-200 dark:border-red-500/30 rounded-2xl text-red-500 font-bold text-base hover:bg-red-50 dark:hover:bg-red-500/10 hover:border-red-300 active:scale-[0.98] transition-all"
        >
          <LogOut size={20} />
          {t('logout')}
        </button>

      </div>
    </div>
  );
}
