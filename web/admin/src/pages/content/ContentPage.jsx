import { useMemo, useState } from "react";
import { Modal } from "../../components/shared/Modal";
import { Icon } from "../../components/shared/Icon";
import { useAdminData } from "../../store/adminData";
import { useAuth } from "../../store";
import { useI18n } from "../../i18n";

const statusStyle = {
  published: { label: "Nashr etilgan", cls: "bg-green-100 text-green-800 border border-green-200", dot: "bg-green-500" },
  draft:     { label: "Qoralama",      cls: "bg-gray-100 text-gray-800 border border-gray-200",   dot: "bg-gray-500" },
  archived:  { label: "Arxiv",         cls: "bg-yellow-100 text-yellow-800 border border-yellow-200", dot: "bg-yellow-500" }
};

const typeStyle = {
  landing_page:   { label: "Landing",      cls: "bg-blue-100 text-blue-800 border border-blue-200" },
  knowledge_base: { label: "Bilim bazasi", cls: "bg-purple-100 text-purple-800 border border-purple-200" },
  media_asset:    { label: "Media",        cls: "bg-orange-100 text-orange-800 border border-orange-200" }
};

const empty = { name: "", type: "landing_page", status: "draft", owner: "", body: "" };

export function ContentPage() {
  const { contentRows, createContent, updateContentStatus, deleteContent } = useAdminData();
  const { profile } = useAuth();
  const { t } = useI18n();
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(empty);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [submitting, setSubmitting] = useState(false);

  const filtered = useMemo(() => {
    return contentRows.filter((row) => {
      const q = search.toLowerCase();
      const matchSearch = !q || [row.name, row.owner].join(" ").toLowerCase().includes(q);
      const matchStatus = statusFilter === "all" || row.status === statusFilter;
      const matchType = typeFilter === "all" || row.type === typeFilter;
      return matchSearch && matchStatus && matchType;
    });
  }, [contentRows, search, statusFilter, typeFilter]);

  const publishedCount = contentRows.filter((r) => r.status === "published").length;
  const draftCount = contentRows.filter((r) => r.status === "draft").length;

  function closeModal() {
    setModalOpen(false);
    setForm(empty);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await createContent({ ...form, owner: form.owner || profile?.name || "Admin" });
      closeModal();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-section-gap">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h2 className="font-headline-md text-headline-md text-on-surface">Kontent</h2>
          <p className="text-on-surface-variant font-body-sm text-body-sm mt-1">
            Platforma uchun maqolalar, sahifalar va media resurslarni boshqarish
          </p>
        </div>
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-on-primary font-medium px-5 py-2.5 rounded-lg transition-colors shadow-sm shrink-0"
        >
          <Icon name="add" className="text-[20px]" />
          Yangi kontent
        </button>
      </div>

      {/* Filters */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 flex flex-col md:flex-row gap-4 items-center justify-between shadow-sm">
        <div className="relative w-full md:w-96">
          <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]" />
          <input
            type="search"
            placeholder="Kontent qidirish..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-surface border border-outline-variant rounded-lg font-body-sm text-on-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
          />
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="w-full md:w-auto bg-surface border border-outline-variant rounded-lg px-4 py-2 font-body-sm text-on-surface focus:outline-none focus:border-primary cursor-pointer"
          >
            <option value="all">Barcha turlar</option>
            <option value="landing_page">Landing</option>
            <option value="knowledge_base">Bilim bazasi</option>
            <option value="media_asset">Media</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full md:w-auto bg-surface border border-outline-variant rounded-lg px-4 py-2 font-body-sm text-on-surface focus:outline-none focus:border-primary cursor-pointer"
          >
            <option value="all">Barcha holatlar</option>
            <option value="draft">Qoralama</option>
            <option value="published">Nashr etilgan</option>
            <option value="archived">Arxiv</option>
          </select>
        </div>
      </div>

      {/* Bento grid: table + side stats */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden shadow-sm flex flex-col">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-outline-variant bg-surface-bright font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider">
                  <th className="py-4 px-6 font-semibold">Nomi</th>
                  <th className="py-4 px-6 font-semibold">Tur</th>
                  <th className="py-4 px-6 font-semibold">Holat</th>
                  <th className="py-4 px-6 font-semibold">Muallif</th>
                  <th className="py-4 px-6 font-semibold hidden md:table-cell">Yangilangan</th>
                  <th className="py-4 px-6 font-semibold text-right">Amallar</th>
                </tr>
              </thead>
              <tbody className="font-body-sm text-body-sm text-on-surface divide-y divide-outline-variant">
                {filtered.length === 0 ? (
                  <tr><td colSpan={6} className="py-12 text-center text-on-surface-variant">Kontent topilmadi</td></tr>
                ) : (
                  filtered.map((row) => {
                    const ts = typeStyle[row.type] || { label: row.type, cls: "bg-surface-variant text-on-surface" };
                    const ss = statusStyle[row.status] || { label: row.status, cls: "bg-surface-variant text-on-surface", dot: "bg-outline" };
                    return (
                      <tr key={row.id} className="hover:bg-surface-container-low transition-colors group">
                        <td className="py-4 px-6 font-medium">{row.name}</td>
                        <td className="py-4 px-6">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${ts.cls}`}>{ts.label}</span>
                        </td>
                        <td className="py-4 px-6">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${ss.cls}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${ss.dot}`} />
                            {ss.label}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-on-surface-variant">{row.owner || "—"}</td>
                        <td className="py-4 px-6 text-on-surface-variant hidden md:table-cell whitespace-nowrap">{row.updatedAt || "—"}</td>
                        <td className="py-4 px-6 text-right">
                          <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            {row.status !== "published" && (
                              <button type="button" onClick={() => updateContentStatus(row.id, "published")} className="p-1.5 text-on-surface-variant hover:text-primary transition-colors" title="Nashr etish">
                                <Icon name="publish" className="text-[20px]" />
                              </button>
                            )}
                            {row.status !== "archived" && (
                              <button type="button" onClick={() => updateContentStatus(row.id, "archived")} className="p-1.5 text-on-surface-variant hover:text-secondary transition-colors" title="Arxivlash">
                                <Icon name="archive" className="text-[20px]" />
                              </button>
                            )}
                            <button type="button" onClick={() => setDeleteTarget(row)} className="p-1.5 text-on-surface-variant hover:text-error transition-colors" title="O'chirish">
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
          <div className="mt-auto border-t border-outline-variant p-4 bg-surface-container-lowest">
            <span className="font-body-sm text-body-sm text-on-surface-variant">Jami {contentRows.length} ta natijadan {filtered.length} ko'rsatilmoqda</span>
          </div>
        </div>

        {/* Side stats */}
        <div className="flex flex-col gap-6">
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 shadow-sm relative overflow-hidden">
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-primary-container/20 rounded-full blur-2xl" />
            <div className="flex justify-between items-start mb-4 relative z-10">
              <h3 className="font-title-sm text-title-sm text-on-surface-variant">Nashr etilganlar</h3>
              <span className="p-2 bg-primary-container/10 rounded-lg text-primary-container"><Icon name="publish" /></span>
            </div>
            <div className="relative z-10">
              <span className="font-display-lg text-display-lg text-on-surface">{publishedCount}</span>
            </div>
          </div>
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 shadow-sm relative overflow-hidden">
            <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-secondary-container/20 rounded-full blur-2xl" />
            <div className="flex justify-between items-start mb-4 relative z-10">
              <h3 className="font-title-sm text-title-sm text-on-surface-variant">Qoralamalar</h3>
              <span className="p-2 bg-secondary-container/10 rounded-lg text-secondary-container"><Icon name="draft" /></span>
            </div>
            <div className="relative z-10">
              <span className="font-display-lg text-display-lg text-on-surface">{draftCount}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Create modal */}
      <Modal
        open={modalOpen}
        title="Yangi kontent yaratish"
        size="lg"
        onClose={closeModal}
        footer={
          <>
            <button type="button" onClick={closeModal} className="px-5 py-2.5 text-body-sm border border-outline-variant rounded-lg hover:bg-surface-container-low text-on-surface">Bekor qilish</button>
            <button type="submit" form="content-form" disabled={submitting} className="px-5 py-2.5 bg-primary text-on-primary text-body-sm font-medium rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-60">
              {submitting ? "Saqlanmoqda..." : "Saqlash"}
            </button>
          </>
        }
      >
        <form id="content-form" onSubmit={handleSubmit} className="space-y-5">
          <div className="flex flex-col gap-1.5">
            <label className="font-body-sm text-body-sm font-medium text-on-surface">Nom</label>
            <input
              type="text"
              name="name"
              value={form.name}
              required
              onChange={(e) => setForm((c) => ({ ...c, name: e.target.value }))}
              placeholder="Masalan: Qanday qilib xarid qilish mumkin?"
              className="w-full px-4 py-2.5 bg-surface border border-outline-variant rounded-lg text-on-surface font-body-md focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="flex flex-col gap-1.5">
              <label className="font-body-sm text-body-sm font-medium text-on-surface">Tur</label>
              <select
                value={form.type}
                onChange={(e) => setForm((c) => ({ ...c, type: e.target.value }))}
                className="w-full bg-surface border border-outline-variant rounded-lg px-4 py-2.5 text-on-surface font-body-md focus:outline-none focus:border-primary cursor-pointer"
              >
                <option value="landing_page">Landing</option>
                <option value="knowledge_base">Bilim bazasi</option>
                <option value="media_asset">Media</option>
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="font-body-sm text-body-sm font-medium text-on-surface">Holat</label>
              <select
                value={form.status}
                onChange={(e) => setForm((c) => ({ ...c, status: e.target.value }))}
                className="w-full bg-surface border border-outline-variant rounded-lg px-4 py-2.5 text-on-surface font-body-md focus:outline-none focus:border-primary cursor-pointer"
              >
                <option value="draft">Qoralama</option>
                <option value="published">Nashr etilgan</option>
                <option value="archived">Arxiv</option>
              </select>
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="font-body-sm text-body-sm font-medium text-on-surface flex justify-between">
              Matn
              <span className="text-on-surface-variant font-normal text-xs">Markdown qo'llab-quvvatlanadi</span>
            </label>
            <textarea
              name="body"
              rows={6}
              value={form.body}
              onChange={(e) => setForm((c) => ({ ...c, body: e.target.value }))}
              placeholder="Kontent matnini bu yerga kiriting..."
              className="w-full px-4 py-3 bg-surface border border-outline-variant rounded-lg text-on-surface font-body-md focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all resize-y"
            />
          </div>
        </form>
      </Modal>

      {/* Delete confirm */}
      <Modal
        open={Boolean(deleteTarget)}
        title="Kontentni o'chirish"
        description={deleteTarget?.name}
        onClose={() => setDeleteTarget(null)}
        footer={
          <>
            <button type="button" onClick={() => setDeleteTarget(null)} className="px-5 py-2.5 text-body-sm border border-outline-variant rounded-lg hover:bg-surface-container-low text-on-surface">Bekor qilish</button>
            <button
              type="button"
              onClick={() => { deleteContent(deleteTarget.id); setDeleteTarget(null); }}
              className="px-5 py-2.5 bg-error text-on-error text-body-sm font-medium rounded-lg hover:bg-error/90"
            >
              O'chirish
            </button>
          </>
        }
      >
        <p className="text-body-sm text-on-surface-variant">Bu amalni qaytarib bo'lmaydi.</p>
      </Modal>
    </div>
  );
}
