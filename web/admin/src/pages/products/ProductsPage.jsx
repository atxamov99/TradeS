import { useState } from "react";
import { Modal } from "../../components/shared/Modal";
import { usePageTitle } from "../../hooks/usePageTitle";
import { useAdminData } from "../../store/adminData";
import { useI18n } from "../../i18n";

const emptyProduct = { name: "", category: "", price: "", stock: "", sku: "" };

const STATUS_STYLES = {
  active: "bg-green-500/10 text-green-400",
  inactive: "bg-gray-500/10 text-gray-400"
};

function formatPrice(p) {
  return Number(p).toLocaleString("uz-UZ") + " so'm";
}

export function ProductsPage() {
  const { t } = useI18n();
  usePageTitle(t("products.title", {}, "Mahsulotlar"));
  const { products, createProduct, updateProduct, deleteProduct, toggleProductStatus } = useAdminData();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [form, setForm] = useState(emptyProduct);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const filtered = products.filter((p) => {
    const matchSearch = !search ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku?.toLowerCase().includes(search.toLowerCase()) ||
      p.category?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || p.status === statusFilter;
    return matchSearch && matchStatus;
  });

  function openCreate() {
    setEditTarget(null);
    setForm(emptyProduct);
    setModalOpen(true);
  }

  function openEdit(product) {
    setEditTarget(product);
    setForm({ name: product.name, category: product.category, price: product.price, stock: product.stock, sku: product.sku || "" });
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditTarget(null);
    setForm(emptyProduct);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const priceNum = Number(form.price);
      const stockNum = Number(form.stock);
      if (editTarget) {
        await updateProduct(editTarget.id, { ...form, price: priceNum, stock: stockNum });
      } else {
        // Backend requires buyPrice + sellPrice (POS fields). The admin catalog form
        // only captures the retail price, so map it to sellPrice; cost is unknown → 0.
        await createProduct({ ...form, price: priceNum, stock: stockNum, sellPrice: priceNum, buyPrice: 0 });
      }
      closeModal();
    } finally {
      setSubmitting(false);
    }
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((c) => ({ ...c, [name]: value }));
  }

  return (
    <div className="space-y-5">
      <div className="bg-[#0e2037] rounded-2xl shadow-card border border-white/10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4 border-b border-white/10">
          <div>
            <h2 className="font-semibold text-white">{t("products.title", {}, "Mahsulotlar")} ({filtered.length})</h2>
            <p className="text-xs text-white/60 mt-0.5">{t("products.description", {}, "Mahsulotlar katalogi va ombor boshqaruvi")}</p>
          </div>
          <button
            type="button"
            onClick={openCreate}
            className="px-4 py-2 bg-primary hover:bg-primary-dark text-white text-sm font-medium rounded-xl transition-colors shrink-0"
          >
            + {t("products.createProduct", {}, "Mahsulot qo'shish")}
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 px-5 py-3 border-b border-white/10">
          <input
            type="text"
            placeholder={t("products.searchPlaceholder", {}, "Nom, SKU yoki kategoriya...")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 min-w-[180px] px-3 py-1.5 text-sm border border-white/10 rounded-lg outline-none focus:ring-2 focus:ring-primary/20 bg-white/10 text-white placeholder-white/30"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 text-sm border border-white/10 rounded-lg bg-white/10 text-white outline-none"
          >
            <option value="all">{t("products.allStatuses", {}, "Barcha holat")}</option>
            <option value="active">{t("labels.statuses.active", {}, "Aktiv")}</option>
            <option value="inactive">{t("labels.statuses.inactive", {}, "Nofaol")}</option>
          </select>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10">
                {[t("products.product", {}, "Mahsulot"), t("products.sku", {}, "SKU"), t("products.category", {}, "Kategoriya"),
                 t("products.price", {}, "Narx"), t("products.stock", {}, "Qoldiq"), t("common.status"), t("common.actions")].map((h) => (
                  <th key={h} className="text-left px-5 py-3 text-xs font-medium text-white/50 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-white/40 text-sm">
                    {t("products.noProducts", {}, "Mahsulot topilmadi")}
                  </td>
                </tr>
              ) : (
                filtered.map((p) => (
                  <tr key={p.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="px-5 py-3">
                      <p className="font-medium text-white">{p.name}</p>
                      <p className="text-xs text-white/40">{p.id}</p>
                    </td>
                    <td className="px-5 py-3 text-white/60 font-mono text-xs">{p.sku || "—"}</td>
                    <td className="px-5 py-3 text-white/70">{p.category}</td>
                    <td className="px-5 py-3 text-white font-medium">{formatPrice(p.price)}</td>
                    <td className="px-5 py-3">
                      <span className={`font-medium ${p.stock === 0 ? "text-red-400" : "text-white/80"}`}>
                        {p.stock}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_STYLES[p.status] || "bg-gray-100 text-gray-600"}`}>
                        {p.status === "active" ? t("labels.statuses.active", {}, "Aktiv") : t("labels.statuses.inactive", {}, "Nofaol")}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => openEdit(p)}
                          className="text-xs text-primary hover:underline"
                        >
                          {t("common.edit")}
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleProductStatus(p.id)}
                          className="text-xs text-white/50 hover:text-white/80"
                        >
                          {p.status === "active" ? t("products.deactivate", {}, "Nofaol qilish") : t("products.activate", {}, "Yoqish")}
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(p)}
                          className="text-xs text-red-400 hover:text-red-300"
                        >
                          {t("common.delete")}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create / Edit modal */}
      <Modal
        open={modalOpen}
        title={editTarget ? t("products.editProduct", {}, "Mahsulotni tahrirlash") : t("products.newProduct", {}, "Yangi mahsulot")}
        description={t("products.formDescription", {}, "Mahsulot ma'lumotlarini kiriting")}
        onClose={closeModal}
        footer={
          <>
            <button type="button" className="px-4 py-2 text-sm border border-gray-200 rounded-xl hover:bg-gray-50" onClick={closeModal}>
              {t("common.cancel")}
            </button>
            <button type="submit" form="product-form" disabled={submitting} className="px-4 py-2 bg-primary text-white text-sm font-medium rounded-xl hover:bg-primary-dark disabled:opacity-60">
              {submitting ? t("common.saving", {}, "Saqlanmoqda...") : (editTarget ? t("common.save") : t("common.add", {}, "Qo'shish"))}
            </button>
          </>
        }
      >
        <form id="product-form" className="space-y-3" onSubmit={handleSubmit}>
          {[
            { l: t("products.name", {}, "Mahsulot nomi"), n: "name", t: "text", r: true },
            { l: t("products.category", {}, "Kategoriya"), n: "category", t: "text", r: true },
            { l: t("products.sku", {}, "SKU"), n: "sku", t: "text", r: false },
            { l: t("products.priceUzs", {}, "Narx (so'm)"), n: "price", t: "number", r: true },
            { l: t("products.stockCount", {}, "Ombor qoldig'i"), n: "stock", t: "number", r: true }
          ].map((f) => (
            <div key={f.n}>
              <label className="block text-sm font-medium text-gray-700 mb-1">{f.l}</label>
              <input
                name={f.n}
                type={f.t}
                value={form[f.n]}
                onChange={handleChange}
                required={f.r}
                min={f.t === "number" ? 0 : undefined}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
          ))}
        </form>
      </Modal>

      {/* Delete confirm modal */}
      <Modal
        open={!!deleteTarget}
        title={t("products.deleteTitle", {}, "Mahsulotni o'chirish")}
        description={deleteTarget ? `"${deleteTarget.name}" ${t("products.deleteDescription", {}, "mahsulotini o'chirishni tasdiqlaysizmi?")}` : ""}
        onClose={() => setDeleteTarget(null)}
        footer={
          <>
            <button type="button" className="px-4 py-2 text-sm border border-gray-200 rounded-xl hover:bg-gray-50" onClick={() => setDeleteTarget(null)}>
              {t("common.cancel")}
            </button>
            <button
              type="button"
              className="px-4 py-2 bg-danger text-white text-sm font-medium rounded-xl hover:bg-red-700"
              onClick={() => { deleteProduct(deleteTarget.id); setDeleteTarget(null); }}
            >
              {t("common.delete")}
            </button>
          </>
        }
      >
        <p className="text-sm text-gray-500">{t("products.deleteWarning", {}, "Bu amalni qaytarib bo'lmaydi.")}</p>
      </Modal>
    </div>
  );
}
