import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Send, Trash2, Phone, Mail, Store, Clock, X } from 'lucide-react';
import toast from 'react-hot-toast';
import * as shopApi from '../api/shop.api';
import useAuthStore from '../store/authStore';

// Owner-facing "invite a cashier to my shop" page. A cashier can't be created out
// of thin air — they must already have a User account (register first). The owner
// looks them up here by phone or email and SENDS AN INVITATION; the person only
// becomes an employee after they accept it (so nobody is added by mistake).
export default function Employees() {
  const { t } = useTranslation();
  const currentUser = useAuthStore((s) => s.user);
  const [loading, setLoading] = useState(true);
  const [ownedShop, setOwnedShop] = useState(null); // the first shop where I'm OWNER
  const [members, setMembers] = useState([]);
  const [invites, setInvites] = useState([]);
  const [identifier, setIdentifier] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function loadShops() {
    setLoading(true);
    try {
      const res = await shopApi.getMyShops();
      const shops = res.data?.data?.shops || res.data?.data || [];
      const owned = (Array.isArray(shops) ? shops : []).find((s) => s.myRole === 'OWNER');
      setOwnedShop(owned || null);
      if (owned) {
        const [membersRes, invitesRes] = await Promise.all([
          shopApi.getShopMembers(owned.id),
          shopApi.getShopInvites(owned.id),
        ]);
        setMembers(membersRes.data?.data?.members || membersRes.data?.data || []);
        setInvites(invitesRes.data?.data?.invites || []);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || t('emp_load_error'));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadShops(); }, []);

  async function handleInvite(e) {
    e.preventDefault();
    const value = identifier.trim();
    if (!value || !ownedShop) return;
    const isPhoneLike = /^[+\d][\d\s]{6,}$/.test(value);
    const payload = isPhoneLike ? { phone: value } : { email: value.toLowerCase() };

    setSubmitting(true);
    try {
      const res = await shopApi.inviteShopMember(ownedShop.id, payload);
      const who = res.data?.data?.invite?.invitedUser;
      toast.success(t('emp_invite_sent', { name: who?.name || value }));
      setIdentifier('');
      await loadShops();
    } catch (err) {
      const status = err.response?.status;
      if (status === 404) {
        toast.error(t('emp_not_registered'));
      } else if (status === 409) {
        toast.error(t('emp_already'));
      } else {
        toast.error(err.response?.data?.message || t('emp_add_error'));
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCancelInvite(inviteId) {
    if (!ownedShop) return;
    try {
      await shopApi.cancelShopInvite(ownedShop.id, inviteId);
      toast.success(t('emp_invite_cancelled'));
      await loadShops();
    } catch (err) {
      toast.error(err.response?.data?.message || t('emp_error'));
    }
  }

  async function handleRemove(userId) {
    if (!ownedShop) return;
    if (!confirm(t('emp_remove_confirm'))) return;
    try {
      await shopApi.removeShopMember(ownedShop.id, userId);
      toast.success(t('emp_removed'));
      await loadShops();
    } catch (err) {
      toast.error(err.response?.data?.message || t('emp_error'));
    }
  }

  if (loading) {
    return <div className="p-6 text-slate-400">{t('emp_loading')}</div>;
  }

  if (!ownedShop) {
    return (
      <div className="p-6 space-y-3">
        <h2 className="text-xl font-bold text-white">{t('employees')}</h2>
        <div className="rounded-xl border border-slate-700 bg-slate-800/40 p-5 text-slate-300 text-sm flex gap-3">
          <Store className="shrink-0 text-slate-500" size={20} />
          <p>
            {t('emp_only_owner')}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-2xl">
      <div>
        <h2 className="text-xl font-bold text-white">{t('employees')} — {ownedShop.name}</h2>
        <p className="text-slate-400 text-sm mt-1">
          {t('emp_add_hint')}
        </p>
      </div>

      <form onSubmit={handleInvite} className="flex gap-2">
        <div className="relative flex-1">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
            {/^[+\d]/.test(identifier.trim()) ? <Phone size={16} /> : <Mail size={16} />}
          </div>
          <input
            type="text"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            placeholder={t('emp_ph')}
            className="w-full h-11 pl-10 pr-3 rounded-lg border border-slate-700 bg-slate-900/50 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
          />
        </div>
        <button
          type="submit"
          disabled={submitting || !identifier.trim()}
          className="h-11 px-4 rounded-lg bg-emerald-500 hover:bg-emerald-500/90 text-slate-950 font-bold text-sm flex items-center gap-2 disabled:opacity-50 whitespace-nowrap"
        >
          <Send size={16} /> {t('emp_invite_btn')}
        </button>
      </form>

      {invites.length > 0 && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 overflow-hidden">
          <div className="px-4 py-3 text-xs uppercase text-amber-400 flex items-center gap-2">
            <Clock size={14} /> {t('emp_pending_title')}
          </div>
          <ul className="divide-y divide-slate-800">
            {invites.map((inv) => (
              <li key={inv.id} className="px-4 py-3 flex items-center gap-3 text-sm">
                <div className="flex-1 min-w-0">
                  <p className="text-white truncate">{inv.invitedUser?.name || '—'}</p>
                  <p className="text-slate-400 text-xs truncate">{inv.invitedUser?.phone || inv.invitedUser?.email || ''}</p>
                </div>
                <span className="text-amber-400 text-xs whitespace-nowrap">{t('emp_waiting')}</span>
                <button
                  onClick={() => handleCancelInvite(inv.id)}
                  className="text-slate-500 hover:text-red-400 transition"
                  title={t('emp_invite_cancel')}
                >
                  <X size={16} />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="rounded-xl border border-slate-700 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-800/60 text-slate-400 text-xs uppercase">
            <tr>
              <th className="text-left px-4 py-3">{t('emp_th_name')}</th>
              <th className="text-left px-4 py-3">{t('emp_th_contact')}</th>
              <th className="text-left px-4 py-3">{t('emp_th_role')}</th>
              <th className="text-right px-4 py-3">{t('emp_th_action')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {members.map((m) => (
              <tr key={m.userId || m.user?.id}>
                <td className="px-4 py-3 text-white">{m.user?.name || '—'}</td>
                <td className="px-4 py-3 text-slate-400">{m.user?.phone || m.user?.email || '—'}</td>
                <td className="px-4 py-3 text-slate-400">{t(`emp_role_${m.role}`, m.role)}</td>
                <td className="px-4 py-3 text-right">
                  {m.role !== 'OWNER' && m.user?.id !== currentUser?.id && (
                    <button
                      onClick={() => handleRemove(m.user?.id || m.userId)}
                      className="text-slate-500 hover:text-red-400 transition"
                      title={t('emp_remove')}
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {members.length === 0 && (
              <tr><td colSpan={4} className="px-4 py-6 text-center text-slate-500">{t('emp_empty')}</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
