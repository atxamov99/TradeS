import { NavLink, Outlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useEffect, useState, useCallback } from 'react';
import { LayoutDashboard, Package, ShoppingCart, BarChart2, Plus, WifiOff, Wifi, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import useOnlineStatus from '../../hooks/useOnlineStatus';
import { fullSync } from '../../services/webSyncService';
import { pullAndCacheProducts } from '../../services/webSyncService';
import { getPendingSales } from '../../services/offlineDB';

const nav = [
  { to: '/pos', icon: LayoutDashboard, label: 'pos_nav_dashboard', end: true },
  { to: '/pos/products', icon: Package, label: 'pos_nav_products' },
  { to: '/pos/sales', icon: ShoppingCart, label: 'pos_nav_sales' },
  { to: '/pos/reports', icon: BarChart2, label: 'pos_nav_reports' },
];

export default function PosLayout() {
  const { t } = useTranslation();
  const { isOnline } = useOnlineStatus();
  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);

  // Refresh pending count
  const refreshPending = useCallback(async () => {
    const pending = await getPendingSales();
    setPendingCount(pending.length);
  }, []);

  // Initial load: cache products and count pending
  useEffect(() => {
    refreshPending();
    if (navigator.onLine) {
      pullAndCacheProducts().catch(() => {});
    }
  }, []);

  // Auto-sync when coming back online
  useEffect(() => {
    if (!isOnline) return;

    const runSync = async () => {
      const pending = await getPendingSales();
      if (pending.length === 0) return;

      setIsSyncing(true);
      try {
        const { synced, failed } = await fullSync();
        if (synced > 0) {
          toast.success(t('pos_synced_server', { count: synced }), {
            icon: '✅',
            style: { background: '#121B14', color: '#fff', border: '1px solid #22C55E' },
          });
        }
        if (failed > 0) {
          toast.error(t('pos_sync_failed', { count: failed }));
        }
        await refreshPending();
      } finally {
        setIsSyncing(false);
      }
    };

    runSync();
  }, [isOnline]);

  const handleManualSync = async () => {
    if (!isOnline || isSyncing) return;
    setIsSyncing(true);
    try {
      const { synced, failed } = await fullSync();
      if (synced > 0) {
        toast.success(t('pos_synced_server', { count: synced }));
      } else if (failed === 0) {
        toast.success(t('pos_all_synced'));
      }
      if (failed > 0) toast.error(t('pos_sync_failed', { count: failed }));
      await refreshPending();
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="flex h-screen bg-pos-bg overflow-hidden">
      {/* Offline banner */}
      {!isOnline && (
        <div className="fixed top-0 inset-x-0 z-50 flex items-center justify-center gap-2 bg-yellow-500/90 text-black text-sm font-semibold py-1.5">
          <WifiOff className="h-4 w-4" />
          {t('pos_offline_banner')}
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-56 flex-col border-r border-pos-border bg-pos-card">
        <div className="px-5 py-5 border-b border-pos-border">
          <div className="flex items-center justify-between">
            <span className="text-xl font-black text-pos-accent tracking-tight">TradeS</span>
            {/* Online/Offline dot */}
            <span
              className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${
                isOnline
                  ? 'bg-green-500/20 text-green-400'
                  : 'bg-yellow-500/20 text-yellow-400'
              }`}
            >
              {isOnline ? (
                <><Wifi className="h-3 w-3" /> {t('pos_online')}</>
              ) : (
                <><WifiOff className="h-3 w-3" /> {t('pos_offline')}</>
              )}
            </span>
          </div>
          <p className="text-pos-muted text-xs mt-0.5">{t('pos_tagline')}</p>
        </div>

        <nav className="flex-1 p-3 space-y-0.5">
          {nav.map(({ to, icon: Icon, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-pos-accent/20 text-pos-accent'
                    : 'text-pos-muted hover:bg-pos-border hover:text-white'
                }`
              }
            >
              <Icon className="h-5 w-5 flex-shrink-0" />
              {t(label)}
              {to === '/pos/sales' && pendingCount > 0 && (
                <span className="ml-auto bg-yellow-500 text-black text-xs font-bold px-1.5 py-0.5 rounded-full">
                  {pendingCount}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="p-3 border-t border-pos-border space-y-2">
          {/* Sync button — only visible when pending */}
          {pendingCount > 0 && (
            <button
              onClick={handleManualSync}
              disabled={!isOnline || isSyncing}
              className="flex items-center gap-2 w-full border border-yellow-500/50 text-yellow-400 hover:bg-yellow-500/10 disabled:opacity-50 font-medium px-3 py-2 rounded-xl text-sm transition-colors"
            >
              <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
              {isSyncing ? t('emp_loading') : t('pos_upload_n', { count: pendingCount })}
            </button>
          )}

          <NavLink
            to="/pos/sales/new"
            className="flex items-center gap-2 w-full bg-pos-accent hover:bg-pos-accentHover text-white font-semibold px-3 py-2.5 rounded-xl text-sm transition-colors"
          >
            <Plus className="h-4 w-4" /> {t('ns_title')}
          </NavLink>
        </div>
      </aside>

      {/* Content */}
      <div className={`flex-1 overflow-y-auto ${!isOnline ? 'mt-8' : ''}`}>
        <Outlet context={{ refreshPending }} />
      </div>

      {/* Mobile bottom nav */}
      <div className="md:hidden fixed bottom-0 inset-x-0 bg-pos-card border-t border-pos-border flex">
        {nav.map(({ to, icon: Icon, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center gap-0.5 py-3 text-xs font-medium transition-colors relative ${
                isActive ? 'text-pos-accent' : 'text-pos-muted'
              }`
            }
          >
            <Icon className="h-5 w-5" />
            {t(label)}
            {to === '/pos/sales' && pendingCount > 0 && (
              <span className="absolute top-1.5 right-2 bg-yellow-500 text-black text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                {pendingCount}
              </span>
            )}
          </NavLink>
        ))}
        <NavLink to="/pos/sales/new" className="flex-1 flex flex-col items-center gap-0.5 py-3 text-xs font-medium text-pos-accent">
          <Plus className="h-5 w-5" /> {t('pos_sale_short')}
        </NavLink>
      </div>
    </div>
  );
}
