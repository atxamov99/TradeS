import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, TrendingUp, DollarSign, AlertTriangle, PlusCircle, LogOut, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import * as reportsApi from '../api/reports.api';
import * as salesApi from '../api/sales.api';
import useAuthStore from '../store/authStore';

export default function Dashboard() {
  const { t, i18n } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();

  function fmt(n) {
    return Number(n || 0).toLocaleString(i18n.language.startsWith('uz') ? 'uz-UZ' : i18n.language.startsWith('ru') ? 'ru-RU' : 'en-US') + " " + t('currency');
  }

  function StatCard({ label, value, icon: Icon, color }) {
    const colorMap = {
      blue: 'bg-blue-50 text-blue-600',
      green: 'bg-green-50 text-green-600',
      amber: 'bg-amber-50 text-amber-600',
    };
    return (
      <div className="bg-white rounded-2xl border border-[#E2E8F0] p-5 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-[#64748B]">{label}</span>
          <div className={`p-2 rounded-xl ${colorMap[color] || colorMap.green}`}>
            <Icon size={18} />
          </div>
        </div>
        <p className="text-2xl font-extrabold text-[#0F172A] leading-tight">{value}</p>
      </div>
    );
  }

  function SkeletonCard() {
    return (
      <div className="bg-white rounded-2xl border border-[#E2E8F0] p-5 flex flex-col gap-3 animate-pulse">
        <div className="flex justify-between">
          <div className="h-4 w-28 bg-slate-200 rounded" />
          <div className="h-8 w-8 bg-slate-200 rounded-xl" />
        </div>
        <div className="h-8 w-36 bg-slate-200 rounded" />
      </div>
    );
  }

  const { data: summaryData, isLoading: summaryLoading, isError: summaryError, refetch: refetchSummary } = useQuery({
    queryKey: ['reports-summary'],
    queryFn: reportsApi.getSummary,
    refetchInterval: 30000,
  });

  const todayStr = new Date().toISOString().split('T')[0];
  const { data: salesData, isLoading: salesLoading, isError: salesError, refetch: refetchSales } = useQuery({
    queryKey: ['sales-today', todayStr],
    queryFn: () => salesApi.getSales({ date: todayStr }),
    refetchInterval: 30000,
  });

  const summary = summaryData?.data?.data || {};
  const todayStats = summary.today || {};
  const lowStock = summary.lowStock || [];

  const allSales = salesData?.data?.data?.sales || [];
  const recentSales = Array.isArray(allSales) ? allSales.slice(0, 5) : [];

  const locale = i18n.language.startsWith('uz') ? 'uz-UZ' : i18n.language.startsWith('ru') ? 'ru-RU' : 'en-US';
  const todayDate = new Date().toLocaleDateString(locale, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Header */}
      <header className="bg-white border-b border-[#E2E8F0] px-5 py-4 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <span className="text-xl font-extrabold text-green-500">TradeS</span>
          <span className="hidden sm:block text-sm text-[#64748B]">{todayDate}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-[#0F172A]">{user?.name}</span>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-sm text-red-500 hover:text-red-600 font-medium transition px-2 py-1 rounded-lg hover:bg-red-50"
          >
            <LogOut size={16} />
            <span className="hidden sm:inline">{t('logout')}</span>
          </button>
        </div>
      </header>

      <div className="px-4 sm:px-6 py-6 max-w-3xl mx-auto flex flex-col gap-6">
        {/* Today's date mobile */}
        <p className="sm:hidden text-sm text-[#64748B] capitalize">{todayDate}</p>

        {/* Stats row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {summaryLoading ? (
            [1, 2, 3].map((i) => <SkeletonCard key={i} />)
          ) : summaryError ? (
            <div className="col-span-3 bg-white rounded-2xl border border-red-100 p-5 flex flex-col items-center gap-2 text-center">
              <AlertCircle size={28} className="text-red-400" />
              <p className="text-sm font-semibold text-red-500">{t('error_loading')}</p>
              <button onClick={() => refetchSummary()} className="text-sm text-green-600 font-semibold hover:underline">{t('retry')}</button>
            </div>
          ) : (
            <>
              <StatCard label={t('today_sales')} value={todayStats.salesCount ?? 0} icon={ShoppingCart} color="blue" />
              <StatCard label={t('today_revenue')} value={fmt(todayStats.totalRevenue)} icon={DollarSign} color="amber" />
              <StatCard label={t('today_profit')} value={fmt(todayStats.totalProfit)} icon={TrendingUp} color="green" />
            </>
          )}
        </div>

        {/* Big action button */}
        <Link
          to="/sales"
          className="flex items-center justify-center gap-3 w-full bg-green-500 hover:bg-green-600 active:bg-green-700 text-white text-xl font-bold rounded-2xl transition-all shadow-md"
          style={{ minHeight: '68px' }}
        >
          <PlusCircle size={26} />
          {t('new_sale')}
        </Link>

        {/* Low stock warning */}
        {!summaryLoading && lowStock.length > 0 && (
          <div className="bg-white rounded-2xl border border-[#E2E8F0] overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-4 border-b border-[#E2E8F0] bg-red-50">
              <AlertTriangle size={18} className="text-red-500" />
              <h3 className="font-bold text-[#0F172A]">{t('low_stock')}</h3>
            </div>
            <div className="divide-y divide-[#E2E8F0]">
              {lowStock.map((p) => (
                <div key={p._id} className="flex items-center justify-between px-5 py-3">
                  <span className="text-sm font-medium text-[#0F172A]">{p.name}</span>
                  <span className={`text-sm font-bold px-2.5 py-1 rounded-lg ${p.stock === 0
                      ? 'bg-red-100 text-red-600'
                      : 'bg-amber-100 text-amber-700'
                    }`}>
                    {p.stock} {t(`unit_${p.unit || 'pcs'}`)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent sales */}
        <div className="bg-white rounded-2xl border border-[#E2E8F0] overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#E2E8F0]">
            <h3 className="font-bold text-[#0F172A]">{t('recent_sales')}</h3>
            <Link to="/sales" className="text-sm text-green-600 font-semibold hover:underline">
              {t('view_all')}
            </Link>
          </div>

          {salesLoading ? (
            <div className="divide-y divide-[#E2E8F0]">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center justify-between px-5 py-4 animate-pulse">
                  <div className="flex flex-col gap-2">
                    <div className="h-4 w-32 bg-slate-200 rounded" />
                    <div className="h-3 w-20 bg-slate-100 rounded" />
                  </div>
                  <div className="h-5 w-20 bg-slate-200 rounded" />
                </div>
              ))}
            </div>
          ) : salesError ? (
            <div className="px-5 py-10 text-center">
              <AlertCircle size={32} className="mx-auto mb-2 text-red-400" />
              <p className="text-sm font-semibold text-red-500">{t('error_loading')}</p>
              <button onClick={() => refetchSales()} className="mt-2 text-sm text-green-600 font-semibold hover:underline">{t('retry')}</button>
            </div>
          ) : recentSales.length === 0 ? (
            <div className="px-5 py-10 text-center text-[#64748B]">
              <ShoppingCart size={32} className="mx-auto mb-2 opacity-40" />
              <p className="text-sm">{t('no_sales_today')}</p>
            </div>
          ) : (
            <div className="divide-y divide-[#E2E8F0]">
              {recentSales.map((sale) => {
                const timeStr = new Date(sale.createdAt).toLocaleTimeString(locale, {
                  hour: '2-digit',
                  minute: '2-digit',
                });
                return (
                  <div key={sale._id} className="flex items-center justify-between px-5 py-4">
                    <div>
                      <p className="text-sm font-semibold text-[#0F172A]">
                        {sale.productName || 'Mahsulot'}
                      </p>
                      <p className="text-xs text-[#64748B] mt-0.5">
                        {sale.quantity} {t(`unit_${sale.unit || 'pcs'}`)} · {timeStr}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-green-600">
                        +{Number(sale.profit || 0).toLocaleString(locale)} {t('currency')}
                      </p>
                      <p className="text-xs text-[#64748B]">
                        {Number(sale.totalRevenue || 0).toLocaleString(locale)} {t('currency')}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
