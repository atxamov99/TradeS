import { useEffect, useState } from 'react';
import { Outlet, NavLink, Link, useNavigate, useLocation } from 'react-router-dom';
import { Home, Package, ShoppingCart, BarChart2, Settings, User, ShieldCheck, LogOut, Store, ChevronDown, Check, Inbox } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import useAuthStore from '../../store/authStore';
import useShopStore from '../../store/shopStore';
import TestUserBanner from '../common/TestUserBanner';

function ShopSwitcher() {
  const { t } = useTranslation();
  const { shops, activeShopId, setActiveShop } = useShopStore();
  const [open, setOpen] = useState(false);
  const activeShop = shops.find((s) => s.id === activeShopId);

  if (shops.length === 0) {
    return (
      <Link
        to="/dashboard/shops"
        className="mx-4 mb-3 flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold border border-dashed border-green-400 text-green-600 hover:bg-green-50 dark:hover:bg-green-500/10 transition"
      >
        <Store size={16} /> {t('create_shop')}
      </Link>
    );
  }

  return (
    <div className="relative mx-4 mb-3">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold border border-[#E2E8F0] dark:border-[#334155] bg-white dark:bg-[#0F172A] hover:border-green-300 transition"
      >
        <Store size={16} className="text-green-600 flex-shrink-0" />
        <span className="flex-1 min-w-0 text-left truncate text-[#0F172A] dark:text-slate-100">
          {activeShop?.name || t('active_shop_label')}
        </span>
        <ChevronDown size={15} className={`text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute left-0 right-0 top-full mt-1 z-40 rounded-xl border border-[#E2E8F0] dark:border-[#334155] bg-white dark:bg-[#1E293B] shadow-lg py-1 max-h-64 overflow-y-auto">
            {shops.map((shop) => (
              <button
                key={shop.id}
                onClick={() => { setActiveShop(shop.id); setOpen(false); }}
                className="w-full flex items-center justify-between gap-2 px-3 py-2.5 text-left text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition"
              >
                <span className="truncate text-[#0F172A] dark:text-slate-100">{shop.name}</span>
                {shop.id === activeShopId && <Check size={14} className="text-green-600 flex-shrink-0" />}
              </button>
            ))}
            <hr className="my-1 border-[#E2E8F0] dark:border-[#334155]" />
            <Link
              to="/dashboard/shops"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 px-3 py-2.5 text-sm font-semibold text-green-600 hover:bg-green-50 dark:hover:bg-green-500/10 transition"
            >
              <Store size={14} /> {t('shops_nav')}
            </Link>
          </div>
        </>
      )}
    </div>
  );
}

function NavItem({ item, mobile = false }) {
  const Icon = item.icon;

  if (mobile) {
    return (
      <NavLink
        to={item.to}
        end={item.to === '/dashboard'}
        className={({ isActive }) =>
          `flex flex-col items-center gap-0.5 py-2 px-3 rounded-xl transition-all min-w-[52px] ${
            isActive ? 'text-green-600' : 'text-slate-400 hover:text-green-600'
          }`
        }
      >
        {({ isActive }) => (
          <>
            <div className={`p-1.5 rounded-lg transition-colors ${isActive ? 'bg-green-50 dark:bg-green-500/15' : ''}`}>
              <Icon size={21} strokeWidth={isActive ? 2.5 : 2} />
            </div>
            <span className="text-[10px] font-semibold leading-tight">{item.label}</span>
          </>
        )}
      </NavLink>
    );
  }

  return (
    <NavLink
      to={item.to}
      end={item.to === '/dashboard'}
      className={({ isActive }) =>
        `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
          isActive
            ? 'bg-green-500 text-white shadow-sm'
            : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100'
        }`
      }
    >
      <Icon size={18} strokeWidth={2} />
      <span>{item.label}</span>
    </NavLink>
  );
}

export default function AppLayout() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const fetchMyShops = useShopStore((s) => s.fetchMyShops);

  const isAdmin = ['ADMIN', 'SUPER_ADMIN'].includes(user?.role);

  useEffect(() => {
    fetchMyShops().catch(() => {});
  }, []);

  const navItems = [
    { to: '/dashboard', label: t('dashboard'), icon: Home },
    { to: '/dashboard/shops',    label: t('shops_nav'), icon: Store },
    { to: '/dashboard/products', label: t('products'),  icon: Package },
    { to: '/dashboard/sales',    label: t('sales'),     icon: ShoppingCart },
    { to: '/dashboard/orders',   label: t('incoming_orders_nav'), icon: Inbox },
    { to: '/dashboard/reports',  label: t('reports'),   icon: BarChart2 },
    { to: '/dashboard/settings', label: t('settings'),  icon: Settings },
    { to: '/dashboard/profile',  label: t('profile'),   icon: User },
  ];

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0F172A] flex">

      {/* ── Desktop Sidebar ──────────────────────── */}
      <aside className="hidden md:flex flex-col w-[220px] min-h-screen bg-white dark:bg-[#1E293B] border-r border-[#E2E8F0] dark:border-[#334155] fixed left-0 top-0 bottom-0 z-30">
        {/* Logo */}
        <div className="px-5 py-6 border-b border-[#E2E8F0] dark:border-[#334155] flex items-center gap-2.5">
          <img src="/logo.png" alt="TradeS" className="h-10 w-10 rounded-lg object-contain flex-shrink-0 dark:hidden" />
          <img src="/logo-dark.png" alt="TradeS" className="hidden h-10 w-10 rounded-lg object-contain flex-shrink-0 dark:block" />
          <div className="min-w-0">
            <span className="text-2xl font-extrabold text-green-500 tracking-tight">TradeS</span>
            <p className="text-[11px] text-slate-400 font-medium mt-0.5">Business Manager</p>
          </div>
        </div>

        {/* User info */}
        <div className="px-4 py-3 border-b border-[#E2E8F0] dark:border-[#334155] flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-500/15 flex items-center justify-center text-green-700 dark:text-green-400 font-bold text-sm flex-shrink-0">
            {user?.name?.[0]?.toUpperCase() || 'U'}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-slate-700 dark:text-slate-200 truncate">{user?.name}</p>
            <p className="text-[10px] text-slate-400 truncate">{user?.role}</p>
          </div>
        </div>

        {/* Shop switcher */}
        <div className="pt-3">
          <ShopSwitcher />
        </div>

        {/* Nav links */}
        <nav className="flex-1 px-3 py-4 flex flex-col gap-1 overflow-y-auto">
          {navItems.map((item) => (
            <NavItem key={item.to} item={item} />
          ))}

          {/* Admin section */}
          {isAdmin && (
            <>
              <div className="mt-4 mb-1 px-3">
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">{t('role_admin')}</p>
              </div>
              <NavLink
                to="/dashboard/admin"
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                    isActive
                      ? 'bg-indigo-500 text-white shadow-sm'
                      : 'text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-500/10'
                  }`
                }
              >
                <ShieldCheck size={18} strokeWidth={2} />
                <span>{t('admin_panel_nav')}</span>
              </NavLink>
            </>
          )}
        </nav>

        {/* Logout */}
        <div className="px-3 py-3 border-t border-[#E2E8F0] dark:border-[#334155]">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-500 hover:bg-red-50 hover:text-red-500 dark:text-slate-400 dark:hover:bg-red-500/10 dark:hover:text-red-400 transition-all"
          >
            <LogOut size={18} strokeWidth={2} />
            <span>{t('logout')}</span>
          </button>
        </div>
      </aside>

      {/* ── Main content ─────────────────────────── */}
      <main className="flex-1 md:ml-[220px] pb-20 md:pb-0">
        <TestUserBanner key={location.pathname} user={user} />
        <Outlet />
      </main>

      {/* ── Mobile Bottom Tab Bar ────────────────── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-[#1E293B] border-t border-[#E2E8F0] dark:border-[#334155] z-30 flex items-center justify-around px-1 py-1 safe-area-pb">
        {navItems.slice(0, 5).map((item) => (
          <NavItem key={item.to} item={item} mobile />
        ))}
        {isAdmin && (
          <NavLink
            to="/dashboard/admin"
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 py-2 px-3 rounded-xl transition-all min-w-[52px] ${
                isActive ? 'text-indigo-600' : 'text-slate-400 hover:text-indigo-600'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <div className={`p-1.5 rounded-lg transition-colors ${isActive ? 'bg-indigo-50 dark:bg-indigo-500/15' : ''}`}>
                  <ShieldCheck size={21} strokeWidth={isActive ? 2.5 : 2} />
                </div>
                <span className="text-[10px] font-semibold leading-tight">{t('role_admin')}</span>
              </>
            )}
          </NavLink>
        )}
      </nav>

    </div>
  );
}
