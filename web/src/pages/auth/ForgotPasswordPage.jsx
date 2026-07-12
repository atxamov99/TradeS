import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Eye, EyeOff, CheckCircle2, XCircle, ShoppingBag, Globe, ChevronDown,
  Send, ArrowLeft, KeyRound, Smartphone, Mail,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { forgotPassword, resetPassword } from '../../api/auth.api';

const LANGS = ['uz', 'ru', 'en'];
const BOT = import.meta.env.VITE_TELEGRAM_BOT || 'trades_uz_bot';

const TX = {
  uz: {
    title:        "Parolni tiklash",
    sub:          "Hisobingizga qayta kirish uchun parolni yangilang",
    tab_phone:    "Telefon",
    tab_email:    "Email",
    phone_label:  "Telefon raqam",
    phone_hint:   "Tasdiqlash kodi Telegram orqali yuboriladi",
    email_label:  "Email manzil",
    email_hint:   "Parolni tiklash havolasi shu emailga yuboriladi",
    send_code:    "Kod olish",
    send_link:    "Havola yuborish",
    connect_title: "Telegram'ni ulang",
    connect_desc:  "Kod Telegram orqali yuboriladi (bepul). Botni oching, «Start» bosing va «📱 Raqamni ulashish» tugmasi bilan raqamingizni yuboring.",
    connect_open:  "Telegram botni ochish",
    connect_done:  "Uladim — kod yuborish",
    otp_title:    "Yangi parol o'rnatish",
    otp_desc:     "Telegram'ga yuborilgan 6 xonali kodni va yangi parolni kiriting",
    newpwd_label: "Yangi parol",
    newpwd_ph:    "Kamida 8 ta belgi",
    confirm_label: "Parolni takrorlang",
    confirm_ph:   "Parolni qayta kiriting",
    save_pwd:     "Parolni yangilash",
    resend:       "Kodni qayta yuborish",
    back:         "Orqaga",
    back_login:   "Kirishga qaytish",
    sent_title:   "Emailni tekshiring",
    sent_desc:    "Agar bu email ro'yxatdan o'tgan bo'lsa, parolni tiklash havolasini yubordik.",
    sent_expiry:  "Havola cheklangan vaqt amal qiladi. Kelmasa spam papkasini tekshiring.",
    phone_required: "Telefon raqamni to'liq kiriting",
    email_required: "Email manzilni kiriting",
    updated:      "Parol muvaffaqiyatli yangilandi",
    err_generic:  "Xatolik yuz berdi",
    rule_length:  "Kamida 8 ta belgi",
    rule_upper:   "Bitta katta harf (A-Z)",
    rule_lower:   "Bitta kichik harf (a-z)",
    rule_number:  "Bitta raqam (0-9)",
    pwd_mismatch: "Parollar mos kelmadi",
  },
  ru: {
    title:        "Сброс пароля",
    sub:          "Обновите пароль, чтобы снова войти в аккаунт",
    tab_phone:    "Телефон",
    tab_email:    "Email",
    phone_label:  "Номер телефона",
    phone_hint:   "Код подтверждения придёт в Telegram",
    email_label:  "Email адрес",
    email_hint:   "Ссылка для сброса пароля придёт на этот email",
    send_code:    "Получить код",
    send_link:    "Отправить ссылку",
    connect_title: "Подключите Telegram",
    connect_desc:  "Код придёт в Telegram (бесплатно). Откройте бота, нажмите «Start» и отправьте номер кнопкой «📱 Поделиться номером».",
    connect_open:  "Открыть Telegram-бота",
    connect_done:  "Подключил — отправить код",
    otp_title:    "Установить новый пароль",
    otp_desc:     "Введите 6-значный код из Telegram и новый пароль",
    newpwd_label: "Новый пароль",
    newpwd_ph:    "Минимум 8 символов",
    confirm_label: "Повторите пароль",
    confirm_ph:   "Введите пароль ещё раз",
    save_pwd:     "Обновить пароль",
    resend:       "Отправить код повторно",
    back:         "Назад",
    back_login:   "Вернуться ко входу",
    sent_title:   "Проверьте почту",
    sent_desc:    "Если этот email зарегистрирован, мы отправили ссылку для сброса пароля.",
    sent_expiry:  "Ссылка действует ограниченное время. Проверьте папку «Спам», если письма нет.",
    phone_required: "Введите номер телефона полностью",
    email_required: "Введите email адрес",
    updated:      "Пароль успешно обновлён",
    err_generic:  "Произошла ошибка",
    rule_length:  "Минимум 8 символов",
    rule_upper:   "Одна заглавная буква (A-Z)",
    rule_lower:   "Одна строчная буква (a-z)",
    rule_number:  "Одна цифра (0-9)",
    pwd_mismatch: "Пароли не совпадают",
  },
  en: {
    title:        "Reset Password",
    sub:          "Update your password to sign back into your account",
    tab_phone:    "Phone",
    tab_email:    "Email",
    phone_label:  "Phone Number",
    phone_hint:   "The verification code is sent via Telegram",
    email_label:  "Email Address",
    email_hint:   "The password reset link will be sent to this email",
    send_code:    "Get Code",
    send_link:    "Send Link",
    connect_title: "Connect Telegram",
    connect_desc:  "The code is delivered via Telegram (free). Open the bot, press «Start» and share your number with the «📱 Share number» button.",
    connect_open:  "Open Telegram bot",
    connect_done:  "Connected — send code",
    otp_title:    "Set a New Password",
    otp_desc:     "Enter the 6-digit code from Telegram and your new password",
    newpwd_label: "New Password",
    newpwd_ph:    "At least 8 characters",
    confirm_label: "Repeat Password",
    confirm_ph:   "Re-enter the password",
    save_pwd:     "Update Password",
    resend:       "Resend code",
    back:         "Back",
    back_login:   "Back to sign in",
    sent_title:   "Check your email",
    sent_desc:    "If this email is registered, we've sent a password reset link.",
    sent_expiry:  "The link is valid for a limited time. Check your spam folder if it doesn't arrive.",
    phone_required: "Enter your full phone number",
    email_required: "Enter your email address",
    updated:      "Password updated successfully",
    err_generic:  "Something went wrong",
    rule_length:  "At least 8 characters",
    rule_upper:   "One uppercase letter (A-Z)",
    rule_lower:   "One lowercase letter (a-z)",
    rule_number:  "One number (0-9)",
    pwd_mismatch: "Passwords do not match",
  },
};

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

export function ForgotPasswordPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  const lang = i18n.language.startsWith('ru') ? 'ru' : i18n.language.startsWith('en') ? 'en' : 'uz';
  const tx = TX[lang];

  const [method, setMethod] = useState('phone'); // 'phone' | 'email'
  const [step, setStep] = useState('request');    // 'request' | 'connect' | 'otp' | 'sent'
  const [langOpen, setLangOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const [phone, setPhone] = useState('+998 ');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [errors, setErrors] = useState({});

  const phoneDigits = phone.replace(/\D/g, '');

  const rules = [
    { label: tx.rule_length, test: (p) => p.length >= 8 },
    { label: tx.rule_upper,  test: (p) => /[A-Z]/.test(p) },
    { label: tx.rule_lower,  test: (p) => /[a-z]/.test(p) },
    { label: tx.rule_number, test: (p) => /\d/.test(p) },
  ];
  const pwdValid = rules.every((r) => r.test(password));

  const inputCls = (f) =>
    `w-full h-12 rounded-xl border px-4 text-sm bg-[#0E150F]/50 text-white placeholder-slate-500 transition-all focus:outline-none focus:ring-2 focus:ring-[#2ECC71]/30 focus:border-[#2ECC71] ${
      errors[f] ? 'border-red-500/50 bg-red-950/20' : 'border-[#2ECC71]/10 hover:border-[#2ECC71]/20'
    }`;

  // ── Send / resend the OTP for the phone flow. 428 → show the Telegram connect step.
  const sendCode = async () => {
    setLoading(true);
    try {
      await forgotPassword({ phone: phone.replace(/\s/g, '') });
      setStep('otp');
      toast.success(tx.otp_desc);
    } catch (err) {
      // The axios interceptor already toasts the error message; here we only need
      // to branch on 428 (Telegram not linked) to show the connect step.
      if (err.response?.status === 428) setStep('connect');
    } finally {
      setLoading(false);
    }
  };

  const handleRequest = async (e) => {
    e.preventDefault();
    if (method === 'phone') {
      if (phoneDigits.length < 12) { setErrors({ phone: tx.phone_required }); return; }
      setErrors({});
      await sendCode();
    } else {
      if (!email.trim()) { setErrors({ email: tx.email_required }); return; }
      setErrors({});
      setLoading(true);
      try {
        await forgotPassword({ email: email.trim().toLowerCase() });
        setStep('sent');
      } catch {
        // interceptor already surfaces the error
      } finally {
        setLoading(false);
      }
    }
  };

  const handleReset = async (e) => {
    e.preventDefault();
    const errs = {};
    if (code.replace(/\D/g, '').length !== 6) errs.code = true;
    if (!pwdValid) errs.password = true;
    if (password !== confirm) errs.confirm = tx.pwd_mismatch;
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    setLoading(true);
    try {
      await resetPassword({ phone: phone.replace(/\s/g, ''), code: code.replace(/\D/g, ''), password });
      toast.success(tx.updated);
      navigate('/login', { replace: true });
    } catch {
      // interceptor already surfaces the error (e.g. wrong/expired code)
    } finally {
      setLoading(false);
    }
  };

  const switchMethod = (m) => {
    setMethod(m);
    setStep('request');
    setErrors({});
  };

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

          {/* ── STEP: REQUEST (method switch + input) ──────────────── */}
          {step === 'request' && (
            <>
              <div className="mb-6">
                <h2 className="text-2xl font-extrabold text-white">{tx.title}</h2>
                <p className="text-slate-400 text-sm mt-1">{tx.sub}</p>
              </div>

              {/* Method toggle */}
              <div className="flex gap-1 p-1 rounded-xl bg-[#0E150F]/60 border border-[#2ECC71]/10 mb-5">
                <button
                  type="button"
                  onClick={() => switchMethod('phone')}
                  className={`flex-1 flex items-center justify-center gap-2 h-10 rounded-lg text-sm font-bold transition-all ${
                    method === 'phone' ? 'bg-[#2ECC71] text-slate-950' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Smartphone size={15} /> {tx.tab_phone}
                </button>
                <button
                  type="button"
                  onClick={() => switchMethod('email')}
                  className={`flex-1 flex items-center justify-center gap-2 h-10 rounded-lg text-sm font-bold transition-all ${
                    method === 'email' ? 'bg-[#2ECC71] text-slate-950' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Mail size={15} /> {tx.tab_email}
                </button>
              </div>

              <form onSubmit={handleRequest} noValidate className="flex flex-col gap-5">
                {method === 'phone' ? (
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">{tx.phone_label}</label>
                    <input
                      type="tel"
                      autoComplete="tel"
                      autoFocus
                      value={phone}
                      onChange={(e) => { setPhone(formatPhone(e.target.value)); if (errors.phone) setErrors({}); }}
                      placeholder="+998 90 123 45 67"
                      className={inputCls('phone')}
                    />
                    {errors.phone
                      ? <p className="text-red-400 text-xs mt-0.5">{errors.phone}</p>
                      : <p className="text-slate-500 text-xs mt-0.5">{tx.phone_hint}</p>}
                  </div>
                ) : (
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">{tx.email_label}</label>
                    <input
                      type="email"
                      autoComplete="email"
                      autoFocus
                      value={email}
                      onChange={(e) => { setEmail(e.target.value); if (errors.email) setErrors({}); }}
                      placeholder="email@savdo.uz"
                      className={inputCls('email')}
                    />
                    {errors.email
                      ? <p className="text-red-400 text-xs mt-0.5">{errors.email}</p>
                      : <p className="text-slate-500 text-xs mt-0.5">{tx.email_hint}</p>}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-12 bg-[#2ECC71] hover:bg-[#2ecc71]/90 text-slate-950 text-sm font-extrabold rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-60 shadow-lg shadow-[#2ECC71]/10 mt-1 hover:scale-[1.02] active:scale-[0.98]"
                >
                  {loading
                    ? <span className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                    : (method === 'phone' ? tx.send_code : tx.send_link)}
                </button>
              </form>

              <div className="mt-6 text-center">
                <Link to="/login" className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition">
                  <ArrowLeft size={14} /> {tx.back_login}
                </Link>
              </div>
            </>
          )}

          {/* ── STEP: CONNECT TELEGRAM (428) ───────────────────────── */}
          {step === 'connect' && (
            <>
              <button onClick={() => setStep('request')} className="flex items-center gap-1.5 text-slate-400 hover:text-white text-sm mb-5 transition">
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
                <button onClick={sendCode} disabled={loading}
                   className="w-full h-12 bg-[#2ECC71] hover:bg-[#2ecc71]/90 text-slate-950 text-sm font-extrabold rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-60">
                  {loading ? <span className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" /> : tx.connect_done}
                </button>
              </div>
            </>
          )}

          {/* ── STEP: OTP + NEW PASSWORD (phone flow) ──────────────── */}
          {step === 'otp' && (
            <>
              <button onClick={() => setStep('request')} className="flex items-center gap-1.5 text-slate-400 hover:text-white text-sm mb-5 transition">
                <ArrowLeft size={16} /> {tx.back}
              </button>
              <div className="flex flex-col items-center text-center gap-3 mb-5">
                <div className="w-16 h-16 rounded-2xl bg-[#2ECC71]/15 flex items-center justify-center">
                  <KeyRound className="w-8 h-8 text-[#2ECC71]" />
                </div>
                <h2 className="text-2xl font-extrabold text-white">{tx.otp_title}</h2>
                <p className="text-slate-400 text-sm">{tx.otp_desc}</p>
                <p className="text-[#2ECC71] font-semibold text-sm">{phone}</p>
              </div>

              <form onSubmit={handleReset} noValidate className="flex flex-col gap-4">
                {/* Code */}
                <input
                  type="text"
                  inputMode="numeric"
                  autoFocus
                  maxLength={6}
                  value={code}
                  onChange={(e) => { setCode(e.target.value.replace(/\D/g, '').slice(0, 6)); if (errors.code) setErrors((p) => ({ ...p, code: false })); }}
                  placeholder="••••••"
                  className={`w-full h-14 rounded-xl border bg-[#0E150F]/50 text-white text-center text-2xl font-extrabold tracking-[0.5em] placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-[#2ECC71]/30 focus:border-[#2ECC71] ${
                    errors.code ? 'border-red-500/50' : 'border-[#2ECC71]/20'
                  }`}
                />

                {/* New password */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">{tx.newpwd_label}</label>
                  <div className="relative">
                    <input
                      type={showPwd ? 'text' : 'password'}
                      autoComplete="new-password"
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
                  {(password.length > 0) && (
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
                  className="w-full h-12 bg-[#2ECC71] hover:bg-[#2ecc71]/90 text-slate-950 text-sm font-extrabold rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-60 mt-1"
                >
                  {loading ? <span className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" /> : <><CheckCircle2 size={16} />{tx.save_pwd}</>}
                </button>
                <button type="button" onClick={sendCode} disabled={loading} className="text-[#2ECC71] text-sm font-bold hover:underline disabled:opacity-50">
                  {tx.resend}
                </button>
              </form>
            </>
          )}

          {/* ── STEP: EMAIL SENT ───────────────────────────────────── */}
          {step === 'sent' && (
            <div className="flex flex-col items-center text-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-[#2ECC71]/15 flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-[#2ECC71]" />
              </div>
              <h2 className="text-2xl font-extrabold text-white">{tx.sent_title}</h2>
              <p className="text-slate-400 text-sm leading-relaxed">
                {tx.sent_desc} {email && <strong className="text-slate-200">{email}</strong>}
              </p>
              <p className="text-slate-500 text-xs">{tx.sent_expiry}</p>
              <Link to="/login" className="inline-flex items-center gap-1.5 text-sm text-[#2ECC71] font-bold hover:underline transition mt-1">
                <ArrowLeft size={14} /> {tx.back_login}
              </Link>
            </div>
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
