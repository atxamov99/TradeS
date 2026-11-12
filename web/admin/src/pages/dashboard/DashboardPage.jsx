import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../store";
import { useAdminData } from "../../store/adminData";
import { useI18n } from "../../i18n";
import { OrderRevenueChart } from "./components/StatsChart";
import { http } from "../../services/http";
import { Icon } from "../../components/shared/Icon";

const fallbackMonthly = [];

const ORDER_STATUS_BADGE = {
  pending:    { label: "labels.statuses.pending",   cls: "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300" },
  processing: { label: "orders.status.processing", cls: "bg-blue-100 text-blue-800 dark:bg-blue-500/15 dark:text-blue-300" },
  shipped:    { label: "orders.status.shipped",       cls: "bg-purple-100 text-purple-800 dark:bg-purple-500/15 dark:text-purple-300" },
  delivered:  { label: "orders.status.delivered",   cls: "bg-green-100 text-green-800 dark:bg-green-500/15 dark:text-green-300" },
  cancelled:  { label: "orders.status.cancelled", cls: "bg-red-100 text-red-800 dark:bg-red-500/15 dark:text-red-300" }
};

function formatMoney(n) {
  return Number(n || 0).toLocaleString("uz-UZ");
}

function StatCard({ label, value, icon, iconWrap, trend }) {
  return (
    <div className="bg-surface-container-lowest rounded-xl border border-outline-variant p-padding-card flex flex-col justify-between hover:border-primary/30 transition-colors">
      <div className="flex justify-between items-start mb-4">
        <span className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider">{label}</span>
        <div className={`p-2 rounded-lg ${iconWrap}`}>
          <Icon name={icon} />
        </div>
      </div>
      <div>
        <div className="font-display-lg text-display-lg font-bold text-on-surface mb-1 leading-none">{value}</div>
        {trend && <div className="text-body-sm text-on-surface-variant">{trend}</div>}
      </div>
    </div>
  );
}

export function DashboardPage() {
  const { profile } = useAuth();
  const { recentActivity, products, orders, users } = useAdminData();
  const { t } = useI18n();

  const realOrdersCount = orders.length;
  const realRevenue = orders
    .filter((o) => o.paymentStatus === "paid")
    .reduce((sum, o) => sum + (Number(o.totalPrice) || 0), 0);

  const [monthlyData, setMonthlyData] = useState(fallbackMonthly);
  const [dashboardStats, setDashboardStats] = useState({
    totalUsers: users.length,
    totalProducts: products.length,
    totalOrders: realOrdersCount,
    totalRevenue: realRevenue
  });

  useEffect(() => {
    let cancelled = false;
    function fetchStats() {
      http.get("/admin/stats")
        .then((res) => {
          if (cancelled) return;
          const data = res?.data?.data || res?.data;
          if (data?.monthlyOrders?.length) setMonthlyData(data.monthlyOrders);
          setDashboardStats({
            totalUsers: data?.totalUsers ?? users.length,
            totalProducts: data?.totalProducts ?? products.length,
            totalOrders: data?.totalOrders !== undefined ? data.totalOrders : realOrdersCount,
            totalRevenue: data?.totalRevenue !== undefined ? data.totalRevenue : realRevenue
          });
        })
        .catch(() => {
          if (cancelled) return;
          setDashboardStats({
            totalUsers: users.length,
            totalProducts: products.length,
            totalOrders: realOrdersCount,
            totalRevenue: realRevenue
          });
        });
    }

    fetchStats();
    const interval = setInterval(fetchStats, 30000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [users.length, products.length, realOrdersCount, realRevenue]);

  const lowStock = [...products]
    .filter((p) => typeof p.stock === "number")
    .sort((a, b) => a.stock - b.stock)
    .slice(0, 4);

  const recentOrders = [...orders]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5);

  return (
    <div className="space-y-section-gap">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-4">
        <div>
          <h2 className="font-headline-md text-headline-md font-bold text-on-surface">{t("navigation.pageMeta.fallback.eyebrow")}</h2>
          <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
            {t("dashboard.greeting", { name: profile?.name })}
          </p>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-gutter">
        <StatCard
          label={t("dashboard.stats.totalSales")}
          value={`${formatMoney(dashboardStats.totalRevenue)} ${t("common.currency")}`}
          icon="payments"
          iconWrap="bg-primary-container/15 text-primary-container"
        />
        <StatCard
          label={t("navigation.menu.orders.label")}
          value={formatMoney(dashboardStats.totalOrders)}
          icon="shopping_bag"
          iconWrap="bg-secondary-container/15 text-secondary"
        />
        <StatCard
          label={t("navigation.menu.products.label")}
          value={formatMoney(dashboardStats.totalProducts)}
          icon="inventory_2"
          iconWrap="bg-surface-variant text-on-surface-variant"
        />
        <StatCard
          label={t("navigation.menu.users.label")}
          value={formatMoney(dashboardStats.totalUsers)}
          icon="group"
          iconWrap="bg-tertiary-container/25 text-tertiary"
        />
      </div>

      {/* Chart + low stock */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-gutter">
        <div className="lg:col-span-2">
          <OrderRevenueChart data={monthlyData} />
        </div>

        <div className="bg-surface-container-lowest rounded-xl border border-outline-variant p-padding-card flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-title-sm text-title-sm text-on-surface">{t("dashboard.lowStock")}</h3>
            <Link to="/products" className="text-body-sm text-primary-container hover:text-primary font-medium">{t("common.all")}</Link>
          </div>
          <ul className="space-y-2 flex-1">
            {lowStock.length === 0 && (
              <li className="text-body-sm text-on-surface-variant py-6 text-center">{t("common.noData")}</li>
            )}
            {lowStock.map((p) => {
              const critical = p.stock <= 5;
              return (
                <li key={p.id} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-surface-container-low transition-colors">
                  <div className="w-10 h-10 rounded-lg bg-surface-container-high flex items-center justify-center text-on-surface-variant shrink-0">
                    <Icon name="inventory_2" className="text-[20px]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-body-sm font-medium text-on-surface truncate">{p.name}</h4>
                    <p className="text-xs text-on-surface-variant truncate">{p.category || "—"}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className={`block text-body-sm font-bold ${critical ? "text-error" : "text-tertiary"}`}>
                      {p.stock} {t("common.pcs")}
                    </span>
                    <span className={`font-label-caps text-label-caps px-2 py-0.5 rounded mt-1 inline-block ${critical ? "text-error bg-error-container" : "text-tertiary bg-tertiary-container/30"}`}>
                      {critical ? t("dashboard.urgent") : t("dashboard.warning")}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      {/* Recent orders */}
      <div className="bg-surface-container-lowest rounded-xl border border-outline-variant overflow-hidden">
        <div className="p-padding-card border-b border-outline-variant flex justify-between items-center bg-surface-bright">
          <h3 className="font-title-sm text-title-sm text-on-surface">{t("dashboard.recentOrders")}</h3>
          <Link to="/orders" className="text-body-sm text-primary-container hover:text-primary font-medium flex items-center gap-1">
            {t("common.all")} <Icon name="arrow_forward" className="text-[18px]" />
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-lowest border-b border-outline-variant font-label-caps text-label-caps text-on-surface-variant uppercase">
                <th className="p-4 font-semibold">№</th>
                <th className="p-4 font-semibold">{t("common.customer")}</th>
                <th className="p-4 font-semibold">{t("common.date")}</th>
                <th className="p-4 font-semibold text-right">{t("common.amount")}</th>
                <th className="p-4 font-semibold text-center">{t("common.status")}</th>
              </tr>
            </thead>
            <tbody className="font-body-sm text-body-sm divide-y divide-outline-variant/50">
              {recentOrders.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-on-surface-variant">{t("orders.notFound")}</td>
                </tr>
              ) : (
                recentOrders.map((o) => {
                  const badge = ORDER_STATUS_BADGE[o.orderStatus] || { label: o.orderStatus, cls: "bg-surface-variant text-on-surface-variant" };
                  const name = o.user?.name || "Noma'lum";
                  return (
                    <tr key={o.id} className="hover:bg-surface-container-low/50 transition-colors">
                      <td className="p-4 text-primary-container font-medium">{o.orderNumber}</td>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-surface-variant flex items-center justify-center text-on-surface-variant font-bold text-xs shrink-0">
                            {name.slice(0, 2).toUpperCase()}
                          </div>
                          <span className="font-medium text-on-surface">{name}</span>
                        </div>
                      </td>
                      <td className="p-4 text-on-surface-variant whitespace-nowrap">
                        {o.createdAt ? new Date(o.createdAt).toLocaleDateString("uz-UZ") : "—"}
                      </td>
                      <td className="p-4 text-right font-medium text-on-surface whitespace-nowrap">{formatMoney(o.totalPrice)} so'm</td>
                      <td className="p-4 text-center">
                        <span className={`inline-flex items-center justify-center px-2.5 py-1 rounded-full font-label-caps text-[11px] font-bold ${badge.cls}`}>
                          {t(badge.label)}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent activity (real audit feed) */}
      {recentActivity.length > 0 && (
        <div className="bg-surface-container-lowest rounded-xl border border-outline-variant p-padding-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-title-sm text-title-sm text-on-surface">{t("dashboard.recentActivity")}</h3>
            <span className="text-xs text-primary-container bg-primary-container/10 px-2.5 py-1 rounded-full">{t("common.live", {}, "Jonli")}</span>
          </div>
          <div className="space-y-3">
            {recentActivity.slice(0, 5).map((item, i) => (
              <div key={i} className="flex items-start gap-3">
                <span className="mt-1.5 w-2 h-2 rounded-full bg-primary-container shrink-0" />
                <div className="min-w-0">
                  <p className="text-body-sm font-medium text-on-surface">{item.title}</p>
                  <p className="text-xs text-on-surface-variant">{item.detail}</p>
                  <p className="text-xs text-on-surface-variant/70 mt-0.5">{item.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
