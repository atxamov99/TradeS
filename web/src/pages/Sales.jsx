import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ShoppingCart, Plus, X, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import * as salesApi from '../api/sales.api';
import * as productsApi from '../api/products.api';
import Dropdown from '../components/ui/Dropdown';

export default function Sales() {
  const { t, i18n } = useTranslation();
  const locale = i18n.language.startsWith('uz') ? 'uz-UZ' : i18n.language.startsWith('ru') ? 'ru-RU' : 'en-US';

  function fmt(n) {
    return Number(n || 0).toLocaleString(locale) + " " + t('currency');
  }

  function NewSaleModal({ onClose }) {
    const [productId, setProductId] = useState('');
    const [quantity, setQuantity] = useState('1');
    const [bagCount, setBagCount] = useState('1');
    const [extraKg, setExtraKg] = useState('0');
    const [errors, setErrors] = useState({});
    const qc = useQueryClient();

    const { data: productsData } = useQuery({
      queryKey: ['products'],
      queryFn: () => productsApi.getProducts(),
      staleTime: 0,
      refetchOnMount: true,
    });
    const allProducts = productsData?.data?.data?.products || [];
    const inStock = Array.isArray(allProducts) ? allProducts.filter((p) => p.stock > 0) : [];

    const selected = inStock.find((p) => p.id === productId);
    const isBag = selected?.unit === 'box' && selected?.bagWeightKg > 0;
    const bagTotalKg = isBag
      ? Number(bagCount || 0) * selected.bagWeightKg + Number(extraKg || 0)
      : 0;
    const effectiveQty = isBag ? bagTotalKg : Number(quantity || 0);
    const profit = selected
      ? (selected.sellPrice - selected.buyPrice) * effectiveQty
      : 0;
    const total = selected ? selected.sellPrice * effectiveQty : 0;

    const mutation = useMutation({
      mutationFn: salesApi.createSale,
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: ['sales-today'] });
        qc.invalidateQueries({ queryKey: ['reports-summary'] });
        qc.invalidateQueries({ queryKey: ['products'] });
        toast.success(t('sale_added'));
        onClose();
      },
      onError: (err) => {
        if (err.response?.status === 422) {
          const errors = err.response?.data?.errors;
          const msg = (Array.isArray(errors) && errors[0]) || 'Error';
          toast.error(msg);
        }
      },
    });

    const validate = () => {
      const e = {};
      if (!productId) e.product = t('enter_product');
      if (isBag) {
        const bc = Number(bagCount);
        const ek = Number(extraKg);
        if (bagCount === '' || isNaN(bc) || bc < 0) e.quantity = t('bag_count_label');
        else if (extraKg === '' || isNaN(ek) || ek < 0) e.quantity = t('bag_extra_kg_label');
        else if (bagTotalKg <= 0) e.quantity = t('enter_quantity');
        else if (bagTotalKg > selected.stock)
          e.quantity = `${t('only_in_stock')} ${selected.stock} kg ${t('available')}`;
      } else {
        const qty = Number(quantity);
        if (!quantity || isNaN(qty) || qty <= 0) e.quantity = t('enter_quantity');
        else if (selected && qty > selected.stock)
          e.quantity = `${t('only_in_stock')} ${selected.stock} ${t(`unit_${selected.unit || 'pcs'}`)} ${t('available')}`;
      }
      return e;
    };

    const handleSubmit = (e) => {
      e.preventDefault();
      const errs = validate();
      if (Object.keys(errs).length) { setErrors(errs); return; }
      mutation.mutate({
        product: selected.id,
        productName: selected.name,
        quantity: isBag ? bagTotalKg : Number(quantity),
        sellPrice: Number(selected.sellPrice) || 0,
        buyPrice: Number(selected.buyPrice) || 0,
        unit: isBag ? 'kg' : (selected.unit || 'pcs'),
        note: isBag ? `${bagCount} ${t('unit_box')} (${selected.bagWeightKg}kg) + ${extraKg}kg` : undefined,
      });
    };

    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
        <div className="bg-white dark:bg-[#1E293B] w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold text-[#0F172A] dark:text-slate-100">{t('new_sale')}</h2>
            <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition">
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-semibold text-[#0F172A] dark:text-slate-100 mb-2">{t('products')}</label>
              <Dropdown
                value={productId}
                onChange={(val) => {
                  setProductId(val);
                  setQuantity('1');
                  setBagCount('1');
                  setExtraKg('0');
                  setErrors({});
                }}
                placeholder={t('select_product_placeholder')}
                searchPlaceholder={t('search')}
                error={errors.product}
                options={inStock.map((p) => ({
                  value: p.id,
                  label: `${p.name} — ${p.stock} ${p.unit === 'box' ? 'kg' : t(`unit_${p.unit || 'pcs'}`)} ${t('remains')}${p.unit === 'box' && p.bagWeightKg ? ` (${p.bagWeightKg}kg/${t('unit_box')})` : ''}`,
                }))}
              />
            </div>

            {isBag ? (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-[#0F172A] dark:text-slate-100 mb-2">
                    {t('bag_count_label')} ({selected.bagWeightKg}kg)
                  </label>
                  <input
                    type="number"
                    value={bagCount}
                    onChange={(e) => {
                      setBagCount(e.target.value);
                      if (errors.quantity) setErrors((p) => ({ ...p, quantity: '' }));
                    }}
                    placeholder="0"
                    min="0"
                    className={`w-full h-12 rounded-xl border px-4 text-base text-[#0F172A] dark:text-slate-100 placeholder-[#94A3B8] dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition ${errors.quantity ? 'border-red-400 bg-red-50 dark:bg-red-500/10' : 'border-[#E2E8F0] dark:border-[#334155] bg-white dark:bg-[#0F172A]'}`}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#0F172A] dark:text-slate-100 mb-2">
                    {t('bag_extra_kg_label')}
                  </label>
                  <input
                    type="number"
                    value={extraKg}
                    onChange={(e) => {
                      setExtraKg(e.target.value);
                      if (errors.quantity) setErrors((p) => ({ ...p, quantity: '' }));
                    }}
                    placeholder="0"
                    min="0"
                    step="0.1"
                    className={`w-full h-12 rounded-xl border px-4 text-base text-[#0F172A] dark:text-slate-100 placeholder-[#94A3B8] dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition ${errors.quantity ? 'border-red-400 bg-red-50 dark:bg-red-500/10' : 'border-[#E2E8F0] dark:border-[#334155] bg-white dark:bg-[#0F172A]'}`}
                  />
                </div>
                {errors.quantity && <p className="col-span-2 text-red-500 text-sm -mt-2">{errors.quantity}</p>}
                <p className="col-span-2 text-sm text-[#64748B] dark:text-slate-400 -mt-1">
                  {t('bag_total_label')}: <span className="font-semibold text-[#0F172A] dark:text-slate-100">{bagTotalKg} kg</span>
                </p>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-semibold text-[#0F172A] dark:text-slate-100 mb-2">
                  {t('quantity')} {selected ? `(${t(`unit_${selected.unit || 'pcs'}`)})` : ''}
                </label>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => {
                    setQuantity(e.target.value);
                    if (errors.quantity) setErrors((p) => ({ ...p, quantity: '' }));
                  }}
                  placeholder="1"
                  min="1"
                  className={`w-full h-12 rounded-xl border px-4 text-base text-[#0F172A] dark:text-slate-100 placeholder-[#94A3B8] dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition ${errors.quantity ? 'border-red-400 bg-red-50 dark:bg-red-500/10' : 'border-[#E2E8F0] dark:border-[#334155] bg-white dark:bg-[#0F172A]'}`}
                />
                {errors.quantity && <p className="text-red-500 text-sm mt-1">{errors.quantity}</p>}
              </div>
            )}

            {selected && effectiveQty > 0 && (
              <div className="bg-slate-50 dark:bg-slate-800 border border-[#E2E8F0] dark:border-[#334155] rounded-xl px-4 py-3 flex flex-col gap-1.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-[#64748B] dark:text-slate-400">{t('sale_preview_revenue')}</span>
                  <span className="font-semibold text-[#0F172A] dark:text-slate-100">{fmt(total)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#64748B] dark:text-slate-400">{t('sale_preview_profit')}</span>
                  <span className={`font-bold ${profit >= 0 ? 'text-green-600' : 'text-red-500'}`}>{fmt(profit)}</span>
                </div>
              </div>
            )}

            <div className="flex gap-3 mt-1">
              <button type="button" onClick={onClose} className="flex-1 h-12 rounded-xl border border-[#E2E8F0] dark:border-[#334155] text-[#64748B] dark:text-slate-400 font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition">
                {t('cancel')}
              </button>
              <button
                type="submit"
                disabled={mutation.isPending}
                className="flex-1 h-12 rounded-xl bg-green-500 hover:bg-green-600 text-white font-bold transition flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {mutation.isPending ? (
                  <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : t('save')}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  const [showModal, setShowModal] = useState(false);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['sales-today', date],
    queryFn: () => salesApi.getSales({ date }),
    refetchInterval: 30000,
  });

  const allSales = data?.data?.data?.sales || [];
  const sales = Array.isArray(allSales) ? allSales : [];

  const totalRevenue = sales.reduce((s, x) => s + Number(x.totalRevenue || 0), 0);
  const totalProfit = sales.reduce((s, x) => s + Number(x.profit || 0), 0);

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0F172A]">
      <div className="bg-white dark:bg-[#1E293B] border-b border-[#E2E8F0] dark:border-[#334155] px-5 py-4 flex items-center justify-between sticky top-0 z-10">
        <h1 className="text-lg font-bold text-[#0F172A] dark:text-slate-100">{t('sales')}</h1>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white font-bold px-4 py-2.5 rounded-xl transition"
        >
          <Plus size={18} />
          <span className="hidden sm:inline">{t('new_sale')}</span>
          <span className="sm:hidden">{t('add')}</span>
        </button>
      </div>

      <div className="px-4 sm:px-6 py-5 max-w-3xl mx-auto flex flex-col gap-4">
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          max={new Date().toISOString().split('T')[0]}
          className="h-12 rounded-xl border border-[#E2E8F0] dark:border-[#334155] bg-white dark:bg-[#0F172A] px-4 text-base text-[#0F172A] dark:text-slate-100 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition w-full sm:w-auto"
        />

        {!isLoading && sales.length > 0 && (
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white dark:bg-[#1E293B] rounded-2xl border border-[#E2E8F0] dark:border-[#334155] p-4 flex flex-col gap-1">
              <span className="text-xs font-medium text-[#64748B] dark:text-slate-400">{t('total_sales')}</span>
              <p className="text-lg font-extrabold text-[#0F172A] dark:text-slate-100">{fmt(totalRevenue)}</p>
            </div>
            <div className="bg-white dark:bg-[#1E293B] rounded-2xl border border-[#E2E8F0] dark:border-[#334155] p-4 flex flex-col gap-1">
              <span className="text-xs font-medium text-[#64748B] dark:text-slate-400">{t('total_profit')}</span>
              <p className="text-lg font-extrabold text-green-600">{fmt(totalProfit)}</p>
            </div>
          </div>
        )}

        {isError ? (
          <div className="text-center py-16">
            <AlertCircle size={40} className="mx-auto mb-3 text-red-400" />
            <p className="font-semibold text-red-500">{t('error_loading')}</p>
            <button onClick={() => refetch()} className="mt-3 text-sm text-green-600 font-semibold hover:underline">{t('retry')}</button>
          </div>
        ) : isLoading ? (
          <div className="flex flex-col gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white dark:bg-[#1E293B] rounded-2xl border border-[#E2E8F0] dark:border-[#334155] p-4 animate-pulse flex justify-between">
                <div className="flex flex-col gap-2">
                  <div className="h-4 w-36 bg-slate-200 dark:bg-slate-700 rounded" />
                  <div className="h-3 w-24 bg-slate-100 dark:bg-slate-800 rounded" />
                </div>
                <div className="h-5 w-20 bg-slate-200 dark:bg-slate-700 rounded" />
              </div>
            ))}
          </div>
        ) : sales.length === 0 ? (
          <div className="text-center py-16 text-[#64748B] dark:text-slate-400">
            <ShoppingCart size={40} className="mx-auto mb-3 opacity-40" />
            <p className="font-semibold">{t('no_sales_day')}</p>
            <button
              onClick={() => setShowModal(true)}
              className="mt-4 inline-flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white font-bold px-5 py-3 rounded-xl transition"
            >
              <Plus size={18} />
              {t('add_sale')}
            </button>
          </div>
        ) : (
          <div className="bg-white dark:bg-[#1E293B] rounded-2xl border border-[#E2E8F0] dark:border-[#334155] overflow-hidden">
            <div className="divide-y divide-[#E2E8F0] dark:divide-[#334155]">
              {sales.map((sale) => {
                const timeStr = new Date(sale.createdAt).toLocaleTimeString(locale, {
                  hour: '2-digit',
                  minute: '2-digit',
                });
                return (
                  <div key={sale.id} className="flex items-center justify-between px-5 py-4">
                    <div>
                      <p className="text-sm font-semibold text-[#0F172A] dark:text-slate-100">
                        {sale.productName || 'Mahsulot'}
                      </p>
                      <p className="text-xs text-[#64748B] dark:text-slate-400 mt-0.5">
                        {sale.note ? sale.note : `${sale.quantity} ${t(`unit_${sale.unit || 'pcs'}`)}`} · {timeStr}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-green-600">
                        +{Number(sale.profit || 0).toLocaleString(locale)} {t('currency')}
                      </p>
                      <p className="text-xs text-[#64748B] dark:text-slate-400">
                        {Number(sale.totalRevenue || 0).toLocaleString(locale)} {t('currency')}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {showModal && <NewSaleModal onClose={() => setShowModal(false)} />}
    </div>
  );
}
