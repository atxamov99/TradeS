import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { Search, CheckCircle, X, Minus, Plus, WifiOff, Clock } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import * as productsApi from '../../api/products.api';
import * as salesApi from '../../api/sales.api';
import toast from 'react-hot-toast';
import useOnlineStatus from '../../hooks/useOnlineStatus';
import { addPendingSale, getCachedProducts } from '../../services/offlineDB';

function fmt(n) {
  return Number(n || 0).toFixed(2);
}

export default function PosNewSale() {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [qty, setQty] = useState(1);
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [offlineProducts, setOfflineProducts] = useState([]);
  const searchRef = useRef(null);
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { isOnline } = useOnlineStatus();
  const outletCtx = useOutletContext();

  useEffect(() => { searchRef.current?.focus(); }, []);

  // Load cached products for offline use
  useEffect(() => {
    if (!isOnline) {
      getCachedProducts().then(setOfflineProducts).catch(() => setOfflineProducts([]));
    }
  }, [isOnline]);

  // Online: fetch from server
  const { data } = useQuery({
    queryKey: ['pos-products', search],
    queryFn: () => productsApi.getProducts({ search, limit: 20, inStock: 'false', scope: 'shop' }),
    enabled: isOnline && (search.length > 0 || !selected),
  });

  const onlineProducts = data?.data?.data?.products || [];

  // Filter offline products by search
  const filteredOffline = search.length > 0
    ? offlineProducts.filter((p) =>
        p.name?.toLowerCase().includes(search.toLowerCase())
      )
    : offlineProducts;

  const products = isOnline ? onlineProducts : filteredOffline;

  const selectProduct = (p) => {
    setSelected(p);
    setQty(1);
    setSearch('');
  };

  const handleConfirm = async () => {
    if (!selected) return;
    if (qty <= 0) { toast.error(t('ns_qty_positive')); return; }

    const stock = selected.stock ?? selected.quantity ?? Infinity;
    if (qty > stock) { toast.error(t('ns_only_stock', { stock })); return; }

    setIsSubmitting(true);

    const salePayload = {
      product: selected.id,
      productName: selected.name,
      quantity: qty,
      sellPrice: selected.finalPrice || selected.sellPrice || selected.price,
      buyPrice: selected.buyPrice || selected.price * 0.7,
      note,
    };

    try {
      if (isOnline) {
        // Normal online sale
        await salesApi.createSale(salePayload);
        qc.invalidateQueries(['pos-summary']);
        qc.invalidateQueries(['pos-sales']);

        const revenue = salePayload.sellPrice * qty;
        const cost = salePayload.buyPrice * qty;
        toast.success(t('ns_sold_profit', { profit: fmt(revenue - cost) }), {
          icon: '✅',
          style: { background: '#121B14', color: '#fff', border: '1px solid #22C55E' },
        });
      } else {
        // Offline: queue for later sync
        await addPendingSale({
          ...salePayload,
          localId: `local_${Date.now()}_${Math.random().toString(36).slice(2)}`,
        });

        // Notify layout to refresh pending count
        outletCtx?.refreshPending?.();

        toast.success(t('ns_saved_offline'), {
          icon: '🕐',
          style: { background: '#121B14', color: '#fff', border: '1px solid #EAB308' },
          duration: 4000,
        });
      }

      navigate('/pos');
    } catch (_) {
      // error toast handled by axios interceptor
    } finally {
      setIsSubmitting(false);
    }
  };

  const price    = selected ? (selected.finalPrice || selected.sellPrice || selected.price) : 0;
  const buyPrice = selected ? (selected.buyPrice || selected.price * 0.7) : 0;
  const revenue  = price * qty;
  const cost     = buyPrice * qty;
  const profit   = revenue - cost;

  return (
    <div className="min-h-screen bg-pos-bg text-pos-text p-6">
      <div className="max-w-lg mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate('/pos')} className="p-2 rounded-lg hover:bg-pos-card text-pos-muted">
            <X className="h-5 w-5" />
          </button>
          <h1 className="text-xl font-bold">{t('ns_title')}</h1>
          {/* Offline mode badge */}
          {!isOnline && (
            <span className="ml-auto flex items-center gap-1.5 text-xs font-semibold bg-yellow-500/20 text-yellow-400 px-2.5 py-1 rounded-full">
              <WifiOff className="h-3.5 w-3.5" />
              {t('pos_offline')}
            </span>
          )}
        </div>

        {/* Offline info banner */}
        {!isOnline && (
          <div className="flex items-start gap-2 bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-3 mb-4 text-sm text-yellow-300">
            <Clock className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <span>
              {t('pos_offline_note')}
              {offlineProducts.length > 0
                ? t('pos_cached_n', { count: offlineProducts.length })
                : t('pos_no_cache_hint')}
            </span>
          </div>
        )}

        {!selected ? (
          /* Product search */
          <div>
            <div className="relative mb-4">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-pos-muted" />
              <input
                ref={searchRef}
                className="w-full bg-pos-card border border-pos-border rounded-xl pl-11 pr-4 py-3.5 text-white placeholder-pos-muted focus:outline-none focus:border-pos-accent text-base"
                placeholder={t('ns_search_ph')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {products.length > 0 ? (
              <div className="space-y-2">
                {products.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => selectProduct(p)}
                    className="w-full flex items-center justify-between p-4 bg-pos-card border border-pos-border rounded-xl hover:border-pos-accent transition-colors text-left"
                  >
                    <div>
                      <p className="font-medium">{p.name}</p>
                      <p className="text-pos-muted text-xs mt-0.5">
                        {p.category} · Qoldi: {p.stock ?? p.quantity ?? '?'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-pos-accent font-bold">
                        ${fmt(p.finalPrice || p.sellPrice || p.price)}
                      </p>
                      {(p.stock ?? p.quantity ?? 1) === 0 && (
                        <span className="text-red-400 text-xs">{t('ns_out')}</span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            ) : search.length > 0 ? (
              <p className="text-center text-pos-muted py-10">{t('ns_not_found')}</p>
            ) : (
              <p className="text-center text-pos-muted py-10">
                {isOnline
                  ? t('ns_type_search')
                  : offlineProducts.length === 0
                  ? t('ns_no_cache')
                  : t('ns_type_search')}
              </p>
            )}
          </div>
        ) : (
          /* Quantity + confirm */
          <div className="space-y-4">
            {/* Selected product */}
            <div className="bg-pos-card border border-pos-accent rounded-xl p-4 flex items-center justify-between">
              <div>
                <p className="font-semibold text-lg">{selected.name}</p>
                <p className="text-pos-muted text-sm">
                  {selected.category} · {selected.stock ?? selected.quantity ?? '?'} mavjud
                </p>
              </div>
              <button onClick={() => setSelected(null)} className="p-1.5 rounded-lg hover:bg-pos-border text-pos-muted">
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Quantity control */}
            <div className="bg-pos-card border border-pos-border rounded-xl p-4">
              <label className="text-pos-muted text-sm mb-3 block">{t('ns_qty')}</label>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setQty(Math.max(0.5, qty - (qty <= 1 ? 0.5 : 1)))}
                  className="h-12 w-12 rounded-xl bg-pos-border flex items-center justify-center hover:bg-pos-accent/20 transition-colors"
                >
                  <Minus className="h-5 w-5" />
                </button>
                <input
                  type="number"
                  value={qty}
                  onChange={(e) => setQty(Math.max(0.001, Number(e.target.value)))}
                  className="flex-1 text-center text-3xl font-bold bg-transparent border-none outline-none text-white"
                />
                <button
                  onClick={() => setQty(Math.min(selected.stock ?? Infinity, qty + 1))}
                  disabled={qty >= (selected.stock ?? Infinity)}
                  className="h-12 w-12 rounded-xl bg-pos-border flex items-center justify-center hover:bg-pos-accent/20 transition-colors disabled:opacity-40"
                >
                  <Plus className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Profit breakdown */}
            <div className="bg-pos-card border border-pos-border rounded-xl p-4 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-pos-muted">{t('ns_unit_price')}</span>
                <span>${fmt(price)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-pos-muted">{t('pos_revenue')}</span>
                <span className="text-yellow-400 font-medium">${fmt(revenue)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-pos-muted">{t('ns_cost_price')}</span>
                <span className="text-red-400">${fmt(cost)}</span>
              </div>
              <div className="flex justify-between text-base font-bold border-t border-pos-border pt-3">
                <span>{t('pos_profit')}</span>
                <span className={profit >= 0 ? 'text-pos-accent' : 'text-red-400'}>
                  ${fmt(profit)}
                </span>
              </div>
            </div>

            {/* Note */}
            <input
              className="w-full bg-pos-card border border-pos-border rounded-xl px-4 py-3 text-sm text-white placeholder-pos-muted focus:outline-none focus:border-pos-accent"
              placeholder={t('ns_note_ph')}
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />

            {/* Confirm button */}
            <button
              onClick={handleConfirm}
              disabled={isSubmitting || qty <= 0}
              className={`w-full flex items-center justify-center gap-2 ${
                isOnline
                  ? 'bg-pos-accent hover:bg-pos-accentHover'
                  : 'bg-yellow-500 hover:bg-yellow-400'
              } disabled:opacity-50 text-white font-bold text-lg py-4 rounded-xl transition-colors`}
            >
              {isOnline ? (
                <CheckCircle className="h-5 w-5" />
              ) : (
                <Clock className="h-5 w-5" />
              )}
              {isSubmitting
                ? t('ns_saving')
                : isOnline
                ? t('ns_confirm')
                : t('ns_save_offline')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
