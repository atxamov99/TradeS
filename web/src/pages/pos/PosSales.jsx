import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ShoppingCart, TrendingUp, Clock, WifiOff } from 'lucide-react';
import { Link } from 'react-router-dom';
import * as salesApi from '../../api/sales.api';
import useOnlineStatus from '../../hooks/useOnlineStatus';
import { getPendingSales } from '../../services/offlineDB';

function fmt(n) { return Number(n || 0).toFixed(2); }

export default function PosSales() {
  const [tab, setTab] = useState('today');
  const [pendingSales, setPendingSales] = useState([]);
  const { isOnline } = useOnlineStatus();

  const today = new Date().toISOString().slice(0, 10);
  const firstOfMonth = new Date().toISOString().slice(0, 7) + '-01';

  const from = tab === 'today' ? today : firstOfMonth;
  const to = new Date().toISOString().slice(0, 10);

  const { data, isLoading } = useQuery({
    queryKey: ['pos-sales', tab],
    queryFn: () => salesApi.getSales({ from: `${from}T00:00:00`, to: `${to}T23:59:59`, limit: 100 }),
    enabled: isOnline,
  });

  // Load pending (offline) sales
  useEffect(() => {
    getPendingSales().then(setPendingSales).catch(() => {});
  }, []);

  const sales = data?.data?.data?.sales || [];
  const totalRevenue = sales.reduce((s, x) => s + (x.totalRevenue || 0), 0);
  const totalProfit = sales.reduce((s, x) => s + (x.profit || 0), 0);

  return (
    <div className="min-h-screen bg-pos-bg text-pos-text p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Savdolar</h1>
        <Link
          to="/pos/sales/new"
          className="flex items-center gap-2 bg-pos-accent hover:bg-pos-accentHover text-white font-semibold px-4 py-2.5 rounded-xl text-sm transition-colors"
        >
          <ShoppingCart className="h-4 w-4" /> Yangi Savdo
        </Link>
      </div>

      {/* Pending offline sales */}
      {pendingSales.length > 0 && (
        <div className="mb-6 bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3 text-yellow-400 font-semibold text-sm">
            <Clock className="h-4 w-4" />
            {pendingSales.length} ta savdo kutmoqda (offline)
            {!isOnline && (
              <span className="ml-auto flex items-center gap-1 text-xs font-normal">
                <WifiOff className="h-3 w-3" /> Internet yo'q
              </span>
            )}
          </div>
          <div className="space-y-2">
            {pendingSales.map((s) => (
              <div key={s.id} className="flex items-center justify-between p-3 bg-pos-card border border-yellow-500/20 rounded-lg">
                <div>
                  <p className="font-medium text-sm">{s.productName}</p>
                  <p className="text-pos-muted text-xs mt-0.5">
                    {s.quantity} × ${fmt(s.sellPrice)} · {new Date(s.createdAt).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-yellow-400 font-medium text-sm">${fmt(s.sellPrice * s.quantity)}</p>
                  <p className="text-pos-muted text-xs">kutmoqda</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex bg-pos-card border border-pos-border rounded-xl p-1 w-fit mb-6">
        {['today', 'month'].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-6 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${
              tab === t ? 'bg-pos-accent text-white' : 'text-pos-muted hover:text-white'
            }`}
          >
            {t === 'today' ? 'Bugun' : 'Bu oy'}
          </button>
        ))}
      </div>

      {/* Summary */}
      {isOnline && (
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-pos-card border border-pos-border rounded-xl p-4">
            <p className="text-pos-muted text-xs mb-1">Tushum</p>
            <p className="text-yellow-400 text-2xl font-bold">${fmt(totalRevenue)}</p>
          </div>
          <div className="bg-pos-card border border-pos-border rounded-xl p-4">
            <p className="text-pos-muted text-xs mb-1">Foyda</p>
            <p className="text-pos-accent text-2xl font-bold">${fmt(totalProfit)}</p>
          </div>
        </div>
      )}

      {/* Server sales list */}
      {!isOnline ? (
        <div className="text-center py-16 text-pos-muted">
          <WifiOff className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>Server savdolarini ko'rish uchun internet kerak</p>
        </div>
      ) : isLoading ? (
        <div className="space-y-2">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl bg-pos-card" />
          ))}
        </div>
      ) : sales.length === 0 ? (
        <div className="text-center py-20 text-pos-muted">
          <ShoppingCart className="h-14 w-14 mx-auto mb-3 opacity-30" />
          <p>{tab === 'today' ? 'Bugun savdo yo\'q' : 'Bu oy savdo yo\'q'}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {sales.map((s) => (
            <div key={s.id} className="flex items-center justify-between p-4 bg-pos-card border border-pos-border rounded-xl">
              <div>
                <p className="font-medium">{s.productName}</p>
                <p className="text-pos-muted text-xs mt-0.5">
                  {s.quantity} {s.unit} × ${fmt(s.sellPrice)} ·{' '}
                  {new Date(s.createdAt).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
              <div className="text-right">
                <p className="text-yellow-400 font-medium">${fmt(s.totalRevenue)}</p>
                <div className="flex items-center gap-1 justify-end">
                  <TrendingUp className="h-3 w-3 text-pos-accent" />
                  <p className="text-pos-accent text-sm font-bold">${fmt(s.profit)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
