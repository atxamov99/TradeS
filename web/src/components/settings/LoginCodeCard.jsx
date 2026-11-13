import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { AlertTriangle, Loader2, ShieldCheck, ShieldOff } from 'lucide-react';
import useAuthStore from '../../store/authStore';
import { setLoginCode } from '../../api/security.api';
import { resolveErrorMessage } from '../../api/axios';

/**
 * Settings card: Telegram sign-in code on/off.
 * Turning it OFF lowers security, so it goes through an explicit "are you sure?" dialog that spells out the
 * risk and asks for the account password (the server enforces the password as well).
 */
export default function LoginCodeCard() {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const fetchMe = useAuthStore((s) => s.fetchMe);
  const enabled = user?.loginCodeEnabled !== false;
  const [busy, setBusy] = useState(false);
  const [confirmOff, setConfirmOff] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (!confirmOff) return undefined;
    inputRef.current?.focus();
    const onKey = (e) => { if (e.key === 'Escape') setConfirmOff(false); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [confirmOff]);

  const apply = async (next, pwd) => {
    setBusy(true);
    setError('');
    try {
      await setLoginCode(next, pwd);
      await fetchMe();
      toast.success(next ? t('lc_toast_on') : t('lc_toast_off'));
      setConfirmOff(false);
      setPassword('');
    } catch (err) {
      const msg = resolveErrorMessage(err); // translated for known error codes
      if (confirmOff) setError(msg); else toast.error(msg);
    } finally {
      setBusy(false);
    }
  };

  const Icon = enabled ? ShieldCheck : ShieldOff;

  return (
    <>
      <div className="bg-white dark:bg-[#121B14] rounded-2xl border border-[#E2E8F0] dark:border-[#223027] p-5">
        <div className="flex items-start gap-4">
          <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${enabled ? 'bg-green-500/15 text-green-500' : 'bg-amber-500/15 text-amber-500'}`}>
            <Icon size={22} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">{t('lc_title')}</h3>
              <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${enabled ? 'bg-green-500/15 text-green-600 dark:text-green-400' : 'bg-amber-500/15 text-amber-600 dark:text-amber-400'}`}>
                {enabled ? t('lc_status_on') : t('lc_status_off')}
              </span>
            </div>
            <p className="mt-1 text-[13px] leading-relaxed text-slate-500 dark:text-slate-400">{t('lc_desc')}</p>
            <p className="mt-1.5 text-[12px] leading-relaxed text-slate-400">{t('lc_no_telegram_note')}</p>
          </div>
          <button
            type="button"
            disabled={busy}
            onClick={() => (enabled ? setConfirmOff(true) : apply(true))}
            className={`shrink-0 rounded-xl px-3.5 py-2 text-xs font-bold transition-colors disabled:opacity-50 ${enabled ? 'border border-red-500/30 text-red-500 hover:bg-red-500/10' : 'bg-green-500 text-white hover:bg-green-600'}`}
          >
            {busy && !confirmOff ? <Loader2 size={15} className="animate-spin" /> : enabled ? t('lc_turn_off') : t('lc_turn_on')}
          </button>
        </div>
      </div>

      {confirmOff && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" onMouseDown={(e) => { if (e.target === e.currentTarget) setConfirmOff(false); }}>
          <div role="dialog" aria-modal="true" className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-[#223027] dark:bg-[#121B14]">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-red-500/15 text-red-500">
              <AlertTriangle size={24} />
            </div>
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white">{t('lc_warn_title')}</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">{t('lc_warn_text')}</p>
            <p className="mt-1 text-sm font-semibold text-green-600 dark:text-green-400">{t('lc_warn_hint')}</p>

            <label className="mt-4 block text-xs font-bold uppercase tracking-wider text-slate-400">{t('lc_password')}</label>
            <input
              ref={inputRef}
              type="password"
              value={password}
              autoComplete="current-password"
              onChange={(e) => { setPassword(e.target.value); setError(''); }}
              onKeyDown={(e) => { if (e.key === 'Enter' && password) apply(false, password); }}
              className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none focus:border-green-500 dark:border-[#223027] dark:bg-[#0E150F] dark:text-white"
            />
            {error && <p className="mt-1.5 text-xs font-medium text-red-500">{error}</p>}

            <div className="mt-5 flex gap-2">
              <button type="button" onClick={() => { setConfirmOff(false); setPassword(''); setError(''); }}
                className="h-11 flex-1 rounded-xl bg-green-500 text-sm font-bold text-white transition-colors hover:bg-green-600">
                {t('lc_cancel')}
              </button>
              <button type="button" disabled={!password || busy} onClick={() => apply(false, password)}
                className="flex h-11 flex-1 items-center justify-center rounded-xl border border-red-500/40 text-sm font-bold text-red-500 transition-colors hover:bg-red-500/10 disabled:opacity-40">
                {busy ? <Loader2 size={16} className="animate-spin" /> : t('lc_confirm_off')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
