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

const tooltipStyle = {
  backgroundColor: "#ffffff",
  border: "1px solid #bbcabf",
  borderRadius: "12px",
  color: "#151c27",
  fontSize: "12px",
  boxShadow: "0 4px 24px rgba(16,32,51,0.08)"
};

const axisTick = { fill: "#3c4a42", fontSize: 11 };
const COLOR_PRIMARY = "#10b981";
const COLOR_SECONDARY = "#4648d4";

export function UserActivityChart({ data }) {
  return (
    <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-padding-card shadow-card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-title-sm text-title-sm text-on-surface">Haftalik foydalanuvchilar</h3>
        <span className="text-body-sm text-on-surface-variant">Jami va faol</span>
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(60,74,66,0.08)" />
          <XAxis dataKey="day" tick={axisTick} axisLine={false} tickLine={false} />
          <YAxis tick={axisTick} axisLine={false} tickLine={false} />
          <Tooltip contentStyle={tooltipStyle} cursor={{ stroke: "rgba(60,74,66,0.15)" }} />
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
  return (
    <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-padding-card shadow-card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-title-sm text-title-sm text-on-surface">Oylik buyurtmalar va daromad</h3>
        <div className="flex gap-3 text-body-sm">
          <span className="flex items-center gap-1 text-on-surface-variant">
            <span className="w-2.5 h-2.5 rounded-sm" style={{ background: COLOR_SECONDARY }} />
            Buyurtmalar
          </span>
          <span className="flex items-center gap-1 text-on-surface-variant">
            <span className="w-2.5 h-2.5 rounded-sm" style={{ background: COLOR_PRIMARY }} />
            Daromad
          </span>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} margin={{ top: 4, right: -10, left: -25, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(60,74,66,0.08)" />
          <XAxis dataKey="month" tick={axisTick} axisLine={false} tickLine={false} />
          <YAxis yAxisId="left" tick={axisTick} axisLine={false} tickLine={false} />
          <YAxis yAxisId="right" orientation="right" tick={axisTick} axisLine={false} tickLine={false} tickFormatter={formatRevenueTick} />
          <Tooltip
            contentStyle={tooltipStyle}
            cursor={{ fill: "rgba(60,74,66,0.04)" }}
            formatter={(v, n) => n === "revenue" ? [`${Number(v).toLocaleString("uz-UZ")} so'm`, "Daromad"] : [v, "Buyurtma"]}
          />
          <Bar yAxisId="left" dataKey="orders" fill={COLOR_SECONDARY} radius={[4, 4, 0, 0]} name="Buyurtmalar" />
          <Bar yAxisId="right" dataKey="revenue" fill={COLOR_PRIMARY} radius={[4, 4, 0, 0]} name="Daromad" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
