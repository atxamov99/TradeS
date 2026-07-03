import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Eye, EyeOff, UserPlus, CheckCircle2, XCircle,
  ShoppingBag, Globe, ChevronDown, ArrowRight
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import useAuthStore from '../store/authStore';

const LANGS = ['uz', 'ru', 'en'];

const TX = {
  uz: {
    tagline:        "Kichik biznes uchun savdo menejeri",
    headline:       "Biznesingizni aqlli boshqaring — bepul",
    sub:            "Hisob yarating va bugun birinchi savdongizni qayd eting",
    register_title: "Hisob yaratish",
    register_sub:   "1 daqiqada ro'yxatdan o'ting — bepul",
    have_account:   "Hisobingiz bormi?",
    login:          "Kirish",
    name_label:     "To'liq ism",
    name_ph:        "Ism va familiyangiz",
    email_label:    "Email manzil",
    pwd_label:      "Parol",
    pwd_ph:         "Kamida 8 ta belgi",
    submit:         "Ro'yxatdan o'tish",
  },
  ru: {
    tagline:        "Менеджер продаж для малого бизнеса",
    headline:       "Управляйте бизнесом умно — бесплатно",
    sub:            "Создайте аккаунт и запишите первую продажу уже сегодня",
    register_title: "Создать аккаунт",
    register_sub:   "Зарегистрируйтесь за 1 минуту — бесплатно",
    have_account:   "Уже есть аккаунт?",
    login:          "Войти",
    name_label:     "Полное имя",
    name_ph:        "Ваше имя и фамилия",
    email_label:    "Электронная почта",
    pwd_label:      "Пароль",
    pwd_ph:         "Минимум 8 символов",
    submit:         "Создать аккаунт",
  },
  en: {
    tagline:        "Sales manager for small businesses",
    headline:       "Manage your business smartly — for free",
    sub:            "Create an account and log your first sale today",
    register_title: "Create Account",
    register_sub:   "Sign up in 1 minute — completely free",
    have_account:   "Already have an account?",
    login:          "Sign In",
    name_label:     "Full Name",
    name_ph:        "Your full name",
    email_label:    "Email Address",
    pwd_label:      "Password",
    pwd_ph:         "At least 8 characters",
    submit:         "Create Account",
  },
};

const getRules = (t) => [
  { label: t('rule_length'), test: (p) => p.length >= 8 },
  { label: t('rule_upper'),  test: (p) => /[A-Z]/.test(p) },
  { label: t('rule_lower'),  test: (p) => /[a-z]/.test(p) },
  { label: t('rule_number'), test: (p) => /\d/.test(p) },
];

export default function Register() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const register = useAuthStore((s) => s.register);
  const login = useAuthStore((s) => s.login);
  const isLoading = useAuthStore((s) => s.isLoading);

  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [showPwd, setShowPwd] = useState(false);
  const [pwdTouched, setPwdTouched] = useState(false);
  const [errors, setErrors] = useState({});
  const [langOpen, setLangOpen] = useState(false);

  const currentLang = i18n.language.startsWith('ru') ? 'ru' : i18n.language.startsWith('en') ? 'en' : 'uz';
  const tx = TX[currentLang];

  const rules = getRules(t);
  const pwdValid = rules.every((r) => r.test(form.password));

  const validate = () => {
    const e = {};
    if (!form.name.trim())  e.name  = t('name_required');
    if (!form.email.trim()) e.email = t('email_required');
    if (!form.password)     e.password = t('password_required');
    else if (!pwdValid)     e.password = t('rule_length');
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setPwdTouched(true);
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    try {
      await register({ name: form.name.trim(), email: form.email.trim(), password: form.password });
      await login({ email: form.email.trim(), password: form.password });
      navigate('/dashboard');
    } catch (_) {}
  };

  const onChange = (field) => (e) => {
    setForm((p) => ({ ...p, [field]: e.target.value }));
    if (errors[field]) setErrors((p) => ({ ...p, [field]: '' }));
    if (field === 'password') setPwdTouched(true);
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
            TradeS
          </span>
        </Link>

        {/* Language Selector */}
        <div className="relative">
          <button 
            onClick={() => setLangOpen(!langOpen)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-emerald-950/40 hover:border-[#2ECC71]/30 bg-[#0E150F]/50 text-xs font-semibold text-slate-300 hover:text-white transition-all"
          >
            <Globe className="w-3.5 h-3.5" />
            <span className="uppercase">{currentLang}</span>
            <ChevronDown className={`w-3 h-3 transition-transform ${langOpen ? 'rotate-180' : ''}`} />
          </button>

          {langOpen && (
            <div className="absolute right-0 mt-2 w-28 rounded-xl border border-emerald-950/40 bg-[#0E150F] shadow-xl overflow-hidden py-1 z-50">
              {LANGS.map((lang) => (
                <button
                  key={lang}
                  onClick={() => {
                    i18n.changeLanguage(lang);
                    setLangOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 text-xs font-semibold hover:bg-[#1ABC9C]/10 text-slate-400 hover:text-white transition-all uppercase"
                >
                  {lang === 'uz' ? 'O‘zbekcha' : lang === 'ru' ? 'Русский' : 'English'}
                </button>
              ))}
            </div>
          )}
        </div>
      </nav>

      {/* Main Form Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-12 relative z-10">
        <div className="w-full max-w-[420px] bg-[#0E150F]/40 backdrop-blur-md rounded-2xl border border-[#2ECC71]/10 shadow-2xl p-6 sm:p-8">
          <div className="mb-6">
            <h2 className="text-2xl font-extrabold text-white">{tx.register_title}</h2>
            <p className="text-slate-400 text-sm mt-1">{tx.register_sub}</p>
          </div>

          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
            {/* Name */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">{tx.name_label}</label>
              <input 
                type="text" 
                autoComplete="name" 
                value={form.name} 
                onChange={onChange('name')} 
                placeholder={tx.name_ph} 
                className={inputCls('name')} 
              />
              {errors.name && <p className="text-red-400 text-xs mt-0.5">{errors.name}</p>}
            </div>

            {/* Email */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">{tx.email_label}</label>
              <input 
                type="email" 
                autoComplete="email" 
                value={form.email} 
                onChange={onChange('email')} 
                placeholder="example@mail.com" 
                className={inputCls('email')} 
              />
              {errors.email && <p className="text-red-400 text-xs mt-0.5">{errors.email}</p>}
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">{tx.pwd_label}</label>
              <div className="relative">
                <input
                  type={showPwd ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={form.password}
                  onChange={onChange('password')}
                  placeholder={tx.pwd_ph}
                  className={`w-full h-12 rounded-xl border px-4 pr-12 text-sm bg-[#0E150F]/50 text-white placeholder-slate-500 transition-all focus:outline-none focus:ring-2 focus:ring-[#2ECC71]/30 focus:border-[#2ECC71] ${
                    errors.password ? 'border-red-500/50 bg-red-950/20' : 'border-[#2ECC71]/10 hover:border-[#2ECC71]/20'
                  }`}
                />
                <button 
                  type="button" 
                  onClick={() => setShowPwd(p => !p)} 
                  tabIndex={-1} 
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 p-1.5 rounded-lg transition"
                >
                  {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && <p className="text-red-400 text-xs mt-0.5">{errors.password}</p>}

              {(pwdTouched || form.password.length > 0) && (
                <ul className="mt-2 grid grid-cols-2 gap-2">
                  {rules.map((rule) => {
                    const ok = rule.test(form.password);
                    return (
                      <li 
                        key={rule.label} 
                        className={`flex items-center gap-1.5 text-xs transition-colors ${
                          ok ? 'text-[#2ECC71]' : 'text-slate-500'
                        }`}
                      >
                        {ok ? <CheckCircle2 size={13} className="flex-shrink-0" /> : <XCircle size={13} className="flex-shrink-0" />}
                        {rule.label}
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 bg-[#2ECC71] hover:bg-[#2ecc71]/90 text-slate-950 text-sm font-extrabold rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-60 shadow-lg shadow-[#2ECC71]/10 mt-2 hover:scale-[1.02] active:scale-[0.98]"
            >
              {isLoading ? (
                <span className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <UserPlus size={16} />
                  {tx.submit}
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-slate-400">
            {tx.have_account}{' '}
            <Link to="/login" className="text-[#2ECC71] font-bold hover:underline transition">
              {tx.login}
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
            <span className="font-bold text-slate-400">TradeS</span>
          </div>
          <div>
            &copy; {new Date().getFullYear()} TradeS. {t('copyright')}
          </div>
        </div>
      </footer>
    </div>
  );
}
