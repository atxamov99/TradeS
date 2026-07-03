import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Package, Users, ShoppingBag, LogOut, ChevronRight,
} from 'lucide-react';
import useAuthStore from '../../store/authStore';

const nav = [
  { to: '/admin', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/admin/products', icon: Package, label: 'Products' },
  { to: '/admin/users', icon: Users, label: 'Users' },
  { to: '/admin/orders', icon: ShoppingBag, label: 'Orders' },
];

export default function AdminLayout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-64 border-r bg-white dark:bg-gray-900 flex flex-col">
        <div className="flex items-center gap-2 px-6 py-5 border-b">
          <span className="text-lg font-bold text-primary-600">TradeS</span>
          <span className="text-xs badge bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300">Admin</span>
        </div>

        <nav className="flex-1 p-3 space-y-0.5">
          {nav.map(({ to, icon: Icon, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300'
                    : 'text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-800'
                }`
              }
            >
              <Icon className="h-5 w-5" />
              {label}
              <ChevronRight className="h-3.5 w-3.5 ml-auto" />
            </NavLink>
          ))}
        </nav>

        <div className="p-3 border-t">
          <div className="flex items-center gap-3 rounded-lg px-3 py-2.5 mb-1">
            <div className="h-8 w-8 rounded-full bg-primary-600 flex items-center justify-center text-white text-xs font-bold">
              {user?.name?.[0]?.toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{user?.name}</p>
              <p className="text-xs text-gray-400 truncate">{user?.role}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
          >
            <LogOut className="h-4 w-4" /> Logout
          </button>
        </div>
      </aside>

      {/* Content */}
      <div className="flex-1 overflow-auto bg-gray-50 dark:bg-gray-950">
        <Outlet />
      </div>
    </div>
  );
}
