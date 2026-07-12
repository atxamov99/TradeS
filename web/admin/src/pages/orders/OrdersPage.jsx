import { useMemo, useState } from "react";
import { usePageTitle } from "../../hooks/usePageTitle";
import { useI18n } from "../../i18n";
import { useAdminData } from "../../store/adminData";
import { Icon } from "../../components/shared/Icon";

const STATUS_BADGE = {
  pending:    "bg-[#FEF3C7] text-[#92400E]",
  processing: "bg-[#DBEAFE] text-[#1E40AF]",
  shipped:    "bg-[#F3E8FD] text-[#7B1FA2]",
  delivered:  "bg-[#D1FAE5] text-[#065F46]",
  cancelled:  "bg-[#FEE2E2] text-[#991B1B]"
};

const STATUS_LABELS = {
  pending: "Kutilmoqda",
  processing: "Jarayonda",
  shipped: "Yo'lda",
  delivered: "Yetkazildi",
  cancelled: "Bekor qilindi"
};

const PAYMENT_LABELS = {
  pending: "Kutilmoqda",
  paid: "To'langan",
  failed: "Muvaffaqiyatsiz",
  refunded: "Qaytarilgan"
};

const PAYMENT_DOT = {
  pending: "bg-outline-variant",
  paid: "bg-primary-container",
  failed: "bg-error",
  refunded: "bg-secondary"
};

const TABS = [
  { key: "all", label: "Hammasi" },
  { key: "pending", label: "Kutilmoqda" },
  { key: "processing", label: "Jarayonda" },
  { key: "delivered", label: "Yetkazildi" },
  { key: "cancelled", label: "Bekor qilindi" }
];

export function OrdersPage() {
  const { t } = useI18n();
  usePageTitle(t("orders.title", {}, "Buyurtmalar"));
  const { orders, loading, updateOrderStatus } = useAdminData();

  const [error, setError] = useState("");
  const [statusUpdating, setStatusUpdating] = useState(null);
  const [tab, setTab] = useState("all");
  const [search, setSearch] = useState("");

  const counts = useMemo(() => {
    const c = { all: orders.length };
    for (const o of orders) c[o.orderStatus] = (c[o.orderStatus] || 0) + 1;
    return c;
  }, [orders]);

  const filtered = useMemo(() => {
    return orders.filter((o) => {
      const matchTab = tab === "all" || o.orderStatus === tab;
      const q = search.toLowerCase();
      const matchSearch = !q ||
        (o.orderNumber || "").toLowerCase().includes(q) ||
        (o.user?.name || "").toLowerCase().includes(q);
      return matchTab && matchSearch;
    });
  }, [orders, tab, search]);

  async function handleStatusChange(id, newStatus) {
    setStatusUpdating(id);
    const order = orders.find((o) => o.id === id);
    try {
      await updateOrderStatus(id, { orderStatus: newStatus, paymentStatus: order ? order.paymentStatus : undefined });
    } catch (err) {
      setError("Statusni yangilashda xatolik: " + err.message);
    } finally {
      setStatusUpdating(null);
    }
  }

  async function handlePaymentStatusChange(id, newPaymentStatus) {
    setStatusUpdating(id);
    const order = orders.find((o) => o.id === id);
    try {
      await updateOrderStatus(id, { orderStatus: order ? order.orderStatus : "pending", paymentStatus: newPaymentStatus });
    } catch (err) {
      setError("To'lov holatini yangilashda xatolik: " + err.message);
    } finally {
      setStatusUpdating(null);
    }
  }

  return (
    <div className="space-y-section-gap">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="font-headline-md text-headline-md font-bold text-on-surface">Buyurtmalar</h2>
          <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">Barcha mijozlar buyurtmalarini boshqarish va kuzatish</p>
        </div>
        <div className="relative w-full md:w-72">
          <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]" />
          <input
            type="text"
            placeholder="ID yoki mijoz..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-surface-container-lowest border border-outline-variant rounded-lg text-body-sm text-on-surface focus:outline-none focus:border-primary transition-all"
          />
        </div>
      </div>

      {error && <div className="px-4 py-3 rounded-lg bg-error-container text-on-error-container text-body-sm">{error}</div>}

      {/* Status tabs */}
      <div className="border-b border-outline-variant overflow-x-auto">
        <ul className="flex gap-6 min-w-max px-1">
          {TABS.map((tb) => (
            <li key={tb.key}>
              <button
                type="button"
                onClick={() => setTab(tb.key)}
                className={`pb-3 px-1 font-body-sm transition-colors ${
                  tab === tb.key ? "text-primary font-bold border-b-2 border-primary" : "text-on-surface-variant hover:text-primary"
                }`}
              >
                {tb.label} ({counts[tb.key] || 0})
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* Table */}
      <div className="bg-surface-bright border border-outline-variant rounded-xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-12 text-center text-on-surface-variant">Yuklanmoqda...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-bright border-b border-outline-variant font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider">
                  <th className="py-4 px-6">ID</th>
                  <th className="py-4 px-6">Mijoz</th>
                  <th className="py-4 px-6">Sana</th>
                  <th className="py-4 px-6 text-right">Summa</th>
                  <th className="py-4 px-6">To'lov holati</th>
                  <th className="py-4 px-6">Buyurtma holati</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant bg-surface-container-lowest">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-on-surface-variant">Buyurtmalar topilmadi</td>
                  </tr>
                ) : (
                  filtered.map((o) => {
                    const name = o.user?.name || "Noma'lum";
                    return (
                      <tr key={o.id} className="hover:bg-surface-container-low transition-colors">
                        <td className="py-4 px-6 font-body-sm font-semibold text-on-surface whitespace-nowrap">{o.orderNumber}</td>
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center font-bold text-xs shrink-0">
                              {name.slice(0, 2).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <span className="font-body-sm text-on-surface font-medium block">{name}</span>
                              <span className="text-xs text-on-surface-variant">{o.user?.phone || o.user?.email || ""}</span>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6 font-body-sm text-on-surface-variant whitespace-nowrap">
                          {o.createdAt ? new Date(o.createdAt).toLocaleString("uz-UZ") : "—"}
                        </td>
                        <td className="py-4 px-6 font-body-sm font-semibold text-on-surface text-right whitespace-nowrap">
                          {Number(o.totalPrice).toLocaleString("uz-UZ")} UZS
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${PAYMENT_DOT[o.paymentStatus] || "bg-outline-variant"}`} />
                            <select
                              disabled={statusUpdating === o.id}
                              value={o.paymentStatus}
                              onChange={(e) => handlePaymentStatusChange(o.id, e.target.value)}
                              className="font-body-sm text-on-surface bg-transparent border-none focus:outline-none cursor-pointer"
                            >
                              {Object.entries(PAYMENT_LABELS).map(([val, label]) => (
                                <option key={val} value={val}>{label}</option>
                              ))}
                            </select>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <select
                            disabled={statusUpdating === o.id}
                            value={o.orderStatus}
                            onChange={(e) => handleStatusChange(o.id, e.target.value)}
                            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border-none focus:outline-none cursor-pointer ${STATUS_BADGE[o.orderStatus] || "bg-surface-variant text-on-surface-variant"}`}
                          >
                            {Object.entries(STATUS_LABELS).map(([val, label]) => (
                              <option key={val} value={val}>{label}</option>
                            ))}
                          </select>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
        <div className="bg-surface-bright px-6 py-4 border-t border-outline-variant">
          <span className="font-body-sm text-on-surface-variant">{filtered.length} ta buyurtma ko'rsatilmoqda</span>
        </div>
      </div>
    </div>
  );
}
