import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Store, X, Check, Package } from 'lucide-react';
import toast from 'react-hot-toast';
import useShopStore from '../../store/shopStore';

export default function Shops() {
  const { t } = useTranslation();
  const { shops, max, activeShopId, isLoading, fetchMyShops, createShop, setActiveShop } = useShopStore();
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    fetchMyShops().catch(() => {});
  }, []);

  const atLimit = shops.length >= max;

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0F172A]">
      <div className="bg-white dark:bg-[#1E293B] border-b border-[#E2E8F0] dark:border-[#334155] px-5 py-4 flex items-center justify-between sticky top-0 z-10">
        <h1 className="text-lg font-bold text-[#0F172A] dark:text-slate-100">{t('my_shops_title')}</h1>
        <button
          onClick={() => setModalOpen(true)}
          disabled={atLimit}
          className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white font-bold px-4 py-2.5 rounded-xl transition disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Plus size={18} />
          <span className="hidden sm:inline">{t('create_shop')}</span>
          <span className="sm:hidden">{t('add')}</span>
        </button>
      </div>

      <div className="px-4 sm:px-6 py-5 max-w-3xl mx-auto flex flex-col gap-4">
        {atLimit && (
          <p className="text-sm text-amber-700 bg-amber-50 dark:bg-amber-500/10 dark:text-amber-400 rounded-xl px-4 py-3">
            {t('shop_limit_reached')} ({shops.length}/{max})
          </p>
        )}

        {isLoading && shops.length === 0 ? (
          <div className="flex flex-col gap-3">
            {[1, 2].map((i) => (
              <div key={i} className="bg-white dark:bg-[#1E293B] rounded-2xl border border-[#E2E8F0] dark:border-[#334155] p-4 h-20 animate-pulse" />
            ))}
          </div>
        ) : shops.length === 0 ? (
          <div className="text-center py-16 text-[#64748B] dark:text-slate-400">
            <Store size={40} className="mx-auto mb-3 opacity-40" />
            <p className="font-semibold">{t('no_shops_title')}</p>
            <p className="text-sm mt-1">{t('no_shops_desc')}</p>
            <button
              onClick={() => setModalOpen(true)}
              className="mt-4 inline-flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white font-bold px-5 py-3 rounded-xl transition"
            >
              <Plus size={18} />
              {t('create_shop')}
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {shops.map((shop) => {
              const isActive = shop.id === activeShopId;
              return (
                <button
                  key={shop.id}
                  onClick={() => setActiveShop(shop.id)}
                  className={`bg-white dark:bg-[#1E293B] rounded-2xl border p-4 flex items-center gap-4 text-left transition ${
                    isActive ? 'border-green-500 ring-2 ring-green-500/20' : 'border-[#E2E8F0] dark:border-[#334155] hover:border-green-300'
                  }`}
                >
                  <div className="h-11 w-11 rounded-xl bg-green-50 dark:bg-green-500/15 flex items-center justify-center flex-shrink-0">
                    <Store size={20} className="text-green-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-[#0F172A] dark:text-slate-100 truncate">{shop.name}</p>
                    <p className="text-xs text-[#64748B] dark:text-slate-400 flex items-center gap-1 mt-0.5">
                      <Package size={12} /> {shop._count?.products ?? 0} {t('products_count_suffix')}
                      {shop.isBlocked && <span className="ml-2 text-red-500 font-semibold">Bloklangan</span>}
                    </p>
                  </div>
                  {isActive && (
                    <span className="flex items-center gap-1 text-xs font-bold text-green-600 bg-green-50 dark:bg-green-500/15 px-2.5 py-1 rounded-lg flex-shrink-0">
                      <Check size={13} /> {t('active_shop_label')}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {modalOpen && (
        <CreateShopModal
          t={t}
          onClose={() => setModalOpen(false)}
          onCreate={createShop}
        />
      )}
    </div>
  );
}

function CreateShopModal({ t, onClose, onCreate }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) { setError(t('shop_name_required')); return; }
    setIsSubmitting(true);
    try {
      await onCreate({ name: name.trim(), description: description.trim() });
      toast.success(t('shop_created'));
      onClose();
    } catch (err) {
      // axios interceptor already toasts the error (e.g. SHOP_LIMIT_REACHED)
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
      <div className="bg-white dark:bg-[#1E293B] w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-[#0F172A] dark:text-slate-100">{t('create_shop')}</h2>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-semibold text-[#0F172A] dark:text-slate-100 mb-2">{t('shop_name_label')}</label>
            <input
              type="text"
              value={name}
              onChange={(e) => { setName(e.target.value); if (error) setError(''); }}
              placeholder={t('example_product_name')}
              autoFocus
              className={`w-full h-12 rounded-xl border px-4 text-base text-[#0F172A] dark:text-slate-100 placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition ${error ? 'border-red-400 bg-red-50 dark:bg-red-500/10' : 'border-[#E2E8F0] dark:border-[#334155] bg-white dark:bg-[#0F172A]'}`}
            />
            {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#0F172A] dark:text-slate-100 mb-2">{t('shop_description_label')}</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t('shop_description_ph')}
              rows={3}
              className="w-full rounded-xl border border-[#E2E8F0] dark:border-[#334155] bg-white dark:bg-[#0F172A] px-4 py-3 text-base text-[#0F172A] dark:text-slate-100 placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition resize-none"
            />
          </div>

          <div className="flex gap-3 mt-2">
            <button type="button" onClick={onClose} className="flex-1 h-12 rounded-xl border border-[#E2E8F0] dark:border-[#334155] text-[#64748B] dark:text-slate-400 font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition">
              {t('cancel')}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 h-12 rounded-xl bg-green-500 hover:bg-green-600 text-white font-bold transition flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {isSubmitting ? (
                <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : t('save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
