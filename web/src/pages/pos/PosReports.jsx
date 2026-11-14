import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { TrendingUp, DollarSign, ShoppingCart, BarChart2, ChevronLeft, ChevronRight } from 'lucide-react';
import * as reportsApi from '../../api/reports.api';

function fmt(n) { return Number(n || 0).toFixed(2); }

function MiniBar({ value, max, label }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="text-pos-muted w-10 text-right">{label}</span>
      <div className="flex-1 h-6 bg-pos-border rounded-md overflow-hidden">
        <div className="h-full bg-pos-accent rounded-md transition-all" style={{ width: `${pct}%` }} />
      </div>
      <span className="text-pos-accent font-medium w-20 text-right">${fmt(value)}</span>
    </div>
  );
}

export default function PosReports() {
  const { t } = useTranslation();
  const [mode, setMode] = useState('daily');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));

  const { data: daily, isLoading: dailyLoading } = useQuery({
    queryKey: ['daily-report', selectedDate],
    queryFn: () => reportsApi.getDailyReport(selectedDate),
    enabled: mode === 'daily',
  });

  const { data: monthly, isLoading: monthlyLoading } = useQuery({
    queryKey: ['monthly-report', selectedMonth],
    queryFn: () => reportsApi.getMonthlyReport(selectedMonth),
    enabled: mode === 'monthly',
  });

  const report = mode === 'daily' ? daily?.data?.data : monthly?.data?.data;
  const isLoading = mode === 'daily' ? dailyLoading : monthlyLoading;
  const stats = report?.stats || {};
  const topProducts = report?.topProducts || [];
  const chartData = mode === 'daily' ? (report?.hourlySales || []) : (report?.dailySales || []);
  const maxVal = Math.max(...chartData.map((d) => d.revenue || 0), 1);

  const navigate = (dir) => {
    if (mode === 'daily') {
      const d = new Date(selectedDate);
      d.setDate(d.getDate() + dir);
      setSelectedDate(d.toISOString().slice(0, 10));
    } else {
      const [y, m] = selectedMonth.split('-').map(Number);
      const d = new Date(y, m - 1 + dir, 1);
      setSelectedMonth(d.toISOString().slice(0, 7));
    }
  };

  return (
    <div className="min-h-screen bg-pos-bg text-pos-text p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">{t('pos_nav_reports')}</h1>
        <div className="flex bg-pos-card border border-pos-border rounded-xl p-1">
          {['daily', 'monthly'].map((m) => (
            <button key={m} onClick={() => setMode(m)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${mode === m ? 'bg-pos-accent text-white' : 'text-pos-muted hover:text-white'}`}>{m}</button>
          ))}
        </div>
      </div>

      {/* Date navigator */}
      <div className="flex items-center justify-center gap-4 mb-6">
        <button onClick={() => navigate(-1)} className="p-2 rounded-xl bg-pos-card border border-pos-border hover:border-pos-accent transition-colors">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="font-semibold text-lg min-w-[160px] text-center">
          {mode === 'daily' ? new Date(selectedDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : new Date(selectedMonth + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </span>
        <button onClick={() => navigate(1)} className="p-2 rounded-xl bg-pos-card border border-pos-border hover:border-pos-accent transition-colors">
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[1,2,3,4].map(i => <div key={i} className="h-28 animate-pulse rounded-xl bg-pos-card" />)}
        </div>
      ) : (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 mb-6">
            {[
              { icon: ShoppingCart, label: t('pos_sales'), value: stats.salesCount ?? 0, color: 'text-blue-400' },
              { icon: DollarSign, label: t('pos_revenue'), value: `$${fmt(stats.totalRevenue)}`, color: 'text-yellow-400' },
              { icon: TrendingUp, label: t('pos_cost'), value: `$${fmt(stats.totalCost)}`, color: 'text-red-400' },
              { icon: TrendingUp, label: t('pos_profit'), value: `$${fmt(stats.totalProfit)}`, color: 'text-pos-accent' },
            ].map(({ icon: Icon, label, value, color }) => (
              <div key={label} className="bg-pos-card border border-pos-border rounded-xl p-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-pos-muted text-xs">{label}</span>
                  <Icon className={`h-4 w-4 ${color}`} />
                </div>
                <p className={`text-2xl font-bold ${color}`}>{value}</p>
              </div>
            ))}
          </div>

          {/* Chart */}
          {chartData.length > 0 && (
            <div className="bg-pos-card border border-pos-border rounded-xl p-5 mb-6">
              <h2 className="text-sm font-semibold text-pos-muted mb-4 flex items-center gap-2">
                <BarChart2 className="h-4 w-4" />
                {mode === 'daily' ? t('pos_rev_hour') : t('pos_rev_day')}
              </h2>
              <div className="space-y-2">
                {chartData.slice(-10).map((d, i) => (
                  <MiniBar
                    key={i}
                    value={d.revenue}
                    max={maxVal}
                    label={mode === 'daily' ? `${String(d._id).padStart(2, '0')}h` : d._id?.slice(-2)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Top products */}
          {topProducts.length > 0 && (
            <div className="bg-pos-card border border-pos-border rounded-xl p-5">
              <h2 className="text-sm font-semibold text-pos-muted mb-4">{t('pos_top_by_profit')}</h2>
              <div className="space-y-3">
                {topProducts.map((p, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-pos-border last:border-0">
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-pos-border text-pos-muted text-xs flex items-center justify-center font-medium">{i + 1}</span>
                      <div>
                        <p className="text-sm font-medium">{p._id}</p>
                        <p className="text-pos-muted text-xs">{p.salesCount} sales · {p.totalQty?.toFixed(1)} units</p>
                      </div>
                    </div>
                    <span className="text-pos-accent font-bold">${fmt(p.totalProfit)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
