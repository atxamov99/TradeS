import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { TrendingUp, ShoppingCart, DollarSign, Package, AlertTriangle, ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import * as reportsApi from '../../api/reports.api';
import { Skeleton } from '../../components/ui/Skeleton';

function StatCard({ icon: Icon, label, value, sub, color = 'green', isLoading }) {
  const colors = {
    green: 'text-pos-accent',
    blue:  'text-blue-400',
    yellow: 'text-yellow-400',
    red:   'text-red-400',
  };
  return (
    <div className="rounded-xl border border-pos-border bg-pos-card p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-pos-muted text-sm font-medium">{label}</span>
        <Icon className={`h-5 w-5 ${colors[color]}`} />
      </div>
      {isLoading ? (
        <div className="h-8 w-28 animate-pulse rounded bg-pos-border" />
      ) : (
        <>
          <p className={`text-3xl font-bold ${colors[color]}`}>{value}</p>
          {sub && <p className="text-pos-muted text-xs mt-1">{sub}</p>}
        </>
      )}
    </div>
  );
}

function fmt(n) {
  return Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function PosDashboard() {
  const { t, i18n } = useTranslation();
  const { data, isLoading } = useQuery({
    queryKey: ['pos-summary'],
    queryFn: reportsApi.getSummary,
    refetchInterval: 60000,
  });

  const d = data?.data?.data || {};
  const today = d.today || {};
  const month = d.thisMonth || {};
  const lowStock = d.lowStock || [];

  const todayDate = new Date().toLocaleDateString({ uz: 'uz-UZ', ru: 'ru-RU', en: 'en-US' }[(i18n.language || 'en').slice(0, 2)] || 'en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className="min-h-screen bg-pos-bg text-pos-text p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">{t('pos_nav_dashboard')}</h1>
          <p className="text-pos-muted text-sm mt-0.5">{todayDate}</p>
        </div>
        <Link to="/pos/sales/new" className="flex items-center gap-2 bg-pos-accent hover:bg-pos-accentHover text-white font-semibold px-5 py-2.5 rounded-xl transition-colors">
          <ShoppingCart className="h-4 w-4" /> {t('ns_title')}
        </Link>
      </div>

      {/* Today stats */}
      <div className="mb-2">
        <p className="text-pos-muted text-xs font-medium uppercase tracking-wider mb-3">{t('pos_today')}</p>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard icon={ShoppingCart} label={t('pos_sales')} value={today.salesCount ?? 0} color="blue" isLoading={isLoading} />
          <StatCard icon={DollarSign} label={t('pos_revenue')} value={`$${fmt(today.totalRevenue)}`} color="yellow" isLoading={isLoading} />
          <StatCard icon={TrendingUp} label={t('pos_profit')} value={`$${fmt(today.totalProfit)}`} sub={`${t('pos_cost')}: $${fmt(today.totalCost)}`} color="green" isLoading={isLoading} />
          <StatCard icon={TrendingUp} label={t('pos_avg_profit')} value={`$${fmt(today.avgProfit)}`} color="green" isLoading={isLoading} />
        </div>
      </div>

      {/* This month stats */}
      <div className="mt-6">
        <p className="text-pos-muted text-xs font-medium uppercase tracking-wider mb-3">{t('pos_this_month')}</p>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard icon={ShoppingCart} label={t('pos_sales')} value={month.salesCount ?? 0} color="blue" isLoading={isLoading} />
          <StatCard icon={DollarSign} label={t('pos_revenue')} value={`$${fmt(month.totalRevenue)}`} color="yellow" isLoading={isLoading} />
          <StatCard icon={TrendingUp} label={t('pos_profit')} value={`$${fmt(month.totalProfit)}`} color="green" isLoading={isLoading} />
          <div className="rounded-xl border border-pos-border bg-pos-card p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-pos-muted text-sm font-medium">{t('pos_margin')}</span>
              <TrendingUp className="h-5 w-5 text-pos-accent" />
            </div>
            <p className="text-3xl font-bold text-pos-accent">
              {month.totalRevenue > 0
                ? `${((month.totalProfit / month.totalRevenue) * 100).toFixed(1)}%`
                : '—'}
            </p>
          </div>
        </div>
      </div>

      {/* Low stock warning + quick links */}
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        {/* Low stock */}
        <div className="rounded-xl border border-pos-border bg-pos-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="h-4 w-4 text-yellow-400" />
            <h2 className="font-semibold text-sm">{t('pos_low_stock')}</h2>
          </div>
          {isLoading ? (
            <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-8 animate-pulse rounded bg-pos-border" />)}</div>
          ) : lowStock.length === 0 ? (
            <p className="text-pos-muted text-sm">{t('pos_well_stocked')}</p>
          ) : (
            <div className="space-y-2">
              {lowStock.map((p) => (
                <div key={p.id} className="flex items-center justify-between py-2 border-b border-pos-border last:border-0">
                  <span className="text-sm">{p.name}</span>
                  <span className={`text-sm font-bold ${p.stock === 0 ? 'text-red-400' : 'text-yellow-400'}`}>
                    {p.stock} left
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick actions */}
        <div className="rounded-xl border border-pos-border bg-pos-card p-5">
          <h2 className="font-semibold text-sm mb-4">{t('pos_quick_actions')}</h2>
          <div className="space-y-2">
            {[
              { to: '/pos/sales/new', label: t('pos_record_sale'), icon: ShoppingCart, color: 'bg-pos-accent hover:bg-pos-accentHover' },
              { to: '/pos/products', label: t('pos_manage_products'), icon: Package, color: 'bg-pos-card border border-pos-border hover:border-pos-accent' },
              { to: '/pos/reports', label: t('pos_view_reports'), icon: TrendingUp, color: 'bg-pos-card border border-pos-border hover:border-pos-accent' },
            ].map(({ to, label, icon: Icon, color }) => (
              <Link key={to} to={to} className={`flex items-center justify-between w-full px-4 py-3 rounded-lg transition-colors ${color}`}>
                <div className="flex items-center gap-3">
                  <Icon className="h-4 w-4" />
                  <span className="text-sm font-medium">{label}</span>
                </div>
                <ArrowUpRight className="h-4 w-4 text-pos-muted" />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
