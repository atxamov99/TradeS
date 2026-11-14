import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { Briefcase, Loader2 } from 'lucide-react';
import useAuthStore from '../../store/authStore';
import { requestBusinessUpgrade, confirmBusinessUpgrade } from '../../api/shop.api';

// Settings card for a SOLO user (owner of a personal shop): code-confirmed upgrade to a business director.
export default function BecomeDirectorCard() {
  const { t } = useTranslation();
  const shop = useAuthStore((s) => s.personalShop());
  const fetchMe = useAuthStore((s) => s.fetchMe);
  const [step, setStep] = useState('idle'); // idle | code
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [devCode, setDevCode] = useState('');
  const [busy, setBusy] = useState(false);

  if (!shop) return null; // not a solo owner (director / cashier / admin)

  const sendCode = async () => {
    setBusy(true);
    try {
      const res = await requestBusinessUpgrade(shop.id);
      setDevCode(res.data?.data?.devCode || '');
      setStep('code');
      toast.success(t('bd_sent'));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error');
    } finally {
      setBusy(false);
    }
  };

  const confirm = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await confirmBusinessUpgrade(shop.id, { code: code.trim(), ...(name.trim() ? { name: name.trim() } : {}) });
      await fetchMe();
      toast.success(t('bd_done'));
      setStep('idle');
      setCode('');
      setName('');
    } catch (err) {
      const c = err.response?.data?.code;
      toast.error(c === 'WRONG_CODE' || c === 'CODE_EXPIRED' ? t('bd_wrong') : err.response?.data?.message || 'Error');
    } finally {
      setBusy(false);
    }
  };

  const input =
    'w-full h-11 px-3 rounded-xl border border-[#E2E8F0] dark:border-[#223027] bg-white dark:bg-[#0E150F] text-sm text-[#0E150F] dark:text-slate-100 outline-none focus:border-green-500';
  return (
    <div className="bg-white dark:bg-[#121B14] rounded-2xl border border-[#E2E8F0] dark:border-[#223027] overflow-hidden">
      <div className="px-5 py-4 flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-green-100 dark:bg-green-500/15 flex items-center justify-center flex-shrink-0">
          <Briefcase size={18} className="text-green-700 dark:text-green-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-[#0E150F] dark:text-slate-100">{t('bd_title')}</p>
          <p className="text-xs text-[#64748B] dark:text-slate-400 mt-0.5">{t('bd_desc')}</p>
          {step === 'idle' ? (
            <button
              onClick={sendCode}
              disabled={busy}
              className="mt-3 h-10 px-4 rounded-xl bg-green-500 text-white text-sm font-bold hover:bg-green-600 disabled:opacity-60 inline-flex items-center gap-2"
            >
              {busy && <Loader2 size={14} className="animate-spin" />}
              {t('bd_request')}
            </button>
          ) : (
            <form onSubmit={confirm} className="mt-3 flex flex-col gap-2 max-w-sm">
              {devCode && (
                <p className="text-xs text-amber-600">
                  {t('bd_dev')} <b>{devCode}</b>
                </p>
              )}
              <input
                className={input}
                inputMode="numeric"
                maxLength={6}
                placeholder={t('bd_code')}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              />
              <input className={input} placeholder={t('bd_shop_name')} value={name} onChange={(e) => setName(e.target.value)} />
              <button
                disabled={busy || code.length !== 6}
                className="h-10 rounded-xl bg-green-500 text-white text-sm font-bold hover:bg-green-600 disabled:opacity-60 inline-flex items-center justify-center gap-2"
              >
                {busy && <Loader2 size={14} className="animate-spin" />}
                {t('bd_confirm')}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
