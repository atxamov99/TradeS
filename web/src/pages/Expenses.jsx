import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { Plus, Trash2, Loader2 } from 'lucide-react';
import useAuthStore from '../store/authStore';
import * as shopApi from '../api/shop.api';
import formatPrice from '../utils/formatPrice';

const CATS = ['rent', 'salary', 'supplies', 'utilities', 'other'];

// Business director only (the server enforces OWNER as well).
export default function Expenses() {
  const { t } = useTranslation();
  const shop = useAuthStore((s) => s.businessShop());
  const shopId = shop?.id;
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ amount: '', category: 'other', note: '' });
  const [busy, setBusy] = useState(false);

  const load = async () => {
    if (!shopId) return;
    try {
      const res = await shopApi.getExpenses(shopId);
      setItems(res.data?.data?.expenses || []);
      setTotal(res.data?.data?.total || 0);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error');
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shopId]);

  const add = async (e) => {
    e.preventDefault();
    const amount = Number(form.amount);
    if (!(amount > 0)) return;
    setBusy(true);
    try {
      await shopApi.addExpense(shopId, { amount, category: form.category, note: form.note.trim() });
      toast.success(t('exp_added'));
      setForm({ amount: '', category: 'other', note: '' });
      await load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error');
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id) => {
    try {
      await shopApi.deleteExpense(shopId, id);
      toast.success(t('exp_deleted'));
      await load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error');
    }
  };

  const field =
    'h-11 px-3 rounded-xl border border-[#E2E8F0] dark:border-[#223027] bg-white dark:bg-[#0E150F] text-sm text-[#0E150F] dark:text-slate-100 outline-none focus:border-green-500';
  return (
    <div className="p-4 md:p-8 w-full min-w-0 max-w-3xl mx-auto flex flex-col gap-5">
      <div className="flex items-end justify-between">
        <h1 className="text-2xl font-extrabold text-[#0E150F] dark:text-slate-100">{t('exp_title')}</h1>
        <div className="text-right">
          <p className="text-[11px] uppercase tracking-wide text-slate-400 font-semibold">{t('exp_total')}</p>
          <p className="text-lg font-extrabold text-green-600">{formatPrice(total)}</p>
        </div>
      </div>

      <form
        onSubmit={add}
        className="bg-white dark:bg-[#121B14] rounded-2xl border border-[#E2E8F0] dark:border-[#223027] p-4 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,2fr)_auto] gap-2"
      >
        <input className={field} type="number" min="0" step="any" placeholder={t('exp_amount')} value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
        <select className={field} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
          {CATS.map((c) => (
            <option key={c} value={c}>
              {t(`exp_cat_${c}`)}
            </option>
          ))}
        </select>
        <input className={`${field} sm:col-span-2 xl:col-span-1`} maxLength={500} placeholder={t('exp_note')} value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
        <button
          disabled={busy || !(Number(form.amount) > 0)}
          className="h-11 px-4 whitespace-nowrap rounded-xl bg-green-500 text-white text-sm font-bold hover:bg-green-600 disabled:opacity-60 inline-flex items-center justify-center gap-2 sm:col-span-2 xl:col-span-1"
        >
          {busy ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />}
          {t('exp_add')}
        </button>
      </form>

      <div className="bg-white dark:bg-[#121B14] rounded-2xl border border-[#E2E8F0] dark:border-[#223027] divide-y divide-[#E2E8F0] dark:divide-[#223027]">
        {loading ? (
          <div className="p-6 text-center text-sm text-slate-400">…</div>
        ) : items.length === 0 ? (
          <div className="p-6 text-center text-sm text-slate-400">{t('exp_empty')}</div>
        ) : (
          items.map((x) => (
            <div key={x.id} className="flex items-center gap-3 px-4 py-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-[#0E150F] dark:text-slate-100">
                  {formatPrice(x.amount)} · {CATS.includes(x.category) ? t(`exp_cat_${x.category}`) : x.category}
                </p>
                <p className="text-xs text-slate-400 truncate">
                  {new Date(x.createdAt).toLocaleDateString()} {x.note ? `· ${x.note}` : ''}
                </p>
              </div>
              <button onClick={() => remove(x.id)} title={t('exp_delete')} className="p-2 text-slate-400 hover:text-red-500">
                <Trash2 size={16} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
