import { useState, useEffect } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useAuth } from "../../store";
import { useI18n } from "../../i18n";
import { reportsApi } from "../../services/api/reports.api";
import { Icon } from "../../components/shared/Icon";

const tooltipStyle = {
  backgroundColor: "#ffffff",
  border: "1px solid #bbcabf",
  borderRadius: "12px",
  color: "#151c27",
  fontSize: "12px",
  boxShadow: "0 4px 24px rgba(16,32,51,0.08)"
};

const CARD_ICONS = ["account_balance_wallet", "receipt_long", "shopping_bag"];
const CARD_WRAPS = ["text-primary", "text-secondary", "text-tertiary"];

export function ReportsPage() {
  const { hasPermission } = useAuth();
  const { t } = useI18n();
  const today = new Date().toISOString().slice(0, 10);
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  const [from, setFrom] = useState(weekAgo);
  const [to, setTo] = useState(today);
  const [type, setType] = useState("overview");
  const [cards, setCards] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const formatNum = (value) => (typeof value === "number" ? value.toLocaleString("uz-UZ") : value);

  const loadReports = async () => {
    setLoading(true);
    setError(null);
    try {
      let data;
      if (type === "admin-activity") {
        data = await reportsApi.getAdminActivity({ from, to });
        setCards([
          { title: "Umumiy adminlar", value: formatNum(data.totalAdmins ?? 0), note: "Barcha ro'yxatdan o'tganlar" },
          { title: "Faol adminlar", value: formatNum(data.activeAdmins ?? 0), note: "Tizimga ruxsati borlar" },
          { title: "Bloklanganlar", value: formatNum((data.totalAdmins || 0) - (data.activeAdmins || 0)), note: "Tizimga kirolmaydiganlar" }
        ]);
        setChartData((data.logs || []).map((a) => ({ name: a.name?.split(" ")[0] || "Admin", qiymat: a.status === "active" ? 1 : 0 })));
      } else if (type === "security") {
        data = await reportsApi.getSecurity({ from, to });
        setCards([
          { title: "Bloklanganlar (yangi)", value: formatNum(data.blockedUsers ?? 0), note: "Tanlangan davrda bloklangan" },
          { title: "Jami bloklanganlar", value: formatNum(data.blockedAccounts ?? 0), note: "Umumiy bloklangan foydalanuvchilar" },
          { title: "Xato kirishlar", value: formatNum(data.failedAttempts ?? 0), note: "Noto'g'ri parol kiritishlar" }
        ]);
        setChartData([
          { name: "Bloklangan", qiymat: data.blockedUsers ?? 0 },
          { name: "Xato login", qiymat: data.failedAttempts ?? 0 },
          { name: "Faol", qiymat: (data.totalAccounts ?? 0) - (data.blockedAccounts ?? 0) }
        ]);
      } else {
        data = await reportsApi.getOverview({ from, to });
        setCards([
          { title: "Jami foydalanuvchilar", value: formatNum(data.totalUsers ?? 0), note: "Tizimda ro'yxatdan o'tganlar" },
          { title: "Jami daromad", value: formatNum(data.totalRevenue ?? 0) + " UZS", note: "Tasdiqlangan to'lovlar (davr)" },
          { title: "Jami buyurtmalar", value: formatNum(data.totalOrders ?? 0), note: "Barcha xaridlar soni" }
        ]);
        setChartData([
          { name: "Foydalanuvchilar", qiymat: data.totalUsers ?? 0 },
          { name: "Buyurtmalar", qiymat: data.totalOrders ?? 0 },
          { name: "Mahsulotlar", qiymat: data.totalProducts ?? 0 }
        ]);
      }
    } catch (err) {
      setError(err?.message || "Serverdan ma'lumot olishda xato");
      setCards([]);
      setChartData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [from, to, type]);

  async function handleExport() {
    try {
      const blob = await reportsApi.export({ type: type === "security" ? "users" : "orders", from, to });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `report-${type}-${from}-${to}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(err?.message || "Eksport qilishda xato");
    }
  }

  return (
    <div className="space-y-section-gap">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-headline-md text-headline-md text-on-surface">Sotuvlar</h2>
          <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">Barcha sotuvlar tarixi va tahlili</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {hasPermission && hasPermission("reports.export") && (
            <button
              type="button"
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2 border border-outline-variant bg-surface-container-lowest rounded-lg text-body-sm text-on-surface-variant hover:bg-surface-container-low transition-colors"
            >
              <Icon name="download" className="text-[20px]" />
              CSV Eksport
            </button>
          )}
          <button
            type="button"
            onClick={loadReports}
            disabled={loading}
            className="flex items-center gap-2 px-5 py-2 bg-primary-container text-on-primary-container rounded-lg text-body-sm font-title-sm hover:bg-primary hover:text-on-primary transition-colors shadow-sm disabled:opacity-60"
          >
            {loading ? "Yuklanmoqda..." : "Yangilash"}
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1.5">
          <label className="text-body-sm text-on-surface-variant">Dan</label>
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)}
            className="px-3 py-2 text-body-sm border border-outline-variant rounded-lg bg-surface text-on-surface focus:outline-none focus:border-primary" />
        </div>
        <div className="flex items-center gap-1.5">
          <label className="text-body-sm text-on-surface-variant">Gacha</label>
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)}
            className="px-3 py-2 text-body-sm border border-outline-variant rounded-lg bg-surface text-on-surface focus:outline-none focus:border-primary" />
        </div>
        <select value={type} onChange={(e) => setType(e.target.value)}
          className="px-4 py-2 text-body-sm border border-outline-variant rounded-lg bg-surface text-on-surface focus:outline-none focus:border-primary cursor-pointer">
          <option value="overview">Umumiy</option>
          <option value="admin-activity">Admin faoliyati</option>
          <option value="security">Xavfsizlik</option>
        </select>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {cards.map((card, i) => (
          <div key={i} className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 flex flex-col gap-4 shadow-sm">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-label-caps text-label-caps text-on-surface-variant uppercase mb-1">{card.title}</p>
                <h3 className="font-headline-md text-headline-md text-on-surface">{card.value}</h3>
              </div>
              <div className={`w-10 h-10 rounded-lg bg-surface-container-low flex items-center justify-center ${CARD_WRAPS[i] || "text-primary"}`}>
                <Icon name={CARD_ICONS[i] || "insights"} />
              </div>
            </div>
            <p className="font-body-sm text-body-sm text-on-surface-variant">{card.note}</p>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-padding-card shadow-sm h-80">
        {loading ? (
          <div className="h-full flex items-center justify-center text-on-surface-variant text-body-sm">Yuklanmoqda...</div>
        ) : error ? (
          <div className="h-full flex items-center justify-center text-error text-body-sm">{error}</div>
        ) : chartData.length === 0 ? (
          <div className="h-full flex items-center justify-center text-on-surface-variant text-body-sm">Ma'lumot yo'q</div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 16, right: 16, left: 0, bottom: 16 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(60,74,66,0.08)" />
              <XAxis dataKey="name" tick={{ fill: "#3c4a42", fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#3c4a42", fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "rgba(60,74,66,0.04)" }} />
              <Bar dataKey="qiymat" fill="#10b981" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
