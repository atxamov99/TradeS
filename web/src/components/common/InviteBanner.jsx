import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MailPlus, Check, X } from 'lucide-react';
import toast from 'react-hot-toast';
import * as shopApi from '../../api/shop.api';
import useAuthStore from '../../store/authStore';

// Shows "you were invited to a shop" with Accept / Decline. Nobody becomes an
// employee until they press Accept here (or in the app).
export default function InviteBanner() {
  const { t } = useTranslation();
  const fetchMe = useAuthStore((s) => s.fetchMe);
  const [invites, setInvites] = useState([]);
  const [busy, setBusy] = useState(null);

  async function load() {
    try {
      const res = await shopApi.getMyInvites();
      setInvites(res.data?.data?.invites || []);
    } catch {
      setInvites([]);
    }
  }

  useEffect(() => { load(); }, []);

  async function answer(id, accept) {
    setBusy(id);
    try {
      if (accept) await shopApi.acceptInvite(id); else await shopApi.declineInvite(id);
      toast.success(t(accept ? 'inv_accepted' : 'inv_declined'));
      if (accept) await fetchMe(); // new role -> new menu
      await load();
    } catch (err) {
      toast.error(err.response?.data?.message || t('inv_error'));
      await load();
    } finally {
      setBusy(null);
    }
  }

  if (!invites.length) return null;

  return (
    <div className="px-4 pt-4 space-y-2">
      {invites.map((inv) => (
        <div key={inv.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-4">
          <MailPlus className="shrink-0 text-emerald-400" size={22} />
          <div className="flex-1 min-w-[200px]">
            <p className="text-sm font-semibold text-gray-900 dark:text-white">
              {t('inv_text', { shop: inv.shop?.name })}
            </p>
            <p className="text-xs text-gray-500 dark:text-slate-400">
              {t('inv_from', { name: inv.invitedBy?.name || '—' })} · {t(`emp_role_${inv.role}`, inv.role)}
            </p>
          </div>
          <button
            onClick={() => answer(inv.id, true)}
            disabled={busy === inv.id}
            className="h-9 px-4 rounded-lg bg-emerald-500 text-slate-950 font-bold text-sm flex items-center gap-1.5 disabled:opacity-50"
          >
            <Check size={16} /> {t('inv_accept')}
          </button>
          <button
            onClick={() => answer(inv.id, false)}
            disabled={busy === inv.id}
            className="h-9 px-4 rounded-lg border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-slate-300 text-sm flex items-center gap-1.5 disabled:opacity-50"
          >
            <X size={16} /> {t('inv_decline')}
          </button>
        </div>
      ))}
    </div>
  );
}
