import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BarChart2, TrendingUp, DollarSign, ShoppingCart, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import * as reportsApi from '../api/reports.api';
import * as salesApi from '../api/sales.api';

export default function Reports() {
  const { t, i18n } = useTranslation();
  const locale = i18n.language.startsWith('uz') ? 'uz-UZ' : i18n.language.startsWith('ru') ? 'ru-RU' : 'en-US';

  function fmt(n) {
    return Number(n || 0).toLocaleString(locale) + " " + t('currency');
  }

  function StatCard({ label, value, icon: Icon, color }) {
    const colorMap = {
      blue: 'bg-blue-50 text-blue-600',
      green: 'bg-green-50 text-green-600',
      amber: 'bg-amber-50 text-amber-600',
    };
    return (
      <div className="bg-white rounded-2xl border border-[#E2E8F0] p-4 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-[#64748B]">{label}</span>
          <div className={`p-2 rounded-xl ${colorMap[color] || colorMap.green}`}>
            <Icon size={16} />
          </div>
        </div>
        <p className="text-lg font-extrabold text-[#0F172A] leading-tight">{value}</p>
      </div>
    );
  }

  function SkeletonCard() {
    return (
      <div className="bg-white rounded-2xl border border-[#E2E8F0] p-4 flex flex-col gap-2 animate-pulse">
        <div className="flex justify-between">
          <div className="h-3 w-24 bg-slate-200 rounded" />
          <div className="h-7 w-7 bg-slate-200 rounded-xl" />
        </div>
        <div className="h-6 w-28 bg-slate-200 rounded" />
      </div>
    );
  }

  function DailyReport() {
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

    const { data: reportData, isLoading: reportLoading, isError: reportError, refetch: refetchReport } = useQuery({
      queryKey: ['report-daily', date],
      queryFn: () => reportsApi.getDailyReport(date),
    });

    const { data: salesData, isLoading: salesLoading, isError: salesError, refetch: refetchSales } = useQuery({
      queryKey: ['sales-today', date],
      queryFn: () => salesApi.getSales({ date }),
    });

    const report = reportData?.data?.data || {};
    const stats = report.stats || {};
    const sales = salesData?.data?.data?.sales || [];

    return (
      <div className="flex flex-col gap-4">
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          max={new Date().toISOString().split('T')[0]}
          className="h-12 rounded-xl border border-[#E2E8F0] bg-white px-4 text-base text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition w-full sm:w-auto"
        />

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {reportLoading ? (
            [1, 2, 3].map((i) => <SkeletonCard key={i} />)
          ) : reportError ? (
            <div className="col-span-3 bg-white rounded-2xl border border-red-100 p-5 flex flex-col items-center gap-2 text-center">
              <AlertCircle size={28} className="text-red-400" />
              <p className="text-sm font-semibold text-red-500">{t('error_loading')}</p>
              <button onClick={() => refetchReport()} className="text-sm text-green-600 font-semibold hover:underline">{t('retry')}</button>
            </div>
          ) : (
            <>
              <StatCard label={t('sales_count')} value={stats.salesCount ?? 0} icon={ShoppingCart} color="blue" />
              <StatCard label={t('total_revenue')} value={fmt(stats.totalRevenue)} icon={DollarSign} color="amber" />
              <StatCard label={t('total_profit')} value={fmt(stats.totalProfit)} icon={TrendingUp} color="green" />
            </>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-[#E2E8F0] overflow-hidden">
          <div className="px-5 py-4 border-b border-[#E2E8F0]">
            <h3 className="font-bold text-[#0F172A]">{t('sales_list')}</h3>
          </div>
          {salesError ? (
            <div className="px-5 py-10 text-center">
              <AlertCircle size={32} className="mx-auto mb-2 text-red-400" />
              <p className="text-sm font-semibold text-red-500">{t('error_loading')}</p>
              <button onClick={() => refetchSales()} className="mt-2 text-sm text-green-600 font-semibold hover:underline">{t('retry')}</button>
            </div>
          ) : salesLoading ? (
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
          ) : !Array.isArray(sales) || sales.length === 0 ? (
            <div className="px-5 py-10 text-center text-[#64748B]">
              <ShoppingCart size={32} className="mx-auto mb-2 opacity-40" />
              <p className="text-sm">{t('no_sales_day')}</p>
            </div>
          ) : (
            <div className="divide-y divide-[#E2E8F0]">
              {sales.map((sale) => {
                const timeStr = new Date(sale.createdAt).toLocaleTimeString(locale, {
                  hour: '2-digit',
                  minute: '2-digit',
                });
                return (
                  <div key={sale.id} className="flex items-center justify-between px-5 py-3">
                    <div>
                      <p className="text-sm font-semibold text-[#0F172A]">{sale.productName || 'Mahsulot'}</p>
                      <p className="text-xs text-[#64748B] mt-0.5">
                        {sale.quantity} {t(`unit_${sale.unit || 'pcs'}`)} · {timeStr}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-green-600">+{Number(sale.profit || 0).toLocaleString(locale)} {t('currency')}</p>
                      <p className="text-xs text-[#64748B]">{Number(sale.totalRevenue || 0).toLocaleString(locale)} {t('currency')}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  function MonthlyReport() {
    const now = new Date();
    const defaultMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const [month, setMonth] = useState(defaultMonth);

    const { data, isLoading, isError, refetch } = useQuery({
      queryKey: ['report-monthly', month],
      queryFn: () => reportsApi.getMonthlyReport(month),
    });

    const report = data?.data?.data || {};
    const stats = report.stats || {};
    const topProducts = Array.isArray(report.topProducts) ? report.topProducts : [];

    return (
      <div className="flex flex-col gap-4">
        <input
          type="month"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          max={defaultMonth}
          className="h-12 rounded-xl border border-[#E2E8F0] bg-white px-4 text-base text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition w-full sm:w-auto"
        />

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {isLoading ? (
            [1, 2, 3].map((i) => <SkeletonCard key={i} />)
          ) : isError ? (
            <div className="col-span-3 bg-white rounded-2xl border border-red-100 p-5 flex flex-col items-center gap-2 text-center">
              <AlertCircle size={28} className="text-red-400" />
              <p className="text-sm font-semibold text-red-500">{t('error_loading')}</p>
              <button onClick={() => refetch()} className="text-sm text-green-600 font-semibold hover:underline">{t('retry')}</button>
            </div>
          ) : (
            <>
              <StatCard
                label={t('sales_count')}
                value={stats.salesCount ?? 0}
                icon={ShoppingCart}
                color="blue"
              />
              <StatCard
                label={t('total_revenue')}
                value={fmt(stats.totalRevenue)}
                icon={DollarSign}
                color="amber"
              />
              <StatCard
                label={t('total_profit')}
                value={fmt(stats.totalProfit)}
                icon={TrendingUp}
                color="green"
              />
            </>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-[#E2E8F0] overflow-hidden">
          <div className="px-5 py-4 border-b border-[#E2E8F0]">
            <h3 className="font-bold text-[#0F172A]">{t('by_products')}</h3>
          </div>
          {isLoading ? (
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
          ) : topProducts.length === 0 ? (
            <div className="px-5 py-10 text-center text-[#64748B]">
              <BarChart2 size={32} className="mx-auto mb-2 opacity-40" />
              <p className="text-sm">{t('no_sales_month')}</p>
            </div>
          ) : (
            <div className="divide-y divide-[#E2E8F0]">
              {topProducts.map((item, i) => (
                <div key={i} className="flex items-center justify-between px-5 py-3">
                  <div>
                    <p className="text-sm font-semibold text-[#0F172A]">{item._id}</p>
                    <p className="text-xs text-[#64748B] mt-0.5">{item.totalQty} {t('unit_pcs')} · {item.salesCount} {t('sale_unit')}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-green-600">+{Number(item.totalProfit || 0).toLocaleString(locale)} {t('currency')}</p>
                    <p className="text-xs text-[#64748B]">{Number(item.totalRevenue || 0).toLocaleString(locale)} {t('currency')}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  const [tab, setTab] = useState('daily');

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <div className="bg-white border-b border-[#E2E8F0] px-5 py-4 sticky top-0 z-10">
        <h1 className="text-lg font-bold text-[#0F172A] mb-3">{t('reports')}</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setTab('daily')}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${tab === 'daily'
                ? 'bg-green-500 text-white'
                : 'bg-slate-100 text-[#64748B] hover:bg-slate-200'
              }`}
          >
            {t('daily')}
          </button>
          <button
            onClick={() => setTab('monthly')}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${tab === 'monthly'
                ? 'bg-green-500 text-white'
                : 'bg-slate-100 text-[#64748B] hover:bg-slate-200'
              }`}
          >
            {t('monthly')}
          </button>
        </div>
      </div>

      <div className="px-4 sm:px-6 py-5 max-w-3xl mx-auto">
        {tab === 'daily' ? <DailyReport /> : <MonthlyReport />}
      </div>
    </div>
  );
}
