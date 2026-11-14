import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { Link2, Phone, Mail, Loader2, Check } from 'lucide-react';
import useAuthStore from '../../store/authStore';
import api from '../../api/axios';

// Settings card: link a phone number to an account opened with an email, or an email to an account opened
// with a phone. Always: current password + a code sent to the NEW phone (Telegram) / email.
function LinkRow({ kind }) {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const fetchMe = useAuthStore((s) => s.fetchMe);
  const isEmail = kind === 'email';
  const current = isEmail ? user?.email : user?.phone;
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState('form'); // form | code
  const [value, setValue] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [devCode, setDevCode] = useState('');
  const [busy, setBusy] = useState(false);

  const reset = () => { setOpen(false); setStep('form'); setValue(''); setPassword(''); setCode(''); setDevCode(''); };
  const base = `/auth/link/${kind}`;
  const body = isEmail ? { email: value.trim().toLowerCase() } : { phone: value.trim() };

  const explain = (err) => {
    const st = err.response?.status;
    const c = err.response?.data?.code;
    if (c === 'IDENTIFIER_TAKEN') return t(isEmail ? 'lk_taken_email' : 'lk_taken_phone');
    if (c === 'INVALID_CREDENTIALS') return t('lk_wrong_pw');
    if (st === 428) return t('lk_need_bot');
    if (st === 429) return t('lk_too_many');
    return err.response?.data?.message || t('lk_error');
  };

  const send = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await api.post(`${base}/request`, { ...body, password });
      setDevCode(res.data?.data?.devCode || '');
      setStep('code');
      toast.success(t(isEmail ? 'lk_sent_email' : 'lk_sent_phone'));
    } catch (err) {
      toast.error(explain(err));
    } finally {
      setBusy(false);
    }
  };

  const confirm = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api.post(`${base}/verify`, { ...body, code: code.trim() });
      await fetchMe();
      toast.success(t('lk_done'));
      reset();
    } catch (err) {
      toast.error(explain(err));
    } finally {
      setBusy(false);
    }
  };

  const input =
    'w-full h-11 px-3 rounded-xl border border-[#E2E8F0] dark:border-[#223027] bg-white dark:bg-[#0E150F] text-sm text-[#0E150F] dark:text-slate-100 outline-none focus:border-green-500';
  const Icon = isEmail ? Mail : Phone;

  return (
    <div className="py-3 border-t border-[#E2E8F0] dark:border-[#223027] first:border-t-0">
      <div className="flex items-center gap-3">
        <Icon size={16} className="text-[#64748B] dark:text-slate-400 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-xs text-[#64748B] dark:text-slate-400">{t(isEmail ? 'lk_email' : 'lk_phone')}</p>
          <p className="text-sm font-semibold text-[#0E150F] dark:text-slate-100 truncate">
            {current || <span className="font-normal text-[#94A3B8]">{t('lk_not_linked')}</span>}
          </p>
        </div>
        {!open && (
          <button
            onClick={() => setOpen(true)}
            className="h-9 px-3 rounded-xl border border-green-500 text-green-600 dark:text-green-400 text-xs font-bold hover:bg-green-500/10 whitespace-nowrap"
          >
            {current ? t('lk_change') : t('lk_link')}
          </button>
        )}
        {!open && current && <Check size={16} className="text-green-500 flex-shrink-0" />}
      </div>

      {open && step === 'form' && (
        <form onSubmit={send} className="mt-3 flex flex-col gap-2 max-w-sm">
          <input
            className={input}
            type={isEmail ? 'email' : 'tel'}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={t(isEmail ? 'lk_new_email' : 'lk_new_phone')}
            autoComplete="off"
          />
          <input
            className={input}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={t('lk_password')}
            autoComplete="current-password"
          />
          <p className="text-[11px] text-[#64748B] dark:text-slate-400">{t(isEmail ? 'lk_hint_email' : 'lk_hint_phone')}</p>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={busy || !value.trim() || !password}
              className="h-10 px-4 rounded-xl bg-green-500 text-white text-sm font-bold hover:bg-green-600 disabled:opacity-60 inline-flex items-center gap-2"
            >
              {busy && <Loader2 size={14} className="animate-spin" />} {t('lk_send')}
            </button>
            <button type="button" onClick={reset} className="h-10 px-4 rounded-xl text-sm text-[#64748B] dark:text-slate-400">
              {t('lk_cancel')}
            </button>
          </div>
        </form>
      )}

      {open && step === 'code' && (
        <form onSubmit={confirm} className="mt-3 flex flex-col gap-2 max-w-sm">
          {devCode && (
            <p className="text-xs text-amber-600">
              {t('lk_dev')} <b>{devCode}</b>
            </p>
          )}
          <input
            className={input}
            inputMode="numeric"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, ''))}
            placeholder={t('lk_code')}
            autoComplete="one-time-code"
          />
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={busy || code.length !== 6}
              className="h-10 px-4 rounded-xl bg-green-500 text-white text-sm font-bold hover:bg-green-600 disabled:opacity-60 inline-flex items-center gap-2"
            >
              {busy && <Loader2 size={14} className="animate-spin" />} {t('lk_confirm')}
            </button>
            <button type="button" onClick={reset} className="h-10 px-4 rounded-xl text-sm text-[#64748B] dark:text-slate-400">
              {t('lk_cancel')}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

export default function LinkIdentifiersCard() {
  const { t } = useTranslation();
  return (
    <div className="bg-white dark:bg-[#121B14] rounded-2xl border border-[#E2E8F0] dark:border-[#223027] overflow-hidden">
      <div className="px-5 py-4 flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-green-100 dark:bg-green-500/15 flex items-center justify-center flex-shrink-0">
          <Link2 size={18} className="text-green-700 dark:text-green-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-[#0E150F] dark:text-slate-100">{t('lk_title')}</p>
          <p className="text-xs text-[#64748B] dark:text-slate-400 mt-0.5 mb-2">{t('lk_desc')}</p>
          <LinkRow kind="phone" />
          <LinkRow kind="email" />
        </div>
      </div>
    </div>
  );
}
