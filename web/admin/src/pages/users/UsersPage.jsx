import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import { Modal } from "../../components/shared/Modal";
import { Icon } from "../../components/shared/Icon";
import { useAuth } from "../../store";
import { useAdminData } from "../../store/adminData";
import { useI18n } from "../../i18n";

const statusStyle = {
  active:  "bg-primary-container/20 text-on-primary-container",
  pending: "bg-[#fef3c7] text-[#92400e]",
  blocked: "bg-error-container text-on-error-container"
};

const roleStyle = {
  super_admin: "bg-secondary-fixed text-on-secondary-fixed",
  admin: "bg-surface-variant text-on-surface",
  user: "bg-[#E5E7EB] text-[#4B5563]"
};

const empty = { name: "", email: "", phone: "", role: "USER", status: "active", password: "" };

export function UsersPage() {
  const { profile } = useAuth();
  const { users, admins, createUser, updateUser, toggleUserStatus, deleteUser, grantAdminToUser, revokeAdminFromUser, toggleAdminStatus, updateAdmin } = useAdminData();
  const { t } = useI18n();
  const isPrimary = profile?.isPrimary;
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const isAdminsRoute = location.pathname === "/admins" || searchParams.get("tab") === "admins";
  const [activeTab, setActiveTab] = useState(() => (isAdminsRoute ? "admins" : "users"));

  useEffect(() => {
    setActiveTab(isAdminsRoute ? "admins" : "users");
  }, [isAdminsRoute]);

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [form, setForm] = useState(empty);
  const [editId, setEditId] = useState(null);
  const [editingAdmin, setEditingAdmin] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [grantTarget, setGrantTarget] = useState(null);

  const regularUsers = useMemo(
    () => users.filter((u) => u.role === "user" || (u.role !== "admin" && u.role !== "super_admin")),
    [users]
  );
  const allAdmins = useMemo(() => admins.filter((a) => !a.isPrimary), [admins]);

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
    () => allAdmins.filter((a) => [a.name, a.phone].join(" ").toLowerCase().includes(search.toLowerCase())),
    [allAdmins, search]
  );

  function openCreate() { setEditId(null); setEditingAdmin(false); setForm(empty); setModalOpen(true); }
  function openEdit(u) {
    setEditId(u.id);
    setEditingAdmin(false);
    setForm({ name: u.name, email: u.email, phone: u.phone, role: u.role, status: u.status, password: "" });
    setModalOpen(true);
  }
  function openEditAdmin(a) {
    setEditId(a.id);
    setEditingAdmin(true);
    setForm({ name: a.name, email: a.email, phone: a.phone, role: a.role, status: a.status, password: "" });
    setModalOpen(true);
  }
  function closeModal() { setModalOpen(false); setEditId(null); setEditingAdmin(false); setForm(empty); }

  function handleSubmit(e) {
    e.preventDefault();
    const payload = { ...form };
    if (!payload.email) delete payload.email;
    if (!payload.phone) delete payload.phone;
    if (!payload.password) delete payload.password;
    if (editingAdmin) {
      // Keep the ADMIN role — don't demote when editing an admin's profile.
      delete payload.role;
      updateAdmin(editId, payload);
    } else {
      // Regular-user form: role is always USER (admin rights granted separately).
      payload.role = "USER";
      if (editId) updateUser(editId, payload);
      else createUser(payload);
    }
    closeModal();
  }

  const isAdminsTab = activeTab === "admins" && isPrimary;
  const rows = isAdminsTab ? filteredAdmins : filteredUsers;

  return (
    <div className="space-y-section-gap">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h2 className="font-headline-md text-headline-md text-on-surface">
            {isAdminsTab ? t("admins.title", {}, "Adminlar") : t("users.title", {}, "Foydalanuvchilar")}
          </h2>
          <p className="text-on-surface-variant mt-1 text-body-sm">
            {isAdminsTab ? t("admins.listDescription", {}, "Tizim adminlari ro'yxati va boshqaruvi") : t("users.listDescriptionUsers", {}, "Tizimdagi barcha foydalanuvchilar ro'yxati va ularning huquqlari.")}
          </p>
        </div>
        {!isAdminsTab && (
          <button
            type="button"
            onClick={openCreate}
            className="flex items-center gap-2 bg-primary-container hover:bg-primary text-on-primary-container hover:text-on-primary transition-colors rounded-lg py-2.5 px-5 font-semibold shadow-sm shrink-0"
          >
            <Icon name="add" className="text-[20px]" />
            {t("users.createUserButton", {}, "Yangi foydalanuvchi")}
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="bg-surface-bright border border-outline-variant rounded-xl p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]" />
          <input
            type="search"
            placeholder={isAdminsTab ? t("admins.searchPlaceholder", {}, "Admin qidirish...") : t("users.searchUsersPlaceholder", {}, "Foydalanuvchini qidirish...")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-3 py-2 bg-surface-container-lowest border border-outline-variant rounded-lg text-on-surface text-body-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
          />
        </div>
        {!isAdminsTab && (
          <div className="w-full md:w-auto flex items-center gap-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full md:w-48 px-4 py-2 bg-surface-container-lowest border border-outline-variant rounded-lg text-on-surface text-body-sm focus:outline-none focus:border-primary cursor-pointer"
            >
              <option value="all">{t("users.allStatuses", {}, "Barcha holatlar")}</option>
              <option value="active">{t("users.statusActive", {}, "Faol")}</option>
              <option value="pending">{t("users.statusPending", {}, "Kutilmoqda")}</option>
              <option value="blocked">{t("users.statusBlocked", {}, "Bloklangan")}</option>
            </select>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-outline-variant">
            <thead className="bg-surface-bright">
              <tr>
                {(isAdminsTab
                  ? [t("admins.adminColumn", {}, "Admin"), t("admins.tablePhone", {}, "Telefon"), t("common.status", {}, "Holat"), t("admins.tableCreated", {}, "Yaratilgan"), t("admins.tableActions", {}, "Amallar")]
                  : [t("users.tableUser", {}, "Foydalanuvchi"), t("users.tablePhone", {}, "Telefon"), t("users.tableRole", {}, "Rol"), t("users.tableStatus", {}, "Holat"), t("users.tableRegistered", {}, "Ro'yxatdan o'tgan"), t("users.tableActionsHeader", {}, "Amallar")]
                ).map((h, i, arr) => (
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
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={isAdminsTab ? 5 : 6} className="py-16 text-center">
                    <p className="text-on-surface-variant text-body-sm">{isAdminsTab ? t("admins.noAdminsFound", {}, "Hozircha boshqa adminlar yo'q") : t("users.noUsersFound", {}, "Foydalanuvchi topilmadi")}</p>
                  </td>
                </tr>
              ) : isAdminsTab ? (
                filteredAdmins.map((admin) => (
                  <tr key={admin.id} className="hover:bg-surface-container-lowest transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary-container/20 text-on-primary-container flex items-center justify-center font-bold text-xs shrink-0">
                          {admin.name.slice(0, 2).toUpperCase()}
                        </div>
                        <span className="text-body-sm font-semibold text-on-surface">{admin.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-body-sm text-on-surface">{admin.phone || "—"}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 inline-flex text-xs leading-5 font-semibold rounded-full ${statusStyle[admin.status] || "bg-surface-variant text-on-surface"}`}>
                        {admin.status === "blocked" ? t("admins.statusBlocked", {}, "Bloklangan") : t("admins.statusActive", {}, "Faol")}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-body-sm text-on-surface-variant whitespace-nowrap">{admin.createdAt || "—"}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-3">
                        <button
                          type="button"
                          onClick={() => openEditAdmin(admin)}
                          className="p-1 text-on-surface-variant hover:text-secondary transition-colors"
                          title={t("admins.editTooltip", {}, "Tahrirlash")}
                        >
                          <Icon name="edit" className="text-xl" />
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleAdminStatus(admin.id)}
                          className={`p-1 transition-colors ${admin.status === "blocked" ? "text-primary hover:text-primary/70" : "text-on-surface-variant hover:text-error"}`}
                          title={admin.status === "blocked" ? t("admins.activateTooltip", {}, "Faollashtirish") : t("admins.blockTooltip", {}, "Bloklash")}
                        >
                          <Icon name={admin.status === "blocked" ? "lock_open" : "block"} className="text-xl" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setGrantTarget({ user: admin, action: "revoke" })}
                          className="p-1 text-on-surface-variant hover:text-error transition-colors"
                          title={t("admins.revokeTooltip", {}, "Adminlikdan olish")}
                        >
                          <Icon name="person_remove" className="text-xl" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-surface-container-lowest transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-surface-container text-on-surface-variant flex items-center justify-center font-bold text-xs shrink-0">
                          {u.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="text-body-sm font-semibold text-on-surface">{u.name}</div>
                          <div className="text-body-sm text-on-surface-variant">{u.email || "—"}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-body-sm text-on-surface whitespace-nowrap">{u.phone || "—"}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 inline-flex text-xs leading-5 font-semibold rounded-full ${roleStyle[u.role] || "bg-surface-variant text-on-surface"}`}>
                        {(u.role || "user").toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 inline-flex text-xs leading-5 font-semibold rounded-full ${statusStyle[u.status] || "bg-surface-variant text-on-surface"}`}>
                        {t(`labels.statuses.${u.status}`, {}, u.status === "blocked" ? "Bloklangan" : "Faol")}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-body-sm text-on-surface-variant whitespace-nowrap">{u.createdAt || "—"}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link to={`/users/${u.id}`} className="p-1 text-on-surface-variant hover:text-primary transition-colors" title={t("users.viewTooltip", {}, "Ko'rish")}>
                          <Icon name="visibility" className="text-xl" />
                        </Link>
                        <button type="button" onClick={() => openEdit(u)} className="p-1 text-on-surface-variant hover:text-secondary transition-colors" title={t("users.editTooltip", {}, "Tahrirlash")}>
                          <Icon name="edit" className="text-xl" />
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleUserStatus(u.id)}
                          className={`p-1 transition-colors ${u.status === "blocked" ? "text-primary hover:text-primary/70" : "text-on-surface-variant hover:text-error"}`}
                          title={u.status === "blocked" ? t("users.unblockTooltip", {}, "Blokdan chiqarish") : t("users.blockTooltip", {}, "Bloklash")}
                        >
                          <Icon name={u.status === "blocked" ? "lock_open" : "block"} className="text-xl" />
                        </button>
                        {isPrimary && (
                          <button
                            type="button"
                            onClick={() => setGrantTarget({ user: u, action: "grant" })}
                            className="p-1 text-on-surface-variant hover:text-primary transition-colors"
                            title={t("users.makeAdminTooltip", {}, "Admin qilish")}
                          >
                            <Icon name="admin_panel_settings" className="text-xl" />
                          </button>
                        )}
                        <button type="button" onClick={() => setDeleteTarget(u)} className="p-1 text-on-surface-variant hover:text-error transition-colors" title={t("users.deleteTooltip", {}, "O'chirish")}>
                          <Icon name="delete" className="text-xl" />
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
          {t("users.totalCount", { count: rows.length }, `Jami ${rows.length} ta`)}
        </div>
      </div>

      {/* Create / Edit modal */}
      <Modal
        open={modalOpen}
        title={editingAdmin ? t("admins.editAdmin", {}, "Adminni tahrirlash") : editId ? t("users.editModalTitleUser", {}, "Foydalanuvchini tahrirlash") : t("users.createModalTitleUser", {}, "Yangi foydalanuvchi")}
        onClose={closeModal}
        footer={
          <>
            <button type="button" onClick={closeModal} className="px-5 py-2.5 text-body-sm border border-outline-variant rounded-lg hover:bg-surface-container-low text-on-surface">{t("users.cancelButton", {}, "Bekor qilish")}</button>
            <button type="submit" form="user-form" className="px-5 py-2.5 bg-primary-container text-on-primary-container text-body-sm font-medium rounded-lg hover:bg-primary hover:text-on-primary transition-colors">
              {editId ? t("users.saveButton", {}, "Saqlash") : t("users.createSubmitButton", {}, "Yaratish")}
            </button>
          </>
        }
      >
        <form id="user-form" onSubmit={handleSubmit} className="space-y-4">
          {[
            { label: t("users.fieldFullName", {}, "To'liq ism"), name: "name", type: "text", required: true },
            { label: t("users.fieldEmailOptional", {}, "Email (ixtiyoriy)"), name: "email", type: "email", required: false },
            { label: t("users.fieldPhoneOptional", {}, "Telefon (ixtiyoriy)"), name: "phone", type: "text", required: false },
            { label: editId ? t("users.fieldPasswordEdit", {}, "Parol (bo'sh — o'zgarmaydi)") : t("users.fieldPasswordCreate", {}, "Parol *"), name: "password", type: "password", required: !editId }
          ].map((f) => (
            <div key={f.name} className="flex flex-col gap-1.5">
              <label className="text-body-sm font-medium text-on-surface">{f.label}</label>
              <input
                type={f.type}
                name={f.name}
                value={form[f.name] || ""}
                onChange={(e) => setForm((c) => ({ ...c, [e.target.name]: e.target.value }))}
                required={f.required}
                className="w-full px-4 py-2.5 bg-surface border border-outline-variant rounded-lg text-on-surface font-body-md focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>
          ))}
          <p className="text-xs text-on-surface-variant">{t("users.contactRequiredNote", {}, "* Email yoki telefondan kamida bittasi to'ldirilishi shart")}</p>
          <div className="flex flex-col gap-1.5">
            <label className="text-body-sm font-medium text-on-surface">{t("users.statusFieldLabel", {}, "Holat")}</label>
            <select
              name="status"
              value={form.status}
              onChange={(e) => setForm((c) => ({ ...c, status: e.target.value }))}
              className="w-full px-4 py-2.5 bg-surface border border-outline-variant rounded-lg text-on-surface font-body-md focus:outline-none focus:border-primary cursor-pointer"
            >
              <option value="active">{t("users.statusActive", {}, "Faol")}</option>
              <option value="pending">{t("users.statusPending", {}, "Kutilmoqda")}</option>
              <option value="blocked">{t("users.statusBlocked", {}, "Bloklangan")}</option>
            </select>
          </div>
        </form>
      </Modal>

      {/* Delete confirm */}
      <Modal
        open={Boolean(deleteTarget)}
        title={t("users.deleteModalTitleUser", {}, "Foydalanuvchini o'chirish")}
        description={deleteTarget ? `"${deleteTarget.name}"` : ""}
        onClose={() => setDeleteTarget(null)}
        footer={
          <>
            <button type="button" onClick={() => setDeleteTarget(null)} className="px-5 py-2.5 text-body-sm border border-outline-variant rounded-lg hover:bg-surface-container-low text-on-surface">{t("users.cancelButton", {}, "Bekor qilish")}</button>
            <button
              type="button"
              onClick={() => { deleteUser(deleteTarget.id); setDeleteTarget(null); }}
              className="px-5 py-2.5 bg-error text-on-error text-body-sm font-medium rounded-lg hover:bg-error/90"
            >
              {t("common.delete", {}, "O'chirish")}
            </button>
          </>
        }
      >
        <p className="text-body-sm text-on-surface-variant">{t("users.deleteModalNoteUser", {}, "Bu amalni qaytarib bo'lmaydi. Foydalanuvchi tarixi saqlanishi mumkin.")}</p>
      </Modal>

      {/* Grant / Revoke admin */}
      <Modal
        open={Boolean(grantTarget)}
        title={grantTarget?.action === "grant" ? t("users.grantModalTitle", {}, "Admin huquqini berish") : t("users.revokeModalTitle", {}, "Admin huquqini olish")}
        description={grantTarget ? `"${grantTarget.user.name}"` : ""}
        onClose={() => setGrantTarget(null)}
        footer={
          <>
            <button type="button" onClick={() => setGrantTarget(null)} className="px-5 py-2.5 text-body-sm border border-outline-variant rounded-lg hover:bg-surface-container-low text-on-surface">{t("users.cancelButton", {}, "Bekor qilish")}</button>
            <button
              type="button"
              onClick={async () => {
                if (grantTarget.action === "grant") await grantAdminToUser(grantTarget.user.id);
                else await revokeAdminFromUser(grantTarget.user.id);
                setGrantTarget(null);
              }}
              className={`px-5 py-2.5 text-body-sm font-medium rounded-lg transition-colors ${grantTarget?.action === "grant" ? "bg-primary-container text-on-primary-container hover:bg-primary hover:text-on-primary" : "bg-error text-on-error hover:bg-error/90"}`}
            >
              {grantTarget?.action === "grant" ? t("users.grantConfirmButton", {}, "Admin qilish") : t("users.revokeConfirmButton", {}, "Adminlikdan olish")}
            </button>
          </>
        }
      >
        <p className="text-body-sm text-on-surface-variant">
          {grantTarget?.action === "grant"
            ? t("users.grantModalDescription", {}, "Ushbu foydalanuvchiga admin huquqi beriladi va u admin panelidan foydalana oladi.")
            : t("users.revokeModalDescription", {}, "Ushbu foydalanuvchidan admin huquqi olib tashlanadi va u oddiy foydalanuvchiga aylanadi.")}
        </p>
      </Modal>
    </div>
  );
}
