import { useEffect, useState } from "react";
import { usePageTitle } from "../../hooks/usePageTitle";
import { useI18n } from "../../i18n";
import { useAdminData } from "../../store/adminData";
import { ordersApi } from "../../services/api/orders.api";

const STATUS_COLORS = {
  pending: "bg-yellow-500/10 text-yellow-500",
  processing: "bg-blue-500/10 text-blue-500",
  shipped: "bg-purple-500/10 text-purple-400",
  delivered: "bg-green-500/10 text-green-500",
  cancelled: "bg-red-500/10 text-red-500"
};

const PAYMENT_COLORS = {
  pending: "text-yellow-500",
  paid: "text-green-500",
  failed: "text-red-500",
  refunded: "text-blue-400"
};

const STATUS_LABELS = {
  pending: "Kutilmoqda",
  processing: "Tayyorlanmoqda",
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

export function OrdersPage() {
  const { t } = useI18n();
  usePageTitle(t("orders.title", {}, "Buyurtmalar"));
  const { orders, loading, updateOrderStatus } = useAdminData();

  const [error, setError] = useState("");
  const [statusUpdating, setStatusUpdating] = useState(null);

  async function handleStatusChange(id, newStatus) {
    setStatusUpdating(id);
    const order = orders.find(o => o.id === id);
    try {
      await updateOrderStatus(id, {
        orderStatus: newStatus,
        paymentStatus: order ? order.paymentStatus : undefined
      });
    } catch (err) {
      setError("Statusni yangilashda xatolik: " + err.message);
    } finally {
      setStatusUpdating(null);
    }
  }

  async function handlePaymentStatusChange(id, newPaymentStatus) {
    setStatusUpdating(id);
    const order = orders.find(o => o.id === id);
    try {
      await updateOrderStatus(id, {
        orderStatus: order ? order.orderStatus : "pending",
        paymentStatus: newPaymentStatus
      });
    } catch (err) {
      setError("To'lov holatini yangilashda xatolik: " + err.message);
    } finally {
      setStatusUpdating(null);
    }
  }

  return (
    <div className="space-y-5">
      <div className="bg-[#0e2037] rounded-2xl shadow-card border border-white/10 overflow-hidden">
        <div className="px-5 py-4 border-b border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="font-semibold text-white">{t("orders.title", {}, "Buyurtmalar")} ({orders.length})</h2>
            <p className="text-xs text-white/60 mt-0.5">{t("orders.description", {}, "Barcha mijozlar buyurtmalari boshqaruvi")}</p>
          </div>
          {error && <p className="text-xs text-red-400">{error}</p>}
        </div>

        {loading ? (
          <div className="p-10 text-center text-white/50">{t("common.loading", {}, "Yuklanmoqda...")}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 bg-white/5">
                  <th className="text-left px-5 py-3 text-xs font-medium text-white/50 uppercase">{t("orders.orderNumber", {}, "Buyurtma №")}</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-white/50 uppercase">{t("orders.customer", {}, "Mijoz")}</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-white/50 uppercase">{t("orders.date", {}, "Sana")}</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-white/50 uppercase">{t("orders.paymentStatus", {}, "To'lov holati")}</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-white/50 uppercase">{t("orders.amount", {}, "Summa")}</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-white/50 uppercase">{t("orders.orderStatus", {}, "Buyurtma holati")}</th>
                </tr>
              </thead>
              <tbody>
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-10 text-center text-white/40">{t("orders.noOrders", {}, "Buyurtmalar topilmadi")}</td>
                  </tr>
                ) : (
                  orders.map((o) => (
                    <tr key={o.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="px-5 py-3 font-medium text-white">{o.orderNumber}</td>
                      <td className="px-5 py-3">
                        <p className="text-white">{o.user?.name || "Noma'lum"}</p>
                        <p className="text-xs text-white/50">{o.user?.phone || o.user?.email || ""}</p>
                      </td>
                      <td className="px-5 py-3 text-white/70">
                        {new Date(o.createdAt).toLocaleString("uz-UZ")}
                      </td>
                      <td className="px-5 py-3">
                        <select
                          disabled={statusUpdating === o.id}
                          value={o.paymentStatus}
                          onChange={(e) => handlePaymentStatusChange(o.id, e.target.value)}
                          className={`text-xs font-semibold px-2 py-1 rounded-md outline-none bg-slate-800/80 border border-white/10 cursor-pointer transition-colors ${PAYMENT_COLORS[o.paymentStatus] || "text-white/60"}`}
                        >
                          {Object.entries(PAYMENT_LABELS).map(([val, label]) => (
                            <option key={val} value={val} className="bg-[#0e2037]">{label}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-5 py-3 font-bold text-white">
                        {Number(o.totalPrice).toLocaleString("uz-UZ")} so'm
                      </td>
                      <td className="px-5 py-3">
                        <select
                          disabled={statusUpdating === o.id}
                          value={o.orderStatus}
                          onChange={(e) => handleStatusChange(o.id, e.target.value)}
                          className={`text-xs font-medium px-2.5 py-1 rounded-full outline-none appearance-none cursor-pointer border border-transparent hover:border-white/20 transition-colors ${STATUS_COLORS[o.orderStatus] || "bg-gray-100 text-gray-600"}`}
                        >
                          {Object.entries(STATUS_LABELS).map(([val, label]) => (
                            <option key={val} value={val} className="bg-[#0e2037] text-white">{label}</option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
