import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Check, LogOut } from 'lucide-react';
import useAuthStore from '../store/authStore';

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
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const roleMap = {
    USER: { label: t('role_user'), cls: 'bg-green-100 text-green-700' },
    ADMIN: { label: t('role_admin'), cls: 'bg-blue-100 text-blue-700' },
    SUPER_ADMIN: { label: t('role_super_admin'), cls: 'bg-purple-100 text-purple-700' },
  };

  const initials = getInitials(user?.name);
  const avatarGradient = getAvatarGradient(user?.name || '');
  const role = roleMap[user?.role] || roleMap.USER;

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Header */}
      <div className="bg-white border-b border-[#E2E8F0] px-5 py-4 sticky top-0 z-10">
        <h1 className="text-lg font-bold text-[#0F172A]">{t('settings')}</h1>
      </div>

      <div className="px-4 sm:px-6 py-5 max-w-3xl mx-auto flex flex-col gap-4">

        {/* ── Profile ───────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-[#E2E8F0] overflow-hidden">
          <div className="px-5 py-3 border-b border-[#E2E8F0]">
            <p className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wider">
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
              <p className="text-base font-bold text-[#0F172A] truncate">{user?.name || '—'}</p>
              <p className="text-sm text-[#64748B] truncate mt-0.5">{user?.email || '—'}</p>
              {user?.role && (
                <span className={`inline-block mt-2 px-2.5 py-0.5 rounded-lg text-xs font-bold ${role.cls}`}>
                  {role.label}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* ── Language ──────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-[#E2E8F0] overflow-hidden">
          <div className="px-5 py-3 border-b border-[#E2E8F0]">
            <p className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wider">
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
                      ? 'border-green-500 bg-green-50'
                      : 'border-[#E2E8F0] bg-white hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl leading-none">{lang.flag}</span>
                    <div className="text-left">
                      <p className={`text-sm font-bold leading-tight ${isActive ? 'text-green-700' : 'text-[#0F172A]'}`}>
                        {lang.native}
                      </p>
                    </div>
                  </div>
                  {isActive ? (
                    <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                      <Check size={13} className="text-white" strokeWidth={3} />
                    </div>
                  ) : (
                    <div className="w-6 h-6 rounded-full border-2 border-[#E2E8F0] flex-shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── About ─────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-[#E2E8F0] overflow-hidden">
          <div className="px-5 py-3 border-b border-[#E2E8F0]">
            <p className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wider">
              {t('about')}
            </p>
          </div>
          <div className="divide-y divide-[#E2E8F0]">
            <div className="flex items-center justify-between px-5 py-4">
              <span className="text-sm font-medium text-[#0F172A]">{t('app_name')}</span>
              <span className="text-sm font-extrabold text-green-600 tracking-tight">TradeS</span>
            </div>
            <div className="flex items-center justify-between px-5 py-4">
              <span className="text-sm font-medium text-[#0F172A]">{t('version')}</span>
              <span className="text-sm font-medium text-[#64748B]">1.0.0</span>
            </div>
          </div>
        </div>

        {/* ── Logout ────────────────────────────────── */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-3 h-14 bg-white border border-red-200 rounded-2xl text-red-500 font-bold text-base hover:bg-red-50 hover:border-red-300 active:scale-[0.98] transition-all"
        >
          <LogOut size={20} />
          {t('logout')}
        </button>

      </div>
    </div>
  );
}
