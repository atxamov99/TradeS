import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Plus, X, Pencil, Trash2, Package, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import * as productsApi from '../api/products.api';
import useAuthStore from '../store/authStore';

export default function Products() {
  const { t, i18n } = useTranslation();
  const user = useAuthStore((s) => s.user);
  // Mirrors backend rule (product.service.js): owner OR ADMIN/SUPER_ADMIN may edit/delete.
  const canManage = (product) =>
    !!user && (['ADMIN', 'SUPER_ADMIN'].includes(user.role) || product.ownerId === user.id);
  const locale = i18n.language.startsWith('uz') ? 'uz-UZ' : i18n.language.startsWith('ru') ? 'ru-RU' : 'en-US';

  const UNITS = [
    { value: 'pcs', label: t('unit_pcs') },
    { value: 'kg', label: t('unit_kg') },
    { value: 'l', label: t('unit_l') },
    { value: 'box', label: t('unit_box') },
  ];

  function fmt(n) {
    return Number(n || 0).toLocaleString(locale) + " " + t('currency');
  }

  function StockBadge({ stock }) {
    if (stock <= 0) return <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-red-100 text-red-600">{t('out_of_stock')}</span>;
    if (stock <= 10) return <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-100 text-amber-700">{stock} {t('pcs')}</span>;
    return <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-green-100 text-green-700">{stock} {t('pcs')}</span>;
  }

  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(null); // null | 'add' | { product }
  const [deleteTarget, setDeleteTarget] = useState(null);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['products'],
    queryFn: () => productsApi.getProducts(),
  });

  const allProducts = data?.data?.data?.products || [];
  const products = Array.isArray(allProducts)
    ? allProducts.filter((p) =>
      p.name.toLowerCase().includes(search.toLowerCase())
    )
    : [];

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Page header */}
      <div className="bg-white border-b border-[#E2E8F0] px-5 py-4 flex items-center justify-between sticky top-0 z-10">
        <h1 className="text-lg font-bold text-[#0F172A]">{t('products')}</h1>
        <button
          onClick={() => setModal('add')}
          className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white font-bold px-4 py-2.5 rounded-xl transition"
        >
          <Plus size={18} />
          <span className="hidden sm:inline">{t('add_product')}</span>
          <span className="sm:hidden">{t('add')}</span>
        </button>
      </div>

      <div className="px-4 sm:px-6 py-5 max-w-3xl mx-auto flex flex-col gap-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#94A3B8]" size={18} />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('search_products')}
            className="w-full h-12 rounded-xl border border-[#E2E8F0] bg-white pl-11 pr-4 text-base text-[#0F172A] placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[#94A3B8] hover:text-[#64748B]">
              <X size={16} />
            </button>
          )}
        </div>

        {/* Product list */}
        {isError ? (
          <div className="text-center py-16">
            <AlertCircle size={40} className="mx-auto mb-3 text-red-400" />
            <p className="font-semibold text-red-500">{t('error_loading')}</p>
            <button onClick={() => refetch()} className="mt-3 text-sm text-green-600 font-semibold hover:underline">{t('retry')}</button>
          </div>
        ) : isLoading ? (
          <div className="flex flex-col gap-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="bg-white rounded-2xl border border-[#E2E8F0] p-4 animate-pulse flex justify-between">
                <div className="flex flex-col gap-2">
                  <div className="h-4 w-36 bg-slate-200 rounded" />
                  <div className="h-3 w-24 bg-slate-100 rounded" />
                </div>
                <div className="h-8 w-16 bg-slate-200 rounded-lg" />
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-16 text-[#64748B]">
            <Package size={40} className="mx-auto mb-3 opacity-40" />
            <p className="font-semibold">{t('no_products_found')}</p>
            {search && <p className="text-sm mt-1">{t('try_different_search')}</p>}
            {!search && (
              <button
                onClick={() => setModal('add')}
                className="mt-4 inline-flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white font-bold px-5 py-3 rounded-xl transition"
              >
                <Plus size={18} />
                {t('add_first_product')}
              </button>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {products.map((product) => (
              <div key={product.id} className="bg-white rounded-2xl border border-[#E2E8F0] p-4 flex items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-bold text-[#0F172A] truncate">{product.name}</p>
                    <StockBadge stock={product.stock} />
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-sm text-[#64748B]">
                    <span>{t('buy_price')} {Number(product.buyPrice).toLocaleString(locale)} {t('currency')}</span>
                    <span className="text-green-600 font-semibold">{t('sell_price')} {Number(product.sellPrice).toLocaleString(locale)} {t('currency')}</span>
                  </div>
                </div>
                {canManage(product) && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setModal(product)}
                      className="p-2.5 rounded-xl hover:bg-slate-100 text-[#64748B] hover:text-[#0F172A] transition"
                      title={t('edit_product')}
                    >
                      <Pencil size={18} />
                    </button>
                    <button
                      onClick={() => setDeleteTarget(product)}
                      className="p-2.5 rounded-xl hover:bg-red-50 text-[#64748B] hover:text-red-500 transition"
                      title={t('delete')}
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      {modal && (
        <ProductModal
          product={modal === 'add' ? null : modal}
          onClose={() => setModal(null)}
          t={t}
          fmt={fmt}
          UNITS={UNITS}
        />
      )}
      {deleteTarget && (
        <DeleteConfirm
          product={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          t={t}
        />
      )}
    </div>
  );
}

function ProductModal({ product, onClose, t, fmt, UNITS }) {
  const emptyForm = { name: '', buyPrice: '', sellPrice: '', stock: '', unit: 'pcs' };
  const [form, setForm] = useState(
    product
      ? { name: product.name, buyPrice: product.buyPrice, sellPrice: product.sellPrice, stock: product.stock, unit: product.unit || 'pcs' }
      : emptyForm
  );
  const [errors, setErrors] = useState({});
  const qc = useQueryClient();

  const createMutation = useMutation({
    mutationFn: productsApi.createProduct,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['products'] });
      toast.success(t('product_added'));
      onClose();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => productsApi.updateProduct(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['products'] });
      toast.success(t('product_updated'));
      onClose();
    },
  });

  const isLoading = createMutation.isPending || updateMutation.isPending;

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = t('enter_name');
    const bp = Number(form.buyPrice);
    const sp = Number(form.sellPrice);
    const st = Number(form.stock);
    if (!form.buyPrice || isNaN(bp) || bp <= 0) e.buyPrice = t('enter_price');
    if (!form.sellPrice || isNaN(sp) || sp <= 0) e.sellPrice = t('enter_price');
    if (form.stock === '' || isNaN(st) || st < 0) e.stock = t('enter_quantity');
    return e;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    const payload = {
      name: form.name.trim(),
      buyPrice: parseFloat(form.buyPrice),
      sellPrice: parseFloat(form.sellPrice),
      stock: parseInt(form.stock, 10) || 0,
      unit: form.unit,
    };
    if (product) {
      updateMutation.mutate({ id: product.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleChange = (field) => (e) => {
    setForm((p) => ({ ...p, [field]: e.target.value }));
    if (errors[field]) setErrors((p) => ({ ...p, [field]: '' }));
  };

  const inputCls = (field) =>
    `w-full h-12 rounded-xl border px-4 text-base text-[#0F172A] placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition ${errors[field] ? 'border-red-400 bg-red-50' : 'border-[#E2E8F0] bg-white'
    }`;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
      <div
        className="bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl p-6 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-[#0F172A]">
            {product ? t('edit_product') : t('add_new_product')}
          </h2>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 transition">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-semibold text-[#0F172A] mb-2">{t('product_name')}</label>
            <input type="text" value={form.name} onChange={handleChange('name')} placeholder={t('example_product_name')} className={inputCls('name')} />
            {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-[#0F172A] mb-2">{t('buy_price_label')} ({t('currency')})</label>
              <input type="number" value={form.buyPrice} onChange={handleChange('buyPrice')} placeholder="0" min="0" className={inputCls('buyPrice')} />
              {errors.buyPrice && <p className="text-red-500 text-sm mt-1">{errors.buyPrice}</p>}
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#0F172A] mb-2">{t('sell_price_label')} ({t('currency')})</label>
              <input type="number" value={form.sellPrice} onChange={handleChange('sellPrice')} placeholder="0" min="0" className={inputCls('sellPrice')} />
              {errors.sellPrice && <p className="text-red-500 text-sm mt-1">{errors.sellPrice}</p>}
            </div>
          </div>

          {form.buyPrice && form.sellPrice && Number(form.sellPrice) > Number(form.buyPrice) && (
            <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-sm text-green-700">
              {t('profit')} <span className="font-bold">{fmt(Number(form.sellPrice - form.buyPrice))}</span> per {t(`unit_${form.unit}`)}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-[#0F172A] mb-2">{t('quantity')}</label>
              <input type="number" value={form.stock} onChange={handleChange('stock')} placeholder="0" min="0" className={inputCls('stock')} />
              {errors.stock && <p className="text-red-500 text-sm mt-1">{errors.stock}</p>}
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#0F172A] mb-2">{t('unit')}</label>
              <select value={form.unit} onChange={handleChange('unit')} className="w-full h-12 rounded-xl border border-[#E2E8F0] px-4 text-base text-[#0F172A] bg-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition">
                {UNITS.map((u) => <option key={u.value} value={u.value}>{u.label}</option>)}
              </select>
            </div>
          </div>

          <div className="flex gap-3 mt-2">
            <button type="button" onClick={onClose} className="flex-1 h-12 rounded-xl border border-[#E2E8F0] text-[#64748B] font-semibold hover:bg-slate-50 transition">
              {t('cancel')}
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 h-12 rounded-xl bg-green-500 hover:bg-green-600 text-white font-bold transition flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {isLoading ? (
                <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : product ? t('save') : t('add')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function DeleteConfirm({ product, onClose, t }) {
  const qc = useQueryClient();
  const deleteMutation = useMutation({
    mutationFn: () => productsApi.deleteProduct(product.id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['products'] });
      toast.success(t('product_deleted'));
      onClose();
    },
  });

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl p-6 max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-bold text-[#0F172A] mb-2">{t('delete_product')}</h2>
        <p className="text-[#64748B] text-sm mb-6">
          <strong>{product.name}</strong> {t('delete_confirm_msg')}
        </p>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 h-12 rounded-xl border border-[#E2E8F0] text-[#64748B] font-semibold hover:bg-slate-50 transition">
            {t('cancel')}
          </button>
          <button
            onClick={() => deleteMutation.mutate()}
            disabled={deleteMutation.isPending}
            className="flex-1 h-12 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold transition flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {deleteMutation.isPending ? (
              <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : t('delete')}
          </button>
        </div>
      </div>
    </div>
  );
}
