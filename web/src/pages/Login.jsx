import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Eye, EyeOff, LogIn, ShoppingBag, Globe, ChevronDown
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { GoogleLogin } from '@react-oauth/google';
import useAuthStore from '../store/authStore';

const LANGS = ['uz', 'ru', 'en'];

const TX = {
  uz: {
    tagline:     "Kichik biznes uchun savdo menejeri",
    headline:    "Savdoni boshqarish hech qachon bu qadar oson bo'lmagan",
    sub:         "Kunlik savdolar, foyda tahlili, omborxona — barchasi bir joyda va bepul",
    login_title: "Tizimga kirish",
    login_sub:   "Hisobingizga kiring",
    no_account:  "Hisob yo'qmi?",
    register:    "Ro'yxatdan o'ting",
    trust: ["Ma'lumotlaringiz xavfsiz", "Bepul foydalanish", "O'rnatish shart emas"],
  },
  ru: {
    tagline:     "Менеджер продаж для малого бизнеса",
    headline:    "Управление продажами никогда не было таким простым",
    sub:         "Ежедневные продажи, анализ прибыли, склад — всё в одном месте и бесплатно",
    login_title: "Войти в систему",
    login_sub:   "Войдите в ваш аккаунт",
    no_account:  "Нет аккаунта?",
    register:    "Зарегистрироваться",
    trust: ["Ваши данные в безопасности", "Бесплатное использование", "Установка не нужна"],
  },
  en: {
    tagline:     "Sales manager for small businesses",
    headline:    "Managing sales has never been this easy",
    sub:         "Daily sales, profit analysis, warehouse — all in one place, completely free",
    login_title: "Sign In",
    login_sub:   "Sign into your account",
    no_account:  "Don't have an account?",
    register:    "Sign Up",
    trust: ["Your data is secure", "Free to use", "No installation needed"],
  },
};

export default function Login() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language.startsWith('ru') ? 'ru' : i18n.language.startsWith('en') ? 'en' : 'uz';
  const tx = TX[lang];

  const [form, setForm] = useState({ email: '', password: '' });
  const [showPwd, setShowPwd] = useState(false);
  const [errors, setErrors] = useState({});
  const [langOpen, setLangOpen] = useState(false);

  const login = useAuthStore((s) => s.login);
  const googleLogin = useAuthStore((s) => s.googleLogin);
  const isLoading = useAuthStore((s) => s.isLoading);
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/dashboard';

  const handleGoogleSuccess = async ({ credential }) => {
    try {
      const user = await googleLogin(credential);
      if (!['ADMIN', 'SUPER_ADMIN'].includes(user?.role)) {
        navigate(from === '/login' ? '/dashboard' : from, { replace: true });
      }
    } catch (_) {}
  };

  const validate = () => {
    const e = {};
    if (!form.email.trim()) e.email = t('email_required');
    if (!form.password)     e.password = t('password_required');
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    try {
      const user = await login({ email: form.email.trim(), password: form.password });
      if (!['ADMIN', 'SUPER_ADMIN'].includes(user?.role)) {
        navigate(from === '/login' ? '/dashboard' : from, { replace: true });
      }
    } catch (_) {}
  };

  const onChange = (f) => (e) => {
    setForm((p) => ({ ...p, [f]: e.target.value }));
    if (errors[f]) setErrors((p) => ({ ...p, [f]: '' }));
  };

  const inputCls = (f) =>
    `w-full h-12 rounded-xl border px-4 text-sm bg-[#0E150F]/50 text-white placeholder-slate-500 transition-all focus:outline-none focus:ring-2 focus:ring-[#2ECC71]/30 focus:border-[#2ECC71] ${
      errors[f] ? 'border-red-500/50 bg-red-950/20' : 'border-[#2ECC71]/10 hover:border-[#2ECC71]/20'
    }`;

  return (
    <div className="min-h-screen bg-[#0E150F] text-slate-100 font-sans selection:bg-[#2ECC71] selection:text-slate-950 overflow-x-hidden flex flex-col">

      {/* Background decoration */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[600px] pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] left-[20%] w-[40%] h-[60%] rounded-full bg-[#2ECC71]/5 blur-[120px]" />
        <div className="absolute top-[5%] right-[20%] w-[35%] h-[50%] rounded-full bg-[#1ABC9C]/5 blur-[100px]" />
      </div>

      {/* Navbar */}
      <nav className="relative z-10 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between border-b border-[#2ECC71]/10">
        <Link to="/" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#2ECC71] to-[#1ABC9C] flex items-center justify-center">
            <ShoppingBag className="w-5 h-5 text-slate-950" />
          </div>
          <span className="text-xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-slate-400">
            Savdo-E
          </span>
        </Link>

        {/* Language Selector */}
        <div className="relative">
          <button
            onClick={() => setLangOpen(!langOpen)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-emerald-950/40 hover:border-[#2ECC71]/30 bg-[#0E150F]/50 text-xs font-semibold text-slate-300 hover:text-white transition-all"
          >
            <Globe className="w-3.5 h-3.5" />
            <span className="uppercase">{lang}</span>
            <ChevronDown className={`w-3 h-3 transition-transform ${langOpen ? 'rotate-180' : ''}`} />
          </button>

          {langOpen && (
            <div className="absolute right-0 mt-2 w-28 rounded-xl border border-emerald-950/40 bg-[#0E150F] shadow-xl overflow-hidden py-1 z-50">
              {LANGS.map((l) => (
                <button
                  key={l}
                  onClick={() => i18n.changeLanguage(l)}
                  className="w-full text-left px-4 py-2 text-xs font-semibold hover:bg-[#1ABC9C]/10 text-slate-400 hover:text-white transition-all uppercase"
                >
                  {l === 'uz' ? 'O‘zbekcha' : l === 'ru' ? 'Русский' : 'English'}
                </button>
              ))}
            </div>
          )}
        </div>
      </nav>

      {/* Main Form Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-12 relative z-10">
        <div className="w-full max-w-[420px] bg-[#0E150F]/40 backdrop-blur-md rounded-2xl border border-[#2ECC71]/10 shadow-2xl p-6 sm:p-8">
          <div className="mb-6 text-center sm:text-left">
            <h2 className="text-2xl font-extrabold text-white">{tx.login_title}</h2>
            <p className="text-slate-400 text-sm mt-1">{tx.login_sub}</p>
          </div>

          {/* Google login */}
          <div className="mb-6 flex flex-col gap-4">
            <div className="flex items-center justify-center">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => {}}
                width="352"
                shape="rectangular"
                theme="outline"
                text="signin_with"
                locale="uz"
              />
            </div>
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-[#2ECC71]/10" />
              <span className="text-xs text-slate-500 font-medium">yoki</span>
              <div className="flex-1 h-px bg-[#2ECC71]/10" />
            </div>
          </div>

          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t('email')}</label>
              <input type="email" autoComplete="email" value={form.email} onChange={onChange('email')} placeholder={t('enter_email')} className={inputCls('email')} />
              {errors.email && <p className="text-red-400 text-xs mt-0.5">{errors.email}</p>}
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t('password')}</label>
              <div className="relative">
                <input
                  type={showPwd ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={form.password}
                  onChange={onChange('password')}
                  placeholder="••••••••"
                  className={`w-full h-12 rounded-xl border px-4 pr-12 text-sm bg-[#0E150F]/50 text-white placeholder-slate-500 transition-all focus:outline-none focus:ring-2 focus:ring-[#2ECC71]/30 focus:border-[#2ECC71] ${errors.password ? 'border-red-500/50 bg-red-950/20' : 'border-[#2ECC71]/10 hover:border-[#2ECC71]/20'}`}
                />
                <button type="button" onClick={() => setShowPwd(p => !p)} tabIndex={-1} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 p-1.5 rounded-lg transition">
                  {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && <p className="text-red-400 text-xs mt-0.5">{errors.password}</p>}
              <div className="flex justify-end mt-1">
                <Link to="/forgot-password" className="text-xs text-[#2ECC71] hover:text-[#2ecc71]/80 hover:underline transition">
                  {t('forgot_password') || 'Parolni unutdingizmi?'}
                </Link>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 bg-[#2ECC71] hover:bg-[#2ecc71]/90 text-slate-950 text-sm font-extrabold rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-60 shadow-lg shadow-[#2ECC71]/10 mt-2 hover:scale-[1.02] active:scale-[0.98]"
            >
              {isLoading
                ? <span className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                : <><LogIn size={16} />{t('login')}</>
              }
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-slate-400">
            {tx.no_account}{' '}
            <Link to="/register" className="text-[#2ECC71] font-bold hover:underline transition">
              {tx.register}
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-[#2ECC71]/10 bg-[#0E150F] py-8 text-center text-slate-500 text-xs relative z-10">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-[#2ECC71] flex items-center justify-center">
              <ShoppingBag className="w-3.5 h-3.5 text-slate-950" />
            </div>
            <span className="font-bold text-slate-400">Savdo-E</span>
          </div>
          <div>
            &copy; {new Date().getFullYear()} Savdo-E. {t('copyright')}
          </div>
        </div>
      </footer>
    </div>
  );
}
