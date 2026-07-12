import { useMemo, useState } from "react";
import { Modal } from "../../components/shared/Modal";
import { Icon } from "../../components/shared/Icon";
import { usePageTitle } from "../../hooks/usePageTitle";
import { useAdminData } from "../../store/adminData";
import { useI18n } from "../../i18n";

const emptyProduct = { name: "", category: "", price: "", stock: "", sku: "" };

function formatPrice(p) {
  return Number(p).toLocaleString("uz-UZ") + " UZS";
}

function stockBadge(p) {
  if (p.status === "inactive") return { label: "Nofaol", cls: "bg-surface-variant text-on-surface-variant" };
  if (p.stock === 0) return { label: "Tugagan", cls: "bg-[#fee2e2] text-[#991b1b]" };
  if (p.stock <= 10) return { label: "Kam qolgan", cls: "bg-[#fef3c7] text-[#92400e]" };
  return { label: "Sotuvda", cls: "bg-[#ecfdf5] text-[#065f46]" };
}

function StatCard({ label, value, icon, wrap, valueCls = "text-on-surface" }) {
  return (
    <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-padding-card flex items-center justify-between">
      <div>
        <p className="font-body-sm text-on-surface-variant mb-1">{label}</p>
        <h3 className={`font-headline-md text-headline-md ${valueCls}`}>{value}</h3>
      </div>
      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${wrap}`}>
        <Icon name={icon} className="text-2xl" />
      </div>
    </div>
  );
}

export function ProductsPage() {
  const { t } = useI18n();
  usePageTitle(t("products.title", {}, "Mahsulotlar"));
  const { products, createProduct, updateProduct, deleteProduct, toggleProductStatus } = useAdminData();

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [form, setForm] = useState(emptyProduct);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const categories = useMemo(
    () => [...new Set(products.map((p) => p.category).filter(Boolean))],
    [products]
  );

  const filtered = products.filter((p) => {
    const matchSearch = !search ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku?.toLowerCase().includes(search.toLowerCase()) ||
      p.category?.toLowerCase().includes(search.toLowerCase());
    const matchCategory = categoryFilter === "all" || p.category === categoryFilter;
    const matchStatus = statusFilter === "all" || p.status === statusFilter;
    return matchSearch && matchCategory && matchStatus;
  });

  const activeCount = products.filter((p) => p.status === "active").length;
  const lowCount = products.filter((p) => typeof p.stock === "number" && p.stock <= 10).length;

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
    <div className="space-y-section-gap">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h2 className="font-headline-md text-headline-md text-on-surface">Mahsulotlar</h2>
          <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">Mahsulotlar katalogi va ombor boshqaruvi</p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="flex items-center gap-2 bg-primary-container text-on-primary-container font-semibold py-2.5 px-5 rounded-lg hover:bg-primary hover:text-on-primary transition-colors shadow-sm shrink-0"
        >
          <Icon name="add" />
          <span>Yangi mahsulot</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-element-gap">
        <StatCard label="Jami mahsulotlar" value={products.length} icon="inventory_2" wrap="bg-surface-container text-primary" />
        <StatCard label="Faol mahsulotlar" value={activeCount} icon="check_circle" wrap="bg-surface-container text-primary" />
        <StatCard label="Kam qolgan" value={lowCount} icon="warning" wrap="bg-error-container text-error" valueCls="text-error" />
      </div>

      {/* Table */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden flex flex-col">
        {/* Filters */}
        <div className="p-4 border-b border-outline-variant bg-surface-bright flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[220px]">
            <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]" />
            <input
              type="text"
              placeholder="Mahsulot nomi yoki SKU..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-surface border border-outline-variant text-on-surface font-body-sm rounded-lg pl-9 pr-4 py-2 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
            />
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-surface border border-outline-variant text-on-surface font-body-sm rounded-lg px-4 py-2 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary cursor-pointer"
          >
            <option value="all">Barcha kategoriyalar</option>
            {categories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-surface border border-outline-variant text-on-surface font-body-sm rounded-lg px-4 py-2 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary cursor-pointer"
          >
            <option value="all">Barcha holatlar</option>
            <option value="active">Sotuvda</option>
            <option value="inactive">Nofaol</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-bright font-label-caps text-label-caps text-on-surface-variant border-b border-outline-variant">
                <th className="py-3 px-6 w-16">Rasm</th>
                <th className="py-3 px-6">Nomi</th>
                <th className="py-3 px-6">Kategoriya</th>
                <th className="py-3 px-6 text-right">Narxi</th>
                <th className="py-3 px-6 text-center">Miqdori</th>
                <th className="py-3 px-6">Holati</th>
                <th className="py-3 px-6 text-right">Amallar</th>
              </tr>
            </thead>
            <tbody className="font-body-sm text-body-sm divide-y divide-outline-variant">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-on-surface-variant">Mahsulot topilmadi</td>
                </tr>
              ) : (
                filtered.map((p) => {
                  const badge = stockBadge(p);
                  return (
                    <tr key={p.id} className="hover:bg-surface-container-low transition-colors group">
                      <td className="py-3 px-6">
                        <div className="w-10 h-10 rounded-lg bg-surface-variant border border-outline-variant flex items-center justify-center text-on-surface-variant">
                          <Icon name="image" className="text-lg" />
                        </div>
                      </td>
                      <td className="py-3 px-6 font-medium text-on-surface">
                        {p.name}
                        {p.sku && <span className="block text-xs text-on-surface-variant font-normal">{p.sku}</span>}
                      </td>
                      <td className="py-3 px-6 text-on-surface-variant">{p.category || "—"}</td>
                      <td className="py-3 px-6 text-right font-medium text-on-surface whitespace-nowrap">{formatPrice(p.price)}</td>
                      <td className={`py-3 px-6 text-center ${p.stock === 0 ? "text-error font-semibold" : "text-on-surface-variant"}`}>{p.stock}</td>
                      <td className="py-3 px-6">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.cls}`}>{badge.label}</span>
                      </td>
                      <td className="py-3 px-6 text-right">
                        <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button type="button" onClick={() => openEdit(p)} className="text-on-surface-variant hover:text-primary" title="Tahrirlash">
                            <Icon name="edit" className="text-[20px]" />
                          </button>
                          <button
                            type="button"
                            onClick={() => toggleProductStatus(p.id)}
                            className="text-on-surface-variant hover:text-secondary"
                            title={p.status === "active" ? "Nofaol qilish" : "Yoqish"}
                          >
                            <Icon name={p.status === "active" ? "visibility_off" : "visibility"} className="text-[20px]" />
                          </button>
                          <button type="button" onClick={() => setDeleteTarget(p)} className="text-on-surface-variant hover:text-error" title="O'chirish">
                            <Icon name="delete" className="text-[20px]" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="p-4 border-t border-outline-variant bg-surface-bright flex items-center justify-between">
          <p className="font-body-sm text-on-surface-variant">{filtered.length} ta mahsulot ko'rsatilmoqda</p>
        </div>
      </div>

      {/* Create / Edit modal */}
      <Modal
        open={modalOpen}
        title={editTarget ? "Mahsulotni tahrirlash" : "Yangi mahsulot"}
        description="Mahsulot ma'lumotlarini kiriting"
        onClose={closeModal}
        footer={
          <>
            <button type="button" className="px-5 py-2.5 text-body-sm border border-outline-variant rounded-lg hover:bg-surface-container-low text-on-surface" onClick={closeModal}>
              Bekor qilish
            </button>
            <button type="submit" form="product-form" disabled={submitting} className="px-5 py-2.5 bg-primary-container text-on-primary-container text-body-sm font-medium rounded-lg hover:bg-primary hover:text-on-primary transition-colors disabled:opacity-60">
              {submitting ? "Saqlanmoqda..." : (editTarget ? "Saqlash" : "Qo'shish")}
            </button>
          </>
        }
      >
        <form id="product-form" className="space-y-4" onSubmit={handleSubmit}>
          {[
            { l: "Mahsulot nomi", n: "name", tp: "text", r: true },
            { l: "Kategoriya", n: "category", tp: "text", r: true },
            { l: "SKU", n: "sku", tp: "text", r: false },
            { l: "Narx (UZS)", n: "price", tp: "number", r: true },
            { l: "Ombor qoldig'i", n: "stock", tp: "number", r: true }
          ].map((f) => (
            <div key={f.n} className="flex flex-col gap-1.5">
              <label className="font-body-sm text-body-sm font-medium text-on-surface">{f.l}</label>
              <input
                name={f.n}
                type={f.tp}
                value={form[f.n]}
                onChange={handleChange}
                required={f.r}
                min={f.tp === "number" ? 0 : undefined}
                className="w-full px-4 py-2.5 bg-surface border border-outline-variant rounded-lg text-on-surface font-body-md focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>
          ))}
        </form>
      </Modal>

      {/* Delete confirm */}
      <Modal
        open={!!deleteTarget}
        title="Mahsulotni o'chirish"
        description={deleteTarget ? `"${deleteTarget.name}" mahsulotini o'chirasizmi?` : ""}
        onClose={() => setDeleteTarget(null)}
        footer={
          <>
            <button type="button" className="px-5 py-2.5 text-body-sm border border-outline-variant rounded-lg hover:bg-surface-container-low text-on-surface" onClick={() => setDeleteTarget(null)}>
              Bekor qilish
            </button>
            <button
              type="button"
              className="px-5 py-2.5 bg-error text-on-error text-body-sm font-medium rounded-lg hover:bg-error/90"
              onClick={() => { deleteProduct(deleteTarget.id); setDeleteTarget(null); }}
            >
              O'chirish
            </button>
          </>
        }
      >
        <p className="text-body-sm text-on-surface-variant">Bu amalni qaytarib bo'lmaydi. Mahsulot arxivlanishi mumkin.</p>
      </Modal>
    </div>
  );
}
