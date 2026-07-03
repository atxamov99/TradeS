import { NavLink, Outlet } from 'react-router-dom';
import { useEffect, useState, useCallback } from 'react';
import { LayoutDashboard, Package, ShoppingCart, BarChart2, Plus, WifiOff, Wifi, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import useOnlineStatus from '../../hooks/useOnlineStatus';
import { fullSync } from '../../services/webSyncService';
import { pullAndCacheProducts } from '../../services/webSyncService';
import { getPendingSales } from '../../services/offlineDB';

const nav = [
  { to: '/pos', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/pos/products', icon: Package, label: 'Products' },
  { to: '/pos/sales', icon: ShoppingCart, label: 'Sales' },
  { to: '/pos/reports', icon: BarChart2, label: 'Reports' },
];

export default function PosLayout() {
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
          toast.success(`${synced} savdo serverga yuklandi`, {
            icon: '✅',
            style: { background: '#1E293B', color: '#fff', border: '1px solid #22C55E' },
          });
        }
        if (failed > 0) {
          toast.error(`${failed} savdo yuklanmadi`);
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
        toast.success(`${synced} savdo yuklandi`);
      } else if (failed === 0) {
        toast.success('Hamma narsa sinxronlashgan');
      }
      if (failed > 0) toast.error(`${failed} ta yuklanmadi`);
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
          Offline rejim — savdolar saqlangan, internet tiklananda yuboriladi
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
                <><Wifi className="h-3 w-3" /> Online</>
              ) : (
                <><WifiOff className="h-3 w-3" /> Offline</>
              )}
            </span>
          </div>
          <p className="text-pos-muted text-xs mt-0.5">Smart Trading</p>
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
              {label}
              {label === 'Sales' && pendingCount > 0 && (
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
              {isSyncing ? 'Yuklanmoqda...' : `${pendingCount} ta yuklash`}
            </button>
          )}

          <NavLink
            to="/pos/sales/new"
            className="flex items-center gap-2 w-full bg-pos-accent hover:bg-pos-accentHover text-white font-semibold px-3 py-2.5 rounded-xl text-sm transition-colors"
          >
            <Plus className="h-4 w-4" /> New Sale
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
            {label}
            {label === 'Sales' && pendingCount > 0 && (
              <span className="absolute top-1.5 right-2 bg-yellow-500 text-black text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                {pendingCount}
              </span>
            )}
          </NavLink>
        ))}
        <NavLink to="/pos/sales/new" className="flex-1 flex flex-col items-center gap-0.5 py-3 text-xs font-medium text-pos-accent">
          <Plus className="h-5 w-5" /> Sale
        </NavLink>
      </div>
    </div>
  );
}
