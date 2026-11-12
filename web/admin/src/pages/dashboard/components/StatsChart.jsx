import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { useI18n } from "../../../i18n";

const UZ_MONTHS = ["yan", "fev", "mar", "apr", "may", "iyn", "iyl", "avg", "sen", "okt", "noy", "dek"];
const INTL_LOCALE = { uz: "uz-UZ", ru: "ru-RU", en: "en-US" };
const numberLocale = (locale) => INTL_LOCALE[locale] || "en-US";

// The backend/demo data labels months in Uzbek ("Iyn", "Avg"...). Show them in the UI language.
function monthLabel(raw, locale) {
  const idx = UZ_MONTHS.indexOf(String(raw).trim().toLowerCase().slice(0, 3));
  if (idx < 0) return raw;
  return new Date(2000, idx, 1).toLocaleDateString(numberLocale(locale), { month: "short" });
}

const tooltipStyle = {
  backgroundColor: "rgb(var(--c-surface-container-lowest))",
  border: "1px solid rgb(var(--c-outline-variant))",
  borderRadius: "12px",
  color: "rgb(var(--c-on-surface))",
  fontSize: "12px",
  boxShadow: "0 4px 24px rgba(16,32,51,0.08)"
};

const axisTick = { fill: "rgb(var(--c-on-surface-variant))", fontSize: 11 };
const COLOR_PRIMARY = "#10b981";
const COLOR_SECONDARY = "#4648d4";

export function UserActivityChart({ data }) {
  const { t } = useI18n();
  return (
    <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-padding-card shadow-card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-title-sm text-title-sm text-on-surface">{t("dashboard.chart.weeklyUsers")}</h3>
        <span className="text-body-sm text-on-surface-variant">{t("dashboard.chart.totalActive")}</span>
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--c-outline-variant) / 0.6)" />
          <XAxis dataKey="day" tick={axisTick} axisLine={false} tickLine={false} />
          <YAxis tick={axisTick} axisLine={false} tickLine={false} />
          <Tooltip contentStyle={tooltipStyle} cursor={{ stroke: "rgb(var(--c-outline) / 0.5)" }} />
          <Line type="monotone" dataKey="users" stroke={COLOR_SECONDARY} strokeWidth={2} dot={false} name="Jami" />
          <Line type="monotone" dataKey="active" stroke={COLOR_PRIMARY} strokeWidth={2} dot={false} name="Faol" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

const formatRevenueTick = (v) => {
  if (v >= 1000000) {
    return `${(v / 1000000).toFixed(1).replace(/\.0$/, "")}M`;
  }
  if (v >= 1000) {
    return `${(v / 1000).toFixed(0)}K`;
  }
  return v;
};

export function OrderRevenueChart({ data }) {
  const { t, locale } = useI18n();
  return (
    <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-padding-card shadow-card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-title-sm text-title-sm text-on-surface">{t("dashboard.chart.monthly")}</h3>
        <div className="flex gap-3 text-body-sm">
          <span className="flex items-center gap-1 text-on-surface-variant">
            <span className="w-2.5 h-2.5 rounded-sm" style={{ background: COLOR_SECONDARY }} />
            {t("navigation.menu.orders.label")}
          </span>
          <span className="flex items-center gap-1 text-on-surface-variant">
            <span className="w-2.5 h-2.5 rounded-sm" style={{ background: COLOR_PRIMARY }} />
            {t("dashboard.chart.revenue")}
          </span>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} margin={{ top: 4, right: -10, left: -25, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--c-outline-variant) / 0.6)" />
          <XAxis dataKey="month" tick={axisTick} axisLine={false} tickLine={false} tickFormatter={(m) => monthLabel(m, locale)} />
          <YAxis yAxisId="left" tick={axisTick} axisLine={false} tickLine={false} />
          <YAxis yAxisId="right" orientation="right" tick={axisTick} axisLine={false} tickLine={false} tickFormatter={formatRevenueTick} />
          <Tooltip
            contentStyle={tooltipStyle}
            cursor={{ fill: "rgb(var(--c-outline) / 0.15)" }}
            formatter={(v, n) => n === "revenue" ? [`${Number(v).toLocaleString(numberLocale(locale))} ${t("common.currency")}`, t("dashboard.chart.revenue")] : [v, t("dashboard.chart.orderSingular")]}
          />
          <Bar yAxisId="left" dataKey="orders" fill={COLOR_SECONDARY} radius={[4, 4, 0, 0]} name={t("navigation.menu.orders.label")} />
          <Bar yAxisId="right" dataKey="revenue" fill={COLOR_PRIMARY} radius={[4, 4, 0, 0]} name={t("dashboard.chart.revenue")} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
