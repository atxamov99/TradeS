import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ShieldOff, LogOut, LifeBuoy } from 'lucide-react';
import api from '../../api/axios';
import useBanStore from '../../store/banStore';
import useAuthStore from '../../store/authStore';

const CHECK_EVERY_MS = 20000;

// Watches the signed-in account. While it is blocked by an admin, a full-screen window that cannot be
// dismissed covers the whole site: the only way out is the Log out button. It re-checks every few seconds,
// so an unblock removes the window by itself, and a block is noticed even when the tab just sits open.
export default function AccountGuard() {
  const { t } = useTranslation();
  const banned = useBanStore((s) => s.banned);
  const setBanned = useBanStore((s) => s.setBanned);
  const user = useAuthStore((s) => s.user);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    if (!user) { setBanned(false); return undefined; }
    let stop = false;
    const check = async () => {
      try {
        await api.get('/auth/me'); // 200 = fine (and clears the ban window after an unblock)
        if (!stop && useBanStore.getState().banned) {
          setBanned(false);
          useAuthStore.getState().fetchMe();
        }
      } catch (_) {
        // 403 ACCOUNT_BLOCKED is turned into the ban window by the axios interceptor; other errors are ignored
      }
    };
    check();
    const id = setInterval(check, banned ? 8000 : CHECK_EVERY_MS);
    const onFocus = () => check();
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onFocus);
    return () => {
      stop = true;
      clearInterval(id);
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onFocus);
    };
  }, [user?.id, banned]);

  const leave = async () => {
    setLeaving(true);
    try { await api.post('/auth/logout', {}); } catch (_) { /* a blocked account can still log out; ignore network errors */ }
    try { localStorage.removeItem('savdo-auth'); } catch (_) { /* ignore */ }
    useAuthStore.setState({ user: null, shopMemberships: [] });
    setBanned(false);
    window.location.href = '/login';
  };

  if (!banned) return null;

  return (
    <div
      role="alertdialog"
      aria-modal="true"
      className="fixed inset-0 z-[100000] flex items-center justify-center bg-[#080D09] p-6"
    >
      <div className="w-full max-w-md rounded-2xl border border-red-500/40 bg-[#0E150F] p-8 text-center shadow-2xl">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-red-500/15">
          <ShieldOff size={32} className="text-red-400" />
        </div>
        <h2 className="text-xl font-bold text-white">{t('ban_title')}</h2>
        <p className="mt-3 text-sm leading-relaxed text-slate-400">{t('ban_text')}</p>
        <a
          href="https://t.me/trades_uz_bot?start=support"
          target="_blank"
          rel="noreferrer"
          className="mt-5 inline-flex items-center gap-2 text-sm text-green-400 hover:underline"
        >
          <LifeBuoy size={16} /> {t('ban_support')}
        </a>
        <button
          onClick={leave}
          disabled={leaving}
          className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-red-500 text-sm font-bold text-white hover:bg-red-600 disabled:opacity-60"
        >
          <LogOut size={18} /> {t('ban_logout')}
        </button>
        <p className="mt-3 text-xs text-slate-500">{t('ban_auto')}</p>
      </div>
    </div>
  );
}
