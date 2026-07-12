import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Eye, EyeOff, UserPlus, CheckCircle2, XCircle,
  ShoppingBag, Globe, ChevronDown, Send, ArrowLeft, KeyRound, Smartphone, Mail
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import useAuthStore from '../store/authStore';

const LANGS = ['uz', 'ru', 'en'];
const BOT = import.meta.env.VITE_TELEGRAM_BOT || 'trades_uz_bot';

const TX = {
  uz: {
    register_title: "Hisob yaratish",
    register_sub:   "Telefon yoki email orqali ro'yxatdan o'ting",
    have_account:   "Hisobingiz bormi?",
    login:          "Kirish",
    tab_phone:      "Telefon",
    tab_email:      "Email",
    name_label:     "To'liq ism",
    name_ph:        "Ism va familiyangiz",
    phone_label:    "Telefon raqam",
    email_label:    "Email manzil",
    email_ph:       "email@misol.com",
    otp_desc_email: "Emailingizga yuborilgan 6 xonali kodni kiriting",
    pwd_label:      "Parol",
    pwd_ph:         "Kamida 8 ta belgi",
    submit:         "Kod olish",
    connect_title:  "Telegram'ni ulang",
    connect_desc:   "Tasdiqlash kodi Telegram orqali yuboriladi (bepul). Botni oching, «Start» bosing va «📱 Raqamni ulashish» tugmasi bilan raqamingizni yuboring.",
    connect_open:   "Telegram botni ochish",
    connect_done:   "Uladim — kod yuborish",
    otp_title:      "Tasdiqlash kodi",
    otp_desc:       "Telegram'ga yuborilgan 6 xonali kodni kiriting",
    otp_verify:     "Tasdiqlash",
    resend:         "Kodni qayta yuborish",
    back:           "Orqaga",
  },
  ru: {
    register_title: "Создать аккаунт",
    register_sub:   "Зарегистрируйтесь по телефону или email",
    have_account:   "Уже есть аккаунт?",
    login:          "Войти",
    tab_phone:      "Телефон",
    tab_email:      "Email",
    name_label:     "Полное имя",
    name_ph:        "Ваше имя и фамилия",
    phone_label:    "Номер телефона",
    email_label:    "Email адрес",
    email_ph:       "email@example.com",
    otp_desc_email: "Введите 6-значный код из письма",
    pwd_label:      "Пароль",
    pwd_ph:         "Минимум 8 символов",
    submit:         "Получить код",
    connect_title:  "Подключите Telegram",
    connect_desc:   "Код подтверждения придёт в Telegram (бесплатно). Откройте бота, нажмите «Start» и отправьте номер кнопкой «📱 Поделиться номером».",
    connect_open:   "Открыть Telegram-бота",
    connect_done:   "Подключил — отправить код",
    otp_title:      "Код подтверждения",
    otp_desc:       "Введите 6-значный код из Telegram",
    otp_verify:     "Подтвердить",
    resend:         "Отправить код повторно",
    back:           "Назад",
  },
  en: {
    register_title: "Create Account",
    register_sub:   "Sign up with your phone or email",
    have_account:   "Already have an account?",
    login:          "Sign In",
    tab_phone:      "Phone",
    tab_email:      "Email",
    name_label:     "Full Name",
    name_ph:        "Your full name",
    phone_label:    "Phone Number",
    email_label:    "Email Address",
    email_ph:       "email@example.com",
    otp_desc_email: "Enter the 6-digit code sent to your email",
    pwd_label:      "Password",
    pwd_ph:         "At least 8 characters",
    submit:         "Get Code",
    connect_title:  "Connect Telegram",
    connect_desc:   "The verification code is delivered via Telegram (free). Open the bot, press «Start» and share your number with the «📱 Share number» button.",
    connect_open:   "Open Telegram bot",
    connect_done:   "Connected — send code",
    otp_title:      "Verification Code",
    otp_desc:       "Enter the 6-digit code sent to your Telegram",
    otp_verify:     "Verify",
    resend:         "Resend code",
    back:           "Back",
  },
};

const getRules = (t) => [
  { label: t('rule_length'), test: (p) => p.length >= 8 },
  { label: t('rule_upper'),  test: (p) => /[A-Z]/.test(p) },
  { label: t('rule_lower'),  test: (p) => /[a-z]/.test(p) },
  { label: t('rule_number'), test: (p) => /\d/.test(p) },
];

// Format as +998 XX XXX XX XX from raw digits
const formatPhone = (raw) => {
  let d = raw.replace(/\D/g, '');
  if (d.startsWith('998')) d = d.slice(3);
  d = d.slice(0, 9);
  let out = '+998';
  if (d.length) out += ' ' + d.slice(0, 2);
  if (d.length > 2) out += ' ' + d.slice(2, 5);
  if (d.length > 5) out += ' ' + d.slice(5, 7);
  if (d.length > 7) out += ' ' + d.slice(7, 9);
  return out;
};

export default function Register() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const requestOtp = useAuthStore((s) => s.requestOtp);
  const verifyOtp = useAuthStore((s) => s.verifyOtp);
  const requestEmailOtp = useAuthStore((s) => s.requestEmailOtp);
  const verifyEmailOtp = useAuthStore((s) => s.verifyEmailOtp);
  const isLoading = useAuthStore((s) => s.isLoading);

  const [step, setStep] = useState('form'); // 'form' | 'connect' | 'otp'
  const [method, setMethod] = useState('phone'); // 'phone' | 'email'
  const [form, setForm] = useState({ name: '', phone: '+998 ', email: '', password: '' });
  const [code, setCode] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [pwdTouched, setPwdTouched] = useState(false);
  const [errors, setErrors] = useState({});
  const [langOpen, setLangOpen] = useState(false);

  const currentLang = i18n.language.startsWith('ru') ? 'ru' : i18n.language.startsWith('en') ? 'en' : 'uz';
  const tx = TX[currentLang];

  const rules = getRules(t);
  const pwdValid = rules.every((r) => r.test(form.password));
  const phoneDigits = form.phone.replace(/\D/g, '');

  const validate = () => {
    const e = {};
    if (!form.name.trim())          e.name = t('name_required');
    if (method === 'phone') {
      if (phoneDigits.length < 12)  e.phone = t('phone_required') || 'Telefon raqamni to\'liq kiriting';
    } else {
      if (!/^\S+@\S+\.\S+$/.test(form.email.trim()))
        e.email = t('email_required') || 'Email manzilni kiriting';
    }
    if (!form.password)             e.password = t('password_required');
    else if (!pwdValid)             e.password = t('rule_length');
    return e;
  };

  // Send / resend the OTP. Phone → Telegram (428 → connect step); email → Resend code.
  const sendCode = async () => {
    try {
      if (method === 'email') {
        await requestEmailOtp(form.email.trim().toLowerCase());
        setStep('otp');
        toast.success(tx.otp_desc_email);
      } else {
        await requestOtp(form.phone);
        setStep('otp');
        toast.success(tx.otp_desc);
      }
    } catch (err) {
      // Non-428 errors already surface a toast via the shared axios interceptor.
      if (method === 'phone' && err.response?.status === 428) {
        setStep('connect');
      }
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setPwdTouched(true);
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    await sendCode();
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    if (code.replace(/\D/g, '').length !== 6) return;
    try {
      if (method === 'email') {
        await verifyEmailOtp({
          email: form.email.trim().toLowerCase(),
          code: code.replace(/\D/g, ''),
          name: form.name.trim(),
          password: form.password,
        });
      } else {
        await verifyOtp({
          phone: form.phone,
          code: code.replace(/\D/g, ''),
          name: form.name.trim(),
          password: form.password,
        });
      }
      toast.success(t('toast_welcome_back', { name: form.name.trim() }));
      navigate('/dashboard');
    } catch (err) {
      // Error toast already shown by the shared axios interceptor.
    }
  };

  const onChange = (field) => (e) => {
    const val = field === 'phone' ? formatPhone(e.target.value) : e.target.value;
    setForm((p) => ({ ...p, [field]: val }));
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

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-12 relative z-10">
        <div className="w-full max-w-[420px] bg-[#0E150F]/40 backdrop-blur-md rounded-2xl border border-[#2ECC71]/10 shadow-2xl p-6 sm:p-8">

          {/* ── STEP: FORM ─────────────────────────────── */}
          {step === 'form' && (
            <>
              <div className="mb-6">
                <h2 className="text-2xl font-extrabold text-white">{tx.register_title}</h2>
                <p className="text-slate-400 text-sm mt-1">{tx.register_sub}</p>
              </div>

              {/* Method toggle: phone (Telegram OTP) vs email (Resend OTP) */}
              <div className="flex gap-1 p-1 rounded-xl bg-[#0E150F]/60 border border-[#2ECC71]/10 mb-5">
                <button
                  type="button"
                  onClick={() => { setMethod('phone'); setErrors({}); }}
                  className={`flex-1 flex items-center justify-center gap-2 h-10 rounded-lg text-sm font-bold transition-all ${
                    method === 'phone' ? 'bg-[#2ECC71] text-slate-950' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Smartphone size={15} /> {tx.tab_phone}
                </button>
                <button
                  type="button"
                  onClick={() => { setMethod('email'); setErrors({}); }}
                  className={`flex-1 flex items-center justify-center gap-2 h-10 rounded-lg text-sm font-bold transition-all ${
                    method === 'email' ? 'bg-[#2ECC71] text-slate-950' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Mail size={15} /> {tx.tab_email}
                </button>
              </div>

              <form onSubmit={handleFormSubmit} noValidate className="flex flex-col gap-5">
                {/* Name */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">{tx.name_label}</label>
                  <input type="text" autoComplete="name" value={form.name} onChange={onChange('name')} placeholder={tx.name_ph} className={inputCls('name')} />
                  {errors.name && <p className="text-red-400 text-xs mt-0.5">{errors.name}</p>}
                </div>

                {/* Phone or Email (by selected method) */}
                {method === 'phone' ? (
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">{tx.phone_label}</label>
                    <input type="tel" autoComplete="tel" value={form.phone} onChange={onChange('phone')} placeholder="+998 90 123 45 67" className={inputCls('phone')} />
                    {errors.phone && <p className="text-red-400 text-xs mt-0.5">{errors.phone}</p>}
                  </div>
                ) : (
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">{tx.email_label}</label>
                    <input type="email" autoComplete="email" value={form.email} onChange={onChange('email')} placeholder={tx.email_ph} className={inputCls('email')} />
                    {errors.email && <p className="text-red-400 text-xs mt-0.5">{errors.email}</p>}
                  </div>
                )}

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
                    <button type="button" onClick={() => setShowPwd(p => !p)} tabIndex={-1} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 p-1.5 rounded-lg transition">
                      {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {errors.password && <p className="text-red-400 text-xs mt-0.5">{errors.password}</p>}

                  {(pwdTouched || form.password.length > 0) && (
                    <ul className="mt-2 grid grid-cols-2 gap-2">
                      {rules.map((rule) => {
                        const ok = rule.test(form.password);
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

                <button type="submit" disabled={isLoading} className="w-full h-12 bg-[#2ECC71] hover:bg-[#2ecc71]/90 text-slate-950 text-sm font-extrabold rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-60 shadow-lg shadow-[#2ECC71]/10 mt-2 hover:scale-[1.02] active:scale-[0.98]">
                  {isLoading ? <span className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" /> : <><UserPlus size={16} />{tx.submit}</>}
                </button>
              </form>

              <div className="mt-6 text-center text-sm text-slate-400">
                {tx.have_account}{' '}
                <Link to="/login" className="text-[#2ECC71] font-bold hover:underline transition">{tx.login}</Link>
              </div>
            </>
          )}

          {/* ── STEP: CONNECT TELEGRAM ─────────────────── */}
          {step === 'connect' && (
            <>
              <button onClick={() => setStep('form')} className="flex items-center gap-1.5 text-slate-400 hover:text-white text-sm mb-5 transition">
                <ArrowLeft size={16} /> {tx.back}
              </button>
              <div className="flex flex-col items-center text-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-[#229ED9]/15 flex items-center justify-center">
                  <Send className="w-8 h-8 text-[#229ED9]" />
                </div>
                <h2 className="text-2xl font-extrabold text-white">{tx.connect_title}</h2>
                <p className="text-slate-400 text-sm leading-relaxed">{tx.connect_desc}</p>

                <a href={`https://t.me/${BOT}`} target="_blank" rel="noopener noreferrer"
                   className="w-full h-12 bg-[#229ED9] hover:bg-[#229ED9]/90 text-white text-sm font-extrabold rounded-xl transition-all flex items-center justify-center gap-2 mt-1">
                  <Send size={16} /> {tx.connect_open}
                </a>

                <button onClick={sendCode} disabled={isLoading}
                   className="w-full h-12 bg-[#2ECC71] hover:bg-[#2ecc71]/90 text-slate-950 text-sm font-extrabold rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-60">
                  {isLoading ? <span className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" /> : tx.connect_done}
                </button>
              </div>
            </>
          )}

          {/* ── STEP: OTP ──────────────────────────────── */}
          {step === 'otp' && (
            <>
              <button onClick={() => setStep('form')} className="flex items-center gap-1.5 text-slate-400 hover:text-white text-sm mb-5 transition">
                <ArrowLeft size={16} /> {tx.back}
              </button>
              <div className="flex flex-col items-center text-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-[#2ECC71]/15 flex items-center justify-center">
                  <KeyRound className="w-8 h-8 text-[#2ECC71]" />
                </div>
                <h2 className="text-2xl font-extrabold text-white">{tx.otp_title}</h2>
                <p className="text-slate-400 text-sm">{method === 'email' ? tx.otp_desc_email : tx.otp_desc}</p>
                <p className="text-[#2ECC71] font-semibold text-sm">{method === 'email' ? form.email : form.phone}</p>
              </div>

              <form onSubmit={handleVerify} className="flex flex-col gap-4 mt-5">
                <input
                  type="text"
                  inputMode="numeric"
                  autoFocus
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="••••••"
                  className="w-full h-14 rounded-xl border border-[#2ECC71]/20 bg-[#0E150F]/50 text-white text-center text-2xl font-extrabold tracking-[0.5em] placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-[#2ECC71]/30 focus:border-[#2ECC71]"
                />
                <button type="submit" disabled={isLoading || code.length !== 6}
                  className="w-full h-12 bg-[#2ECC71] hover:bg-[#2ecc71]/90 text-slate-950 text-sm font-extrabold rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-60">
                  {isLoading ? <span className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" /> : <><CheckCircle2 size={16} />{tx.otp_verify}</>}
                </button>
                <button type="button" onClick={sendCode} disabled={isLoading} className="text-[#2ECC71] text-sm font-bold hover:underline disabled:opacity-50">
                  {tx.resend}
                </button>
              </form>
            </>
          )}

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
