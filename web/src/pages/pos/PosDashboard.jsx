import { useQuery } from '@tanstack/react-query';
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
  const { data, isLoading } = useQuery({
    queryKey: ['pos-summary'],
    queryFn: reportsApi.getSummary,
    refetchInterval: 60000,
  });

  const d = data?.data?.data || {};
  const today = d.today || {};
  const month = d.thisMonth || {};
  const lowStock = d.lowStock || [];

  const todayDate = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className="min-h-screen bg-pos-bg text-pos-text p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-pos-muted text-sm mt-0.5">{todayDate}</p>
        </div>
        <Link to="/pos/sales/new" className="flex items-center gap-2 bg-pos-accent hover:bg-pos-accentHover text-white font-semibold px-5 py-2.5 rounded-xl transition-colors">
          <ShoppingCart className="h-4 w-4" /> New Sale
        </Link>
      </div>

      {/* Today stats */}
      <div className="mb-2">
        <p className="text-pos-muted text-xs font-medium uppercase tracking-wider mb-3">Today</p>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard icon={ShoppingCart} label="Sales" value={today.salesCount ?? 0} color="blue" isLoading={isLoading} />
          <StatCard icon={DollarSign} label="Revenue" value={`$${fmt(today.totalRevenue)}`} color="yellow" isLoading={isLoading} />
          <StatCard icon={TrendingUp} label="Profit" value={`$${fmt(today.totalProfit)}`} sub={`Cost: $${fmt(today.totalCost)}`} color="green" isLoading={isLoading} />
          <StatCard icon={TrendingUp} label="Avg Profit" value={`$${fmt(today.avgProfit)}`} color="green" isLoading={isLoading} />
        </div>
      </div>

      {/* This month stats */}
      <div className="mt-6">
        <p className="text-pos-muted text-xs font-medium uppercase tracking-wider mb-3">This Month</p>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard icon={ShoppingCart} label="Sales" value={month.salesCount ?? 0} color="blue" isLoading={isLoading} />
          <StatCard icon={DollarSign} label="Revenue" value={`$${fmt(month.totalRevenue)}`} color="yellow" isLoading={isLoading} />
          <StatCard icon={TrendingUp} label="Profit" value={`$${fmt(month.totalProfit)}`} color="green" isLoading={isLoading} />
          <div className="rounded-xl border border-pos-border bg-pos-card p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-pos-muted text-sm font-medium">Margin</span>
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
            <h2 className="font-semibold text-sm">Low Stock Alert</h2>
          </div>
          {isLoading ? (
            <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-8 animate-pulse rounded bg-pos-border" />)}</div>
          ) : lowStock.length === 0 ? (
            <p className="text-pos-muted text-sm">All products are well-stocked ✓</p>
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
          <h2 className="font-semibold text-sm mb-4">Quick Actions</h2>
          <div className="space-y-2">
            {[
              { to: '/pos/sales/new', label: 'Record New Sale', icon: ShoppingCart, color: 'bg-pos-accent hover:bg-pos-accentHover' },
              { to: '/pos/products', label: 'Manage Products', icon: Package, color: 'bg-pos-card border border-pos-border hover:border-pos-accent' },
              { to: '/pos/reports', label: 'View Reports', icon: TrendingUp, color: 'bg-pos-card border border-pos-border hover:border-pos-accent' },
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
