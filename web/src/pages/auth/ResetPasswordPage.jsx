import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Eye, EyeOff, CheckCircle2, XCircle, ShoppingBag, Globe, ChevronDown,
  KeyRound, ArrowLeft, AlertTriangle,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { resetPassword } from '../../api/auth.api';

const LANGS = ['uz', 'ru', 'en'];

const TX = {
  uz: {
    title:        "Yangi parol o'rnatish",
    sub:          "Hisobingiz uchun yangi parol kiriting",
    newpwd_label: "Yangi parol",
    newpwd_ph:    "Kamida 8 ta belgi",
    confirm_label: "Parolni takrorlang",
    confirm_ph:   "Parolni qayta kiriting",
    save_pwd:     "Parolni saqlash",
    back_login:   "Kirishga qaytish",
    updated:      "Parol muvaffaqiyatli yangilandi",
    redirecting:  "Kirish sahifasiga yo'naltirilmoqda...",
    invalid_title: "Havola yaroqsiz",
    invalid_desc: "Parol tiklash havolasi yaroqsiz yoki muddati tugagan.",
    request_new:  "Yangi havola so'rash",
    rule_length:  "Kamida 8 ta belgi",
    rule_upper:   "Bitta katta harf (A-Z)",
    rule_lower:   "Bitta kichik harf (a-z)",
    rule_number:  "Bitta raqam (0-9)",
    pwd_mismatch: "Parollar mos kelmadi",
  },
  ru: {
    title:        "Установить новый пароль",
    sub:          "Введите новый пароль для вашего аккаунта",
    newpwd_label: "Новый пароль",
    newpwd_ph:    "Минимум 8 символов",
    confirm_label: "Повторите пароль",
    confirm_ph:   "Введите пароль ещё раз",
    save_pwd:     "Сохранить пароль",
    back_login:   "Вернуться ко входу",
    updated:      "Пароль успешно обновлён",
    redirecting:  "Перенаправление на страницу входа...",
    invalid_title: "Ссылка недействительна",
    invalid_desc: "Ссылка для сброса пароля недействительна или устарела.",
    request_new:  "Запросить новую ссылку",
    rule_length:  "Минимум 8 символов",
    rule_upper:   "Одна заглавная буква (A-Z)",
    rule_lower:   "Одна строчная буква (a-z)",
    rule_number:  "Одна цифра (0-9)",
    pwd_mismatch: "Пароли не совпадают",
  },
  en: {
    title:        "Set a New Password",
    sub:          "Enter a new password for your account",
    newpwd_label: "New Password",
    newpwd_ph:    "At least 8 characters",
    confirm_label: "Repeat Password",
    confirm_ph:   "Re-enter the password",
    save_pwd:     "Save Password",
    back_login:   "Back to sign in",
    updated:      "Password updated successfully",
    redirecting:  "Redirecting to the sign-in page...",
    invalid_title: "Invalid Link",
    invalid_desc: "This password reset link is invalid or has expired.",
    request_new:  "Request a new link",
    rule_length:  "At least 8 characters",
    rule_upper:   "One uppercase letter (A-Z)",
    rule_lower:   "One lowercase letter (a-z)",
    rule_number:  "One number (0-9)",
    pwd_mismatch: "Passwords do not match",
  },
};

function Shell({ children, lang, i18n, langOpen, setLangOpen, t }) {
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
                  onClick={() => { i18n.changeLanguage(l); setLangOpen(false); }}
                  className="w-full text-left px-4 py-2 text-xs font-semibold hover:bg-[#1ABC9C]/10 text-slate-400 hover:text-white transition-all uppercase"
                >
                  {l === 'uz' ? 'O‘zbekcha' : l === 'ru' ? 'Русский' : 'English'}
                </button>
              ))}
            </div>
          )}
        </div>
      </nav>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-12 relative z-10">
        <div className="w-full max-w-[420px] bg-[#0E150F]/40 backdrop-blur-md rounded-2xl border border-[#2ECC71]/10 shadow-2xl p-6 sm:p-8">
          {children}
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

export function ResetPasswordPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const lang = i18n.language.startsWith('ru') ? 'ru' : i18n.language.startsWith('en') ? 'en' : 'uz';
  const tx = TX[lang];

  const [langOpen, setLangOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [errors, setErrors] = useState({});

  const rules = [
    { label: tx.rule_length, test: (p) => p.length >= 8 },
    { label: tx.rule_upper,  test: (p) => /[A-Z]/.test(p) },
    { label: tx.rule_lower,  test: (p) => /[a-z]/.test(p) },
    { label: tx.rule_number, test: (p) => /\d/.test(p) },
  ];
  const pwdValid = rules.every((r) => r.test(password));

  const shellProps = { lang, i18n, langOpen, setLangOpen, t };

  // No token in the URL → the link is invalid/expired.
  if (!token) {
    return (
      <Shell {...shellProps}>
        <div className="flex flex-col items-center text-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/15 flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-amber-400" />
          </div>
          <h2 className="text-2xl font-extrabold text-white">{tx.invalid_title}</h2>
          <p className="text-slate-400 text-sm leading-relaxed">{tx.invalid_desc}</p>
          <Link to="/forgot-password" className="inline-flex items-center gap-1.5 text-sm text-[#2ECC71] font-bold hover:underline transition mt-1">
            {tx.request_new}
          </Link>
        </div>
      </Shell>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!pwdValid) errs.password = true;
    if (password !== confirm) errs.confirm = tx.pwd_mismatch;
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    setLoading(true);
    try {
      await resetPassword({ token, password });
      setDone(true);
      toast.success(tx.updated);
      setTimeout(() => navigate('/login', { replace: true }), 2500);
    } catch {
      // the axios interceptor already surfaces the error (e.g. invalid/expired token)
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <Shell {...shellProps}>
        <div className="flex flex-col items-center text-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-[#2ECC71]/15 flex items-center justify-center">
            <CheckCircle2 className="w-8 h-8 text-[#2ECC71]" />
          </div>
          <h2 className="text-2xl font-extrabold text-white">{tx.updated}</h2>
          <p className="text-slate-400 text-sm">{tx.redirecting}</p>
        </div>
      </Shell>
    );
  }

  return (
    <Shell {...shellProps}>
      <div className="flex flex-col items-center text-center gap-3 mb-5">
        <div className="w-16 h-16 rounded-2xl bg-[#2ECC71]/15 flex items-center justify-center">
          <KeyRound className="w-8 h-8 text-[#2ECC71]" />
        </div>
        <h2 className="text-2xl font-extrabold text-white">{tx.title}</h2>
        <p className="text-slate-400 text-sm">{tx.sub}</p>
      </div>

      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        {/* New password */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">{tx.newpwd_label}</label>
          <div className="relative">
            <input
              type={showPwd ? 'text' : 'password'}
              autoComplete="new-password"
              autoFocus
              value={password}
              onChange={(e) => { setPassword(e.target.value); if (errors.password) setErrors((p) => ({ ...p, password: false })); }}
              placeholder={tx.newpwd_ph}
              className={`w-full h-12 rounded-xl border px-4 pr-12 text-sm bg-[#0E150F]/50 text-white placeholder-slate-500 transition-all focus:outline-none focus:ring-2 focus:ring-[#2ECC71]/30 focus:border-[#2ECC71] ${
                errors.password ? 'border-red-500/50 bg-red-950/20' : 'border-[#2ECC71]/10 hover:border-[#2ECC71]/20'
              }`}
            />
            <button type="button" onClick={() => setShowPwd((p) => !p)} tabIndex={-1} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 p-1.5 rounded-lg transition">
              {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {password.length > 0 && (
            <ul className="mt-2 grid grid-cols-2 gap-2">
              {rules.map((rule) => {
                const ok = rule.test(password);
                return (
                  <li key={rule.label} className={`flex items-center gap-1.5 text-xs transition-colors ${ok ? 'text-[#2ECC71]' : 'text-slate-500'}`}>
                    {ok ? <CheckCircle2 size={13} className="flex-shrink-0" /> : <XCircle size={13} className="flex-shrink-0" />}
                    {rule.label}
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Confirm password */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">{tx.confirm_label}</label>
          <input
            type={showPwd ? 'text' : 'password'}
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => { setConfirm(e.target.value); if (errors.confirm) setErrors((p) => ({ ...p, confirm: '' })); }}
            placeholder={tx.confirm_ph}
            className={`w-full h-12 rounded-xl border px-4 text-sm bg-[#0E150F]/50 text-white placeholder-slate-500 transition-all focus:outline-none focus:ring-2 focus:ring-[#2ECC71]/30 focus:border-[#2ECC71] ${
              errors.confirm ? 'border-red-500/50 bg-red-950/20' : 'border-[#2ECC71]/10 hover:border-[#2ECC71]/20'
            }`}
          />
          {errors.confirm && <p className="text-red-400 text-xs mt-0.5">{errors.confirm}</p>}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full h-12 bg-[#2ECC71] hover:bg-[#2ecc71]/90 text-slate-950 text-sm font-extrabold rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-60 shadow-lg shadow-[#2ECC71]/10 mt-1"
        >
          {loading ? <span className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" /> : <><CheckCircle2 size={16} />{tx.save_pwd}</>}
        </button>
      </form>

      <div className="mt-6 text-center">
        <Link to="/login" className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition">
          <ArrowLeft size={14} /> {tx.back_login}
        </Link>
      </div>
    </Shell>
  );
}
