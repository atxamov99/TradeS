import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, Heart, Sun, Moon, User, LogOut, LayoutDashboard, Menu, X } from 'lucide-react';
import { useState } from 'react';
import useAuthStore from '../../store/authStore';
import useCartStore from '../../store/cartStore';
import useThemeStore from '../../store/themeStore';

export default function Header() {
  const { user, logout, isAdmin } = useAuthStore();
  const itemCount = useCartStore((s) => s.itemCount());
  const { theme, toggleTheme } = useThemeStore();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-40 border-b bg-white/80 backdrop-blur-md dark:bg-gray-900/80">
      <div className="container flex h-16 items-center justify-between">
        {/* Logo */}
        <Link to="/products" className="flex items-center gap-2 text-xl font-bold text-primary-600">
          <img src="/logo.png" alt="TradeS" className="h-9 w-9 rounded-lg bg-white object-contain" />
          Savdo<span className="text-gray-900 dark:text-white">-E</span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
          <Link to="/products" className="text-gray-600 hover:text-primary-600 dark:text-gray-300">
            Products
          </Link>
          {isAdmin() && (
            <Link to="/admin" className="text-gray-600 hover:text-primary-600 dark:text-gray-300">
              Admin
            </Link>
          )}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button onClick={toggleTheme} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
            {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>

          {user && (
            <>
              <Link to="/wishlist" className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
                <Heart className="h-5 w-5" />
              </Link>
              <Link to="/cart" className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
                <ShoppingCart className="h-5 w-5" />
                {itemCount > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary-600 text-[10px] font-bold text-white">
                    {itemCount > 99 ? '99+' : itemCount}
                  </span>
                )}
              </Link>
            </>
          )}

          {user ? (
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 rounded-lg p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <div className="h-7 w-7 rounded-full bg-primary-600 flex items-center justify-center text-white text-xs font-bold">
                  {user.name[0].toUpperCase()}
                </div>
              </button>

              {userMenuOpen && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setUserMenuOpen(false)} />
                  <div className="absolute right-0 top-full mt-1 z-40 w-48 rounded-xl border bg-white p-1 shadow-lg dark:bg-gray-900">
                    <div className="px-3 py-2 text-xs font-medium text-gray-500">{user.email}</div>
                    <hr className="my-1" />
                    <Link
                      to="/profile"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-800"
                    >
                      <User className="h-4 w-4" /> Profile
                    </Link>
                    {isAdmin() && (
                      <Link
                        to="/admin"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-800"
                      >
                        <LayoutDashboard className="h-4 w-4" /> Admin
                      </Link>
                    )}
                    <hr className="my-1" />
                    <button
                      onClick={() => { setUserMenuOpen(false); handleLogout(); }}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                      <LogOut className="h-4 w-4" /> Logout
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="hidden md:flex items-center gap-2">
              <Link to="/login" className="btn-outline btn text-sm px-3 py-1.5">Login</Link>
              <Link to="/register" className="btn-primary btn text-sm px-3 py-1.5">Register</Link>
            </div>
          )}

          {/* Mobile menu toggle */}
          <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t bg-white dark:bg-gray-900 px-4 py-4 space-y-2">
          <Link to="/products" onClick={() => setMobileOpen(false)} className="block py-2 text-sm font-medium">Products</Link>
          {!user && (
            <>
              <Link to="/login" onClick={() => setMobileOpen(false)} className="block py-2 text-sm">Login</Link>
              <Link to="/register" onClick={() => setMobileOpen(false)} className="block py-2 text-sm font-medium text-primary-600">Register</Link>
            </>
          )}
        </div>
      )}
    </header>
  );
}
