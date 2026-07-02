import { useEffect, useState } from "react";
import { useAuth } from "../../store";
import { useAdminData } from "../../store/adminData";
import { useI18n } from "../../i18n";
import { monthlyOrderStats, weeklyUserStats } from "../../constants/mockData";
import { OrderRevenueChart, UserActivityChart } from "./components/StatsChart";
import { http } from "../../services/http";

const fallbackWeekly = weeklyUserStats;
const fallbackMonthly = monthlyOrderStats;

const toneRing = {
  info: "ring-blue-100 bg-blue-50",
  success: "ring-green-100 bg-green-50",
  warning: "ring-yellow-100 bg-yellow-50",
  danger: "ring-red-100 bg-red-50"
};

const toneText = {
  info: "text-blue-600",
  success: "text-green-600",
  warning: "text-yellow-600",
  danger: "text-red-600"
};

const toneDot = {
  info: "bg-blue-400",
  success: "bg-green-400",
  warning: "bg-yellow-400",
  danger: "bg-red-400"
};

const priorityStyle = {
  high: "bg-red-600 text-white",
  medium: "bg-yellow-500 text-slate-900",
  low: "bg-slate-500 text-white"
};

export function DashboardPage() {
  const { profile } = useAuth();
  const { notificationFeed, recentActivity, products, orders } = useAdminData();
  const { t } = useI18n();

  const realOrdersCount = orders.length;
  const realRevenue = orders
    .filter(o => o.paymentStatus === "paid")
    .reduce((sum, o) => sum + (Number(o.totalPrice) || 0), 0);

  const [weeklyData, setWeeklyData] = useState(fallbackWeekly);
  const [monthlyData, setMonthlyData] = useState(fallbackMonthly);
  const [dashboardStats, setDashboardStats] = useState({
    totalUsers: users.length,
    totalProducts: products.length,
    totalOrders: realOrdersCount,
    totalRevenue: realRevenue
  });
  const [statsSource, setStatsSource] = useState("local");

  useEffect(() => {
    let cancelled = false;
    function fetchStats() {
      http.get("/admin/stats")
        .then((res) => {
          if (cancelled) return;
          const data = res?.data?.data || res?.data;
          if (data?.weeklyUsers?.length) setWeeklyData(data.weeklyUsers);
          if (data?.monthlyOrders?.length) setMonthlyData(data.monthlyOrders);
          setDashboardStats({
            totalUsers: data?.totalUsers ?? users.length,
            totalProducts: data?.totalProducts ?? products.length,
            totalOrders: data?.totalOrders !== undefined ? data.totalOrders : realOrdersCount,
            totalRevenue: data?.totalRevenue !== undefined ? data.totalRevenue : realRevenue
          });
          setStatsSource("live");
        })
        .catch((err) => {
          if (cancelled) return;
          console.error("Dashboard stats fetch failed:", err);
          setDashboardStats({
            totalUsers: users.length,
            totalProducts: products.length,
            totalOrders: realOrdersCount,
            totalRevenue: realRevenue
          });
          setStatsSource("local");
        });
    }

    fetchStats();
    const interval = setInterval(fetchStats, 30000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [users.length, products.length, realOrdersCount, realRevenue]);

  const stats = [
    {
      label: t("dashboard.stats.totalUsers"),
      value: dashboardStats.totalUsers,
      tone: "info",
      icon: (
        <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 005.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      )
    },
    {
      label: t("dashboard.stats.totalProducts"),
      value: dashboardStats.totalProducts,
      tone: "success",
      icon: (
        <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      )
    },
    {
      label: t("dashboard.stats.totalOrders"),
      value: dashboardStats.totalOrders,
      tone: "warning",
      icon: (
        <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
        </svg>
      )
    },
    {
      label: t("dashboard.stats.totalRevenue"),
      value: typeof dashboardStats.totalRevenue === "number" ? dashboardStats.totalRevenue.toLocaleString() + " so'm" : dashboardStats.totalRevenue,
      tone: "danger",
      icon: (
        <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    }
  ];

  const resolveTranslation = (key) => {
    if (!key) {
      return "";
    }
    if (key.startsWith("dashboard.recentActivity.")) {
      return t(key.replace("dashboard.recentActivity.", "dashboard.recentActivityEntries."));
    }
    return t(key);
  };

  return (
    <div className="space-y-6">
      <div className="bg-[#0e2037] rounded-2xl p-6 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-xs text-white/40 uppercase tracking-wider mb-1">{t("common.adminPanel")}</p>
          <h2 className="text-xl font-bold">
            {profile?.name}
            {profile?.isPrimary && (
              <span className="ml-2 text-xs font-normal text-primary/80 bg-primary/20 px-2 py-0.5 rounded-full">
                {t("labels.roles.super_admin")}
              </span>
            )}
          </h2>
          <p className="text-sm text-white/50 mt-1">
            {profile?.isPrimary ? t("dashboard.superAdminTitle") : t("dashboard.adminTitle")}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {[
            t("dashboard.pillCrud"),
            t("dashboard.pillAudit"),
            t("dashboard.pillToast"),
            t("dashboard.pillRoleAware")
          ].map((tag) => (
            <span key={tag} className="text-xs bg-white/10 text-white/70 px-3 py-1 rounded-full">
              {tag}
            </span>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl p-5 border border-white/10 bg-slate-900/60 shadow-card hover:border-white/20 transition-all duration-300 group relative overflow-hidden"
          >
            {/* Background subtle glowing effect */}
            <div className={`absolute -right-4 -bottom-4 w-24 h-24 rounded-full filter blur-2xl opacity-10 group-hover:opacity-20 transition-opacity duration-300 ${
              stat.tone === "info" ? "bg-blue-500" :
              stat.tone === "success" ? "bg-green-500" :
              stat.tone === "warning" ? "bg-yellow-500" :
              "bg-red-500"
            }`} />

            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">{stat.label}</p>
              <div className="p-2 rounded-xl bg-white/5 border border-white/5 group-hover:scale-110 transition-transform duration-300">
                {stat.icon}
              </div>
            </div>
            
            <p className="text-2xl font-bold text-white tracking-tight">
              {typeof stat.value === "number" ? String(stat.value).padStart(2, "0") : stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* Charts section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <UserActivityChart data={weeklyData} />
        <OrderRevenueChart data={monthlyData} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-slate-900/70 border border-white/10 rounded-2xl p-5 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-white">{t("dashboard.recentActivity")}</h3>
            <span className="text-xs text-white/80 bg-white/10 px-2.5 py-1 rounded-full">{t("common.live")}</span>
          </div>
          <div className="space-y-3">
            {recentActivity.slice(0, 5).map((item, i) => (
              <div key={i} className="flex items-start gap-3">
                <span className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${toneDot[item.tone] || "bg-gray-300"}`} />
                <div>
                  <p className="text-sm font-medium text-white">{resolveTranslation(item.titleKey || item.title)}</p>
                  <p className="text-xs text-white/70">{resolveTranslation(item.detailKey || item.detail)}</p>
                  <p className="text-xs text-white/50 mt-0.5">{item.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-slate-900/70 border border-white/10 rounded-2xl p-5 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-white">{t("dashboard.notificationsTitle")}</h3>
            <span className="text-xs text-white/80 bg-white/10 px-2.5 py-1 rounded-full">{t("dashboard.priorityFeed")}</span>
          </div>
          <div className="space-y-3">
            {notificationFeed.map((notification) => (
              <div key={notification.id} className="flex items-start justify-between gap-3 p-3 rounded-xl bg-slate-800/50 border border-white/10">
                <div>
                  <p className="text-sm font-medium text-white">{resolveTranslation(notification.titleKey || notification.title)}</p>
                  <p className="text-xs text-white/70 mt-0.5">{resolveTranslation(notification.detailKey || notification.detail)}</p>
                </div>
                <span
                  className={`text-xs font-medium px-2.5 py-1 rounded-full shrink-0 ${
                    priorityStyle[notification.priority] || "bg-gray-100 text-gray-800"
                  }`}
                >
                  {t(`labels.priorities.${notification.priority}`, {}, notification.priority)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          {
            labelKey: "users.createUser",
            descKey: "navigation.menu.users.description",
            href: "/users",
            color: "from-slate-800 via-slate-700 to-slate-800",
            text: "text-white"
          },
          {
            labelKey: "content.title",
            descKey: "navigation.menu.content.description",
            href: "/content",
            color: "from-slate-800 via-slate-700 to-slate-800",
            text: "text-white"
          },
          {
            labelKey: "audit.title",
            descKey: "navigation.menu.auditLogs.description",
            href: "/audit-logs",
            color: "from-slate-800 via-slate-700 to-slate-800",
            text: "text-white"
          }
        ].map((card) => (
          <a
            key={card.labelKey}
            href={card.href}
            className={`bg-gradient-to-br ${card.color} rounded-2xl p-5 hover:shadow-card transition-shadow group`}
          >
            <p className="font-semibold text-white group-hover:text-primary transition-colors">{t(card.labelKey)}</p>
            <p className="text-xs text-white/70 mt-1">{t(card.descKey)}</p>
            <span className="text-primary text-xs mt-3 inline-block group-hover:translate-x-1 transition-transform">
              {t("common.view")} -
            </span>
          </a>
        ))}
      </div>
    </div>
  );
}
