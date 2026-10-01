import { useMemo, useState } from "react";
import { Modal } from "../../components/shared/Modal";
import { Icon } from "../../components/shared/Icon";
import { usePageTitle } from "../../hooks/usePageTitle";
import { useAdminData } from "../../store/adminData";
import { useI18n } from "../../i18n";

export function ShopsPage() {
  const { t } = useI18n();
  usePageTitle(t("shops.title", {}, "Do'konlar"));
  const { shops, blockShop, unblockShop } = useAdminData();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [blockTarget, setBlockTarget] = useState(null);
  const [blockReason, setBlockReason] = useState("");

  const filtered = useMemo(
    () =>
      shops.filter((s) => {
        const q = search.toLowerCase();
        const matchSearch = [s.name, s.ownerName, s.ownerPhone].join(" ").toLowerCase().includes(q);
        const matchStatus =
          statusFilter === "all" ||
          (statusFilter === "blocked" ? s.isBlocked : !s.isBlocked);
        return matchSearch && matchStatus;
      }),
    [shops, search, statusFilter]
  );

  function openBlock(shop) {
    setBlockTarget(shop);
    setBlockReason("");
  }
  function closeBlock() {
    setBlockTarget(null);
    setBlockReason("");
  }

  async function confirmBlock() {
    await blockShop(blockTarget.id, blockReason);
    closeBlock();
  }

  return (
    <div className="space-y-section-gap">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h2 className="font-headline-md text-headline-md text-on-surface">{t("shops.title", {}, "Do'konlar")}</h2>
          <p className="text-on-surface-variant mt-1 text-body-sm">{t("shops.description", {}, "Tizimdagi barcha do'konlar ro'yxati va boshqaruvi.")}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-surface-bright border border-outline-variant rounded-xl p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]" />
          <input
            type="search"
            placeholder={t("shops.searchPlaceholder", {}, "Do'kon yoki egasini qidirish...")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-3 py-2 bg-surface-container-lowest border border-outline-variant rounded-lg text-on-surface text-body-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
          />
        </div>
        <div className="w-full md:w-auto flex items-center gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full md:w-48 px-4 py-2 bg-surface-container-lowest border border-outline-variant rounded-lg text-on-surface text-body-sm focus:outline-none focus:border-primary cursor-pointer"
          >
            <option value="all">{t("shops.allStatuses", {}, "Barcha holatlar")}</option>
            <option value="active">{t("shops.active", {}, "Faol")}</option>
            <option value="blocked">{t("shops.blocked", {}, "Bloklangan")}</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-outline-variant">
            <thead className="bg-surface-bright">
              <tr>
                {[
                  t("shops.tableShop", {}, "Do'kon"),
                  t("shops.tableOwner", {}, "Egasi"),
                  t("shops.tablePhone", {}, "Telefon"),
                  t("shops.tableProducts", {}, "Mahsulotlar"),
                  t("shops.tableCreated", {}, "Yaratilgan"),
                  t("shops.tableStatus", {}, "Holat"),
                  t("shops.tableActions", {}, "Amallar")
                ].map((h, i, arr) => (
                  <th
                    key={h}
                    className={`px-6 py-4 font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider ${i === arr.length - 1 ? "text-right" : "text-left"}`}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center">
                    <p className="text-on-surface-variant text-body-sm">{t("shops.noShops", {}, "Do'kon topilmadi")}</p>
                  </td>
                </tr>
              ) : (
                filtered.map((s) => (
                  <tr key={s.id} className="hover:bg-surface-container-lowest transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-surface-container text-on-surface-variant flex items-center justify-center font-bold text-xs shrink-0">
                          {s.name.slice(0, 2).toUpperCase()}
                        </div>
                        <span className="text-body-sm font-semibold text-on-surface">{s.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-body-sm text-on-surface whitespace-nowrap">{s.ownerName || "—"}</td>
                    <td className="px-6 py-4 text-body-sm text-on-surface whitespace-nowrap">{s.ownerPhone || "—"}</td>
                    <td className="px-6 py-4 text-body-sm text-on-surface-variant text-center">{s.productCount}</td>
                    <td className="px-6 py-4 text-body-sm text-on-surface-variant whitespace-nowrap">{s.createdAt || "—"}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2.5 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          s.isBlocked ? "bg-error-container text-on-error-container" : "bg-primary-container/20 text-on-primary-container"
                        }`}
                        title={s.isBlocked ? s.blockedReason : undefined}
                      >
                        {s.isBlocked ? t("shops.blocked", {}, "Bloklangan") : t("shops.active", {}, "Faol")}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-3">
                        <button
                          type="button"
                          onClick={() => (s.isBlocked ? unblockShop(s.id) : openBlock(s))}
                          className={`p-1 transition-colors ${s.isBlocked ? "text-primary hover:text-primary/70" : "text-on-surface-variant hover:text-error"}`}
                          title={s.isBlocked ? t("shops.unblockAction", {}, "Blokdan chiqarish") : t("shops.blockAction", {}, "Bloklash")}
                        >
                          <Icon name={s.isBlocked ? "lock_open" : "block"} className="text-xl" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="bg-surface-container-lowest px-6 py-3 border-t border-outline-variant text-body-sm text-on-surface-variant">
          {t("shops.totalCount", { count: filtered.length }, `Jami ${filtered.length} ta`)}
        </div>
      </div>

      {/* Block reason modal */}
      <Modal
        open={Boolean(blockTarget)}
        title={t("shops.blockModalTitle", {}, "Do'konni bloklash")}
        description={blockTarget ? `"${blockTarget.name}"` : ""}
        onClose={closeBlock}
        footer={
          <>
            <button type="button" onClick={closeBlock} className="px-5 py-2.5 text-body-sm border border-outline-variant rounded-lg hover:bg-surface-container-low text-on-surface">{t("shops.cancel", {}, "Bekor qilish")}</button>
            <button
              type="button"
              onClick={confirmBlock}
              className="px-5 py-2.5 bg-error text-on-error text-body-sm font-medium rounded-lg hover:bg-error/90"
            >
              {t("shops.blockAction", {}, "Bloklash")}
            </button>
          </>
        }
      >
        <div className="flex flex-col gap-1.5">
          <label className="text-body-sm font-medium text-on-surface">{t("shops.blockReasonLabel", {}, "Sabab (ixtiyoriy)")}</label>
          <textarea
            value={blockReason}
            onChange={(e) => setBlockReason(e.target.value)}
            rows={3}
            className="w-full px-4 py-2.5 bg-surface border border-outline-variant rounded-lg text-on-surface font-body-md focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
          />
        </div>
      </Modal>
    </div>
  );
}
