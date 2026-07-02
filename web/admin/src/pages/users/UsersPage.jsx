import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Modal } from "../../components/shared/Modal";
import { useAuth } from "../../store";
import { useAdminData } from "../../store/adminData";
import { useI18n } from "../../i18n";

const statusStyle = {
  active:  "bg-green-100 text-green-700",
  pending: "bg-yellow-100 text-yellow-700",
  blocked: "bg-red-100 text-red-700"
};

const empty = { name: "", email: "", phone: "", role: "USER", status: "active", password: "" };

export function UsersPage() {
  const { profile } = useAuth();
  const { users, admins, createUser, updateUser, toggleUserStatus, deleteUser, grantAdminToUser, revokeAdminFromUser, toggleAdminStatus } = useAdminData();
  const { t } = useI18n();
  const isPrimary = profile?.isPrimary;
  const [searchParams, setSearchParams] = useSearchParams();

  // URL ?tab=admins orqali admin tabini ochish (super admin uchun)
  const [activeTab, setActiveTab] = useState(() => {
    const tab = searchParams.get("tab");
    return tab === "admins" ? "admins" : "users";
  });

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab === "admins" || tab === "users") {
      setActiveTab(tab);
    }
  }, [searchParams]);

  function changeTab(tab) {
    setActiveTab(tab);
    if (tab === "admins") {
      setSearchParams({ tab: "admins" });
    } else {
      setSearchParams({});
    }
  }
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [form, setForm] = useState(empty);
  const [editId, setEditId] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [grantTarget, setGrantTarget] = useState(null);

  // Foydalanuvchilar — faqat role === "user" bo'lganlar (adminlar alohida tabda)
  const regularUsers = useMemo(
    () => users.filter((u) => u.role === "user" || (u.role !== "admin" && u.role !== "super_admin")),
    [users]
  );

  // Adminlar — admins state dan (ADMIN, SUPER_ADMIN rollar)
  const allAdmins = useMemo(() => {
    return admins.filter((a) => !a.isPrimary);
  }, [admins]);

  const filteredUsers = useMemo(
    () =>
      regularUsers.filter((u) => {
        const q = search.toLowerCase();
        const matchSearch = [u.name, u.email, u.phone].join(" ").toLowerCase().includes(q);
        const matchRole = roleFilter === "all" || u.role === roleFilter;
        const matchStatus = statusFilter === "all" || u.status === statusFilter;
        return matchSearch && matchRole && matchStatus;
      }),
    [regularUsers, search, roleFilter, statusFilter]
  );

  const filteredAdmins = useMemo(
    () =>
      allAdmins.filter((a) => {
        const q = search.toLowerCase();
        return [a.name, a.email].join(" ").toLowerCase().includes(q);
      }),
    [allAdmins, search]
  );

  function openCreate() { setEditId(null); setForm(empty); setModalOpen(true); }
  function openEdit(u) {
    setEditId(u.id);
    setForm({ name: u.name, email: u.email, phone: u.phone, role: u.role, status: u.status, password: "" });
    setModalOpen(true);
  }
  function closeModal() { setModalOpen(false); setEditId(null); setForm(empty); }

  function handleSubmit(e) {
    e.preventDefault();
    const payload = { ...form };
    if (!editId) {
      payload.role = "USER";
    }
    if (!payload.email) delete payload.email;
    if (!payload.phone) delete payload.phone;
    if (editId) {
      updateUser(editId, payload);
    } else {
      createUser(payload);
    }
    closeModal();
  }

  return (
    <div className="space-y-5">
      <div className="bg-white rounded-2xl shadow-card overflow-hidden">
        {/* Header + Tabs */}
        <div className="px-5 py-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="font-semibold text-gray-900">{t("users.title")}</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {activeTab === "users"
                ? t("navigation.pageMeta.users.eyebrow", {}, "Foydalanuvchilar va ularning huquqlari")
                : "Tizim adminlari ro'yxati va boshqaruvi"}
            </p>
          </div>
          <button
            type="button"
            onClick={openCreate}
            className="px-4 py-2 bg-primary hover:bg-primary-dark text-white text-sm font-medium rounded-xl transition-colors shrink-0"
          >
            + {t("users.createUser")}
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100 bg-gray-50/50 px-5">
          {[
            { id: "users",  label: `Foydalanuvchilar (${regularUsers.length})` },
            ...(isPrimary ? [{ id: "admins", label: `Adminlar (${allAdmins.length})` }] : [])
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => { changeTab(tab.id); setSearch(""); setRoleFilter("all"); setStatusFilter("all"); }}
              className={`px-4 py-3 text-sm border-b-2 -mb-px transition-colors ${
                activeTab === tab.id
                  ? "border-primary text-primary font-medium"
                  : "border-transparent text-gray-500 hover:text-gray-800"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 px-5 py-3 bg-gray-50 border-b border-gray-100">
          <input
            type="search"
            placeholder={t("users.searchPlaceholder")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 min-w-[160px] px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white"
          />
          {activeTab === "users" && (
            <>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-primary/20 bg-white"
              >
                <option value="all">{t("users.allRoles")}</option>
                <option value="manager">{t("labels.roles.manager")}</option>
                <option value="editor">{t("labels.roles.editor")}</option>
                <option value="viewer">{t("labels.roles.viewer")}</option>
                <option value="customer_support">{t("labels.roles.customer_support")}</option>
              </select>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-primary/20 bg-white"
              >
                <option value="all">{t("users.allStatuses")}</option>
                <option value="active">{t("labels.statuses.active")}</option>
                <option value="pending">{t("labels.statuses.pending")}</option>
                <option value="blocked">{t("labels.statuses.blocked")}</option>
              </select>
            </>
          )}
          <button
            type="button"
            onClick={() => { setSearch(""); setRoleFilter("all"); setStatusFilter("all"); }}
            className="px-3 py-2 text-xs text-gray-500 border border-gray-200 rounded-lg hover:bg-white transition-colors"
          >
            {t("common.clearFilters")}
          </button>
        </div>

        {/* Table — Users tab */}
        {activeTab === "users" && (
          <div className="table-scroll">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  {[t("users.tableUser"), t("users.tableRole"), t("users.tableStatus"), t("users.tableCreated"), t("users.tableLastLogin"),
                    ...(isPrimary ? [t("labels.roles.admin")] : []),
                    t("common.actions")
                  ].map((h) => (
                    <th key={h} className="text-left text-xs font-medium text-gray-400 px-4 py-3 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="border-b border-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-primary/10 text-primary font-semibold text-xs flex items-center justify-center shrink-0">
                          {u.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{u.name}</p>
                          <p className="text-xs text-gray-400">{u.email}</p>
                          <p className="text-xs text-gray-300">{u.phone}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full">
                        {t(`labels.roles.${u.role}`, {}, u.role)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusStyle[u.status] || "bg-gray-100 text-gray-600"}`}>
                        {t(`labels.statuses.${u.status}`, {}, u.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">{u.createdAt}</td>
                    <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">
                      {u.lastLogin || t("time.never")}
                    </td>

                    {isPrimary && (
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => setGrantTarget({ user: u, action: "grant" })}
                          className="text-xs text-primary hover:text-primary-dark font-medium transition-colors"
                        >
                          + Admin qilish
                        </button>
                      </td>
                    )}

                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Link to={`/users/${u.id}`} className="text-xs text-primary hover:underline">{t("common.view")}</Link>
                        <button type="button" onClick={() => openEdit(u)} className="text-xs text-gray-500 hover:text-gray-800">{t("common.edit")}</button>
                        <button
                          type="button"
                          onClick={() => toggleUserStatus(u.id)}
                          className={`text-xs ${u.status === "blocked" ? "text-green-600 hover:text-green-800" : "text-orange-500 hover:text-orange-700"}`}
                        >
                          {u.status === "blocked" ? t("users.unblock") : t("users.block")}
                        </button>
                        <button type="button" onClick={() => setDeleteTarget(u)} className="text-xs text-danger hover:text-red-700">{t("common.delete")}</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!filteredUsers.length && (
              <div className="py-16 text-center">
                <p className="text-gray-400 text-sm">{t("users.noUsers")}</p>
                <p className="text-gray-300 text-xs mt-1">{t("users.noUsersDescription")}</p>
              </div>
            )}
            <div className="px-5 py-3 border-t border-gray-100 text-xs text-gray-400">
              {filteredUsers.length} foydalanuvchi
            </div>
          </div>
        )}

        {/* Table — Admins tab */}
        {activeTab === "admins" && isPrimary && (
          <div className="table-scroll">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  {["Admin", "Email", "Status", "Oxirgi kirish", "Yaratilgan", "Amallar"].map((h) => (
                    <th key={h} className="text-left text-xs font-medium text-gray-400 px-4 py-3 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredAdmins.map((admin) => (
                  <tr key={admin.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-primary/10 text-primary font-semibold text-xs flex items-center justify-center shrink-0">
                          {admin.name.slice(0, 2).toUpperCase()}
                        </div>
                        <p className="font-medium text-gray-900">{admin.name}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">{admin.email}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusStyle[admin.status] || "bg-gray-100 text-gray-600"}`}>
                        {t(`labels.statuses.${admin.status}`, {}, admin.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">{admin.lastLogin || "—"}</td>
                    <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">{admin.createdAt || "—"}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => toggleAdminStatus(admin.id)}
                          className={`text-xs font-medium ${admin.status === "blocked" ? "text-green-600 hover:text-green-800" : "text-orange-500 hover:text-orange-700"}`}
                        >
                          {admin.status === "blocked" ? "Faollashtirish" : "Bloklash"}
                        </button>
                        <button
                          type="button"
                          onClick={() => setGrantTarget({ user: admin, action: "revoke" })}
                          className="text-xs text-danger hover:text-red-700"
                        >
                          Adminlikdan olish
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!filteredAdmins.length && (
              <div className="py-16 text-center">
                <p className="text-gray-400 text-sm">Hozircha boshqa adminlar yo'q</p>
                <p className="text-gray-300 text-xs mt-1">Foydalanuvchilar tabida "Admin qilish" orqali yangi admin qo'shing</p>
              </div>
            )}
            <div className="px-5 py-3 border-t border-gray-100 text-xs text-gray-400">
              {filteredAdmins.length} admin
            </div>
          </div>
        )}
      </div>

      {/* Create / Edit modal */}
      <Modal
        open={modalOpen}
        title={editId ? t("users.editUser") : t("users.createUserModal")}
        onClose={closeModal}
        footer={
          <>
            <button type="button" onClick={closeModal} className="px-4 py-2 text-sm border border-gray-200 rounded-xl hover:bg-gray-50">{t("common.cancel")}</button>
            <button type="submit" form="user-form" className="px-4 py-2 bg-primary text-white text-sm font-medium rounded-xl hover:bg-primary-dark">
              {editId ? t("common.saveChanges") : t("common.create")}
            </button>
          </>
        }
      >
        <form id="user-form" onSubmit={handleSubmit} className="space-y-3">
          {[
            { label: t("users.fullName"), name: "name", type: "text", required: true },
            { label: t("common.email") + " (ixtiyoriy)", name: "email", type: "email", required: false },
            { label: t("common.phone") + " (ixtiyoriy)", name: "phone", type: "text", required: false },
            { label: editId ? t("common.password") + " (bo'sh qoldirsangiz o'zgarmaydi)" : t("common.password") + " *", name: "password", type: "password", required: !editId }
          ].map((f) => (
            <div key={f.name}>
              <label className="block text-sm font-medium text-gray-700 mb-1">{f.label}</label>
              <input
                type={f.type}
                name={f.name}
                value={form[f.name] || ""}
                onChange={(e) => setForm((c) => ({ ...c, [e.target.name]: e.target.value }))}
                required={f.required}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
          ))}
          <p className="text-xs text-gray-400">* Email yoki telefon raqamdan kamida bittasi to'ldirilishi shart</p>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t("common.role")}</label>
            <select name="role" value={form.role} onChange={(e) => setForm((c) => ({ ...c, role: e.target.value }))}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 bg-white">
              <option value="viewer">{t("labels.roles.viewer")}</option>
              <option value="editor">{t("labels.roles.editor")}</option>
              <option value="manager">{t("labels.roles.manager")}</option>
              <option value="customer_support">{t("labels.roles.customer_support")}</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t("common.status")}</label>
            <select name="status" value={form.status} onChange={(e) => setForm((c) => ({ ...c, status: e.target.value }))}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 bg-white">
              <option value="active">{t("labels.statuses.active")}</option>
              <option value="pending">{t("labels.statuses.pending")}</option>
              <option value="blocked">{t("labels.statuses.blocked")}</option>
            </select>
          </div>
        </form>
      </Modal>

      {/* Delete confirm */}
      <Modal
        open={Boolean(deleteTarget)}
        title={t("users.deleteUser")}
        description={deleteTarget ? t("users.deleteUserConfirm", { name: deleteTarget.name }) : ""}
        onClose={() => setDeleteTarget(null)}
        footer={
          <>
            <button type="button" onClick={() => setDeleteTarget(null)} className="px-4 py-2 text-sm border border-gray-200 rounded-xl hover:bg-gray-50">{t("common.cancel")}</button>
            <button
              type="button"
              onClick={() => { deleteUser(deleteTarget.id); setDeleteTarget(null); }}
              className="px-4 py-2 bg-danger text-white text-sm font-medium rounded-xl hover:bg-red-700"
            >
              {t("common.delete")}
            </button>
          </>
        }
      >
        <p className="text-sm text-gray-500">{t("users.deleteUserDescription")}</p>
      </Modal>

      {/* Grant / Revoke admin confirm */}
      <Modal
        open={Boolean(grantTarget)}
        title={grantTarget?.action === "grant" ? "Admin huquqini berish" : "Admin huquqini olish"}
        description={grantTarget ? `"${grantTarget.user.name}"` : ""}
        onClose={() => setGrantTarget(null)}
        footer={
          <>
            <button type="button" onClick={() => setGrantTarget(null)} className="px-4 py-2 text-sm border border-gray-200 rounded-xl hover:bg-gray-50">{t("common.cancel")}</button>
            <button
              type="button"
              onClick={async () => {
                if (grantTarget.action === "grant") {
                  await grantAdminToUser(grantTarget.user.id);
                } else {
                  await revokeAdminFromUser(grantTarget.user.id);
                }
                setGrantTarget(null);
              }}
              className={`px-4 py-2 text-white text-sm font-medium rounded-xl transition-colors
                ${grantTarget?.action === "grant" ? "bg-primary hover:bg-primary-dark" : "bg-orange-500 hover:bg-orange-600"}`}
            >
              {grantTarget?.action === "grant" ? "Admin qilish" : "Adminlikdan olish"}
            </button>
          </>
        }
      >
        <p className="text-sm text-gray-500">
          {grantTarget?.action === "grant"
            ? "Ushbu foydalanuvchiga admin huquqi beriladi. U endi admin panelda barcha funksiyalardan foydalana oladi."
            : "Ushbu foydalanuvchidan admin huquqi olib tashlanadi va u oddiy foydalanuvchiga aylanadi."}
        </p>
      </Modal>
    </div>
  );
}
