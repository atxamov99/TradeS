import { useState, useEffect } from "react";
import { useAuth } from "../../store";
import { useI18n } from "../../i18n";
import * as reportsApi from "../../api/reports.api";

const initialReportCards = [
  {
    titleKey: "seeds.reports.dailyActiveUsers.title",
    value: "4,284",
    noteKey: "seeds.reports.dailyActiveUsers.note",
    color: "from-slate-800 via-slate-700 to-slate-800"
  },
  {
    titleKey: "seeds.reports.weeklyRegistrations.title",
    value: "742",
    noteKey: "seeds.reports.weeklyRegistrations.note",
    color: "from-slate-800 via-slate-700 to-slate-800"
  },
  {
    titleKey: "seeds.reports.failedLogins.title",
    value: "19",
    noteKey: "seeds.reports.failedLogins.note",
    color: "from-slate-800 via-slate-700 to-slate-800"
  }
];

export function ReportsPage() {
  const { hasPermission } = useAuth();
  const { t } = useI18n();
  const [from, setFrom] = useState("2026-03-01");
  const [to, setTo] = useState("2026-03-30");
  const [type, setType] = useState("overview");
  const [cards, setCards] = useState(initialReportCards);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const formatNum = (value) => (typeof value === "number" ? value.toLocaleString() : value);

  const loadReports = async () => {
    setLoading(true);
    setError(null);
    try {
      let data;
      if (type === "admin-activity") {
        data = await reportsApi.getAdminActivity({ from, to });
      } else if (type === "security") {
        data = await reportsApi.getSecurity({ from, to });
      } else {
        data = await reportsApi.getOverview({ from, to });
      }

      setCards([
        {
          ...initialReportCards[0],
          value: formatNum(data.dailyActiveUsers ?? data.dailyActiveUsersCount ?? 4284)
        },
        {
          ...initialReportCards[1],
          value: formatNum(data.weeklyRegistrations ?? data.weeklyRegistrationsCount ?? 742)
        },
        {
          ...initialReportCards[2],
          value: formatNum(data.failedLogins ?? data.failedAttempts ?? 19)
        }
      ]);
    } catch (err) {
      setError(err?.message || "Serverdan ma'lumot olishda xato");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, [from, to, type]);

  return (
    <div className="space-y-5">
      <div className="bg-[#0e2037] rounded-2xl shadow-card border border-white/10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4 border-b border-white/10">
          <div>
            <h2 className="font-semibold text-white">{t("reports.title")}</h2>
            <p className="text-xs text-white/60 mt-0.5">{t("navigation.pageMeta.reports.eyebrow")}</p>
          </div>
          <div className="flex gap-2 shrink-0">
            {hasPermission("reports.export") && (
              <button type="button" className="px-4 py-2 text-sm border border-white/20 text-white/90 rounded-xl hover:bg-white/10 transition-colors">
                {t("common.exportCsv")}
              </button>
            )}
            <button type="button" onClick={loadReports} className="px-4 py-2 bg-primary hover:bg-primary-dark text-white text-sm font-medium rounded-xl transition-colors">
              {t("common.applyFilter")}
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 px-5 py-3 bg-slate-950/50 border-b border-white/10">
          <div className="flex items-center gap-1.5">
            <label className="text-xs text-gray-400">{t("common.from")}</label>
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-primary/20 bg-white"
            />
          </div>
          <div className="flex items-center gap-1.5">
            <label className="text-xs text-gray-400">{t("common.to")}</label>
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-primary/20 bg-white"
            />
          </div>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-primary/20 bg-white"
          >
            <option value="overview">{t("reports.overview")}</option>
            <option value="admin-activity">{t("reports.adminActivity")}</option>
            <option value="security">{t("reports.security")}</option>
          </select>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-5">
          {cards.map((card) => (
            <div key={card.titleKey} className={`bg-gradient-to-br ${card.color} rounded-2xl p-5 ring-1 ring-white/10 shadow-card`}>
              <p className="text-xs text-white/70 font-medium mb-2">{t(card.titleKey)}</p>
              <p className="text-3xl font-bold text-white">{card.value}</p>
              <p className="text-xs text-white/60 mt-2">{t(card.noteKey)}</p>
            </div>
          ))}
        </div>

        <div className="mx-5 mb-5 h-48 bg-slate-900/60 rounded-2xl flex items-center justify-center border border-white/10">
          <div className="text-center">
            {loading ? (
              <p className="text-white/70 text-sm">{t("common.loading") || "Yuklanmoqda..."}</p>
            ) : error ? (
              <p className="text-red-300 text-sm">{error}</p>
            ) : (
              <>
                <p className="text-white/70 text-sm">{t("reports.chartPlaceholder")}</p>
                <p className="text-white/50 text-xs mt-1">{t("reports.chartPlaceholderDescription")}</p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
