import { tx } from "../../i18n";
import { Select } from "../../components/shared/Select";
import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import { Modal } from "../../components/shared/Modal";
import { Icon } from "../../components/shared/Icon";
import { useAuth } from "../../store";
import { useAdminData } from "../../store/adminData";
import { useI18n } from "../../i18n";
import { RolePicker, kindLabel, kindBadgeStyle } from "../../components/users/RolePicker";

const statusStyle = {
  active:  "bg-primary-container/20 text-on-primary-container",
  pending: "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300",
  blocked: "bg-error-container text-on-error-container"
};

const roleStyle = {
  admin: "bg-surface-variant text-on-surface",
  user: "bg-[#E5E7EB] text-[#4B5563]"
};

const empty = { name: "", email: "", phone: "", role: "USER", status: "active", password: "", kind: "USER", shopId: "" };

export function UsersPage() {
  const { profile } = useAuth();
  const { users, admins, mainAdminId, changeAccountKind, loadShops, createUser, createAdmin, promoteToAdmin, updateUser, toggleUserStatus, deleteUser, revokeAdminFromUser, toggleAdminStatus, updateAdmin } = useAdminData();
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
  const [creatingAdmin, setCreatingAdmin] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [grantTarget, setGrantTarget] = useState(null);
  // role editing: from the role badge (own window) and from the pencil (inside the edit window)
  const [roleTarget, setRoleTarget] = useState(null);
  const [roleDraft, setRoleDraft] = useState({ kind: "USER", shopId: "" });
  const [initialKind, setInitialKind] = useState("USER");
  const [shops, setShops] = useState([]);
  const [shopsLoading, setShopsLoading] = useState(false);

  async function ensureShops() {
    setShopsLoading(true);
    setShops(await loadShops());
    setShopsLoading(false);
  }
  function openRole(u) {
    setRoleTarget(u);
    setRoleDraft({ kind: u.kind || "USER", shopId: "" });
    ensureShops();
  }
  async function saveRole() {
    if (roleDraft.kind === "CASHIER" && !roleDraft.shopId) return;
    const ok = await changeAccountKind(roleTarget.id, roleDraft);
    if (ok) setRoleTarget(null);
  }

  const regularUsers = useMemo(
    () => users.filter((u) => u.role === "user" || u.role !== "admin"),
    [users]
  );
  // Every admin is listed. Only the MAIN admin (the oldest admin account) can add / change / block / revoke the
  // others; nobody can touch the main admin. The server enforces the same rule.
  const allAdmins = admins;
  const iAmMain = Boolean(profile?.id) && profile.id === mainAdminId;

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

  function openCreate() { setEditId(null); setEditingAdmin(false); setCreatingAdmin(false); setForm(empty); setModalOpen(true); }
  function openCreateAdmin() { setEditId(null); setEditingAdmin(false); setCreatingAdmin(true); setForm(empty); setModalOpen(true); }
  function openEdit(u) {
    setEditId(u.id);
    setEditingAdmin(false);
    setForm({ name: u.name, email: u.email, phone: u.phone, role: u.role, status: u.status, password: "", kind: u.kind || "USER", shopId: "" });
    setInitialKind(u.kind || "USER");
    ensureShops();
    setModalOpen(true);
  }
  function openEditAdmin(a) {
    setEditId(a.id);
    setEditingAdmin(true);
    setForm({ name: a.name, email: a.email, phone: a.phone, role: a.role, status: a.status, password: "" });
    setModalOpen(true);
  }
  function closeModal() { setModalOpen(false); setEditId(null); setEditingAdmin(false); setCreatingAdmin(false); setForm(empty); }

  function handleSubmit(e) {
    e.preventDefault();
    const payload = { ...form };
    const wantedKind = payload.kind;
    const wantedShop = payload.shopId;
    delete payload.kind;
    delete payload.shopId;
    if (!payload.email) delete payload.email;
    if (!payload.phone) delete payload.phone;
    if (!payload.password) delete payload.password;
    if (creatingAdmin) {
      delete payload.role;
      createAdmin(payload);
    } else if (editingAdmin) {
      // Keep the ADMIN role — don't demote when editing an admin's profile.
      delete payload.role;
      updateAdmin(editId, payload);
    } else {
      // Regular-user form: role is always USER (admin rights granted separately).
      payload.role = "USER";
      if (editId) {
        // the profile is saved first, then the role (the server checks both separately)
        updateUser(editId, payload);
        if (wantedKind && wantedKind !== initialKind || (wantedKind === "CASHIER" && wantedShop)) {
          if (wantedKind === "CASHIER" && !wantedShop) return;
          changeAccountKind(editId, { kind: wantedKind, shopId: wantedShop });
        }
      } else createUser(payload);
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
            {isAdminsTab ? tx("msg.adminlar") : tx("msg.foydalanuvchilar")}
          </h2>
          <p className="text-on-surface-variant mt-1 text-body-sm">
            {isAdminsTab ? tx("msg.tizim_adminlari_ro_yxati_va_boshqaruvi") : tx("msg.tizimdagi_barcha_foydalanuvchilar_ro_y")}
          </p>
        </div>
        {isAdminsTab && iAmMain && (
          <button
            type="button"
            onClick={openCreateAdmin}
            className="flex items-center gap-2 bg-primary-container hover:bg-primary text-on-primary-container hover:text-on-primary transition-colors rounded-lg py-2.5 px-5 font-semibold shadow-sm shrink-0"
          >
            <Icon name="person_add" className="text-[20px]" />
            {tx("msg.yangi_admin")}
          </button>
        )}
        {!isAdminsTab && (
          <button
            type="button"
            onClick={openCreate}
            className="flex items-center gap-2 bg-primary-container hover:bg-primary text-on-primary-container hover:text-on-primary transition-colors rounded-lg py-2.5 px-5 font-semibold shadow-sm shrink-0"
          >
            <Icon name="add" className="text-[20px]" />
            {t("users.new")}
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="bg-surface-bright border border-outline-variant rounded-xl p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]" />
          <input
            type="search"
            placeholder={isAdminsTab ? tx("msg.admin_qidirish_dots") : tx("msg.foydalanuvchini_qidirish_dots")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-3 py-2 bg-surface-container-lowest border border-outline-variant rounded-lg text-on-surface text-body-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
          />
        </div>
        {!isAdminsTab && (
          <div className="w-full md:w-auto flex items-center gap-3">
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full md:w-48 px-4 py-2 bg-surface-container-lowest border border-outline-variant rounded-lg text-on-surface text-body-sm focus:outline-none focus:border-primary cursor-pointer"
            >
              <option value="all">{t("users.allStatuses")}</option>
              <option value="active">{t("labels.statuses.active")}</option>
              <option value="pending">{t("labels.statuses.pending")}</option>
              <option value="blocked">{t("labels.statuses.blocked")}</option>
            </Select>
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
                  ? [tx("msg.col_admin"), tx("msg.telefon"), tx("msg.holat"), tx("msg.yaratilgan"), tx("msg.amallar")]
                  : [tx("msg.foydalanuvchi"), tx("msg.telefon"), tx("msg.rol"), tx("msg.holat"), tx("msg.ro_yxatdan_o_tgan"), tx("msg.amallar")]
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
                    <p className="text-on-surface-variant text-body-sm">{isAdminsTab ? tx("msg.hozircha_boshqa_adminlar_yo_q") : tx("msg.foydalanuvchi_topilmadi")}</p>
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
                        {admin.isMain && <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary-container/30 text-on-primary-container">{tx("msg.badge_main")}</span>}
                        {admin.id === profile?.id && <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-surface-variant text-on-surface-variant">{tx("msg.badge_you")}</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-body-sm text-on-surface">{admin.phone || "—"}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 inline-flex text-xs leading-5 font-semibold rounded-full ${statusStyle[admin.status] || "bg-surface-variant text-on-surface"}`}>
                        {admin.status === "blocked" ? tx("msg.status_blocked_one") : tx("msg.status_active_one")}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-body-sm text-on-surface-variant whitespace-nowrap">{admin.createdAt || "—"}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      {(!iAmMain || admin.isMain) ? (
                        <span className="text-xs text-on-surface-variant">{admin.isMain ? tx("msg.himoyalangan") : "—"}</span>
                      ) : (
                      <div className="flex items-center justify-end gap-3">
                        <button
                          type="button"
                          onClick={() => openEditAdmin(admin)}
                          className="p-1 text-on-surface-variant hover:text-secondary transition-colors"
                          title={t("common.edit")}
                        >
                          <Icon name="edit" className="text-xl" />
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleAdminStatus(admin.id)}
                          className={`p-1 transition-colors ${admin.status === "blocked" ? "text-primary hover:text-primary/70" : "text-on-surface-variant hover:text-error"}`}
                          title={admin.status === "blocked" ? tx("msg.faollashtirish") : tx("msg.bloklash")}
                        >
                          <Icon name={admin.status === "blocked" ? "lock_open" : "block"} className="text-xl" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setGrantTarget({ user: admin, action: "revoke" })}
                          className="p-1 text-on-surface-variant hover:text-error transition-colors"
                          title={t("users.revokeAdmin")}
                        >
                          <Icon name="person_remove" className="text-xl" />
                        </button>
                      </div>
                      )}
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
                      <button
                        type="button"
                        onClick={() => openRole(u)}
                        title={tx("msg.rolni_o_zgartirish")}
                        className={`px-2.5 inline-flex items-center gap-1 whitespace-nowrap text-xs leading-5 font-semibold rounded-full cursor-pointer hover:ring-2 hover:ring-primary/40 transition ${kindBadgeStyle[u.kind] || kindBadgeStyle.USER}`}
                      >
                        {kindLabel(u.kind)}
                        <Icon name="expand_more" className="text-[14px]" />
                      </button>
                      {u.shopName && <div className="text-[11px] text-on-surface-variant mt-0.5 max-w-[160px] truncate">{u.shopName}</div>}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 inline-flex text-xs leading-5 font-semibold rounded-full ${statusStyle[u.status] || "bg-surface-variant text-on-surface"}`}>
                        {t(`labels.statuses.${u.status}`, {}, u.status === "blocked" ? tx("msg.status_blocked_one") : tx("msg.status_active_one"))}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-body-sm text-on-surface-variant whitespace-nowrap">{u.createdAt || "—"}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link to={`/users/${u.id}`} className="p-1 text-on-surface-variant hover:text-primary transition-colors" title={t("common.view")}>
                          <Icon name="visibility" className="text-xl" />
                        </Link>
                        <button type="button" onClick={() => openEdit(u)} className="p-1 text-on-surface-variant hover:text-secondary transition-colors" title={t("common.edit")}>
                          <Icon name="edit" className="text-xl" />
                        </button>
                        {iAmMain && (
                          <button type="button" onClick={() => setGrantTarget({ user: u, action: "grant" })} className="p-1 text-on-surface-variant hover:text-primary transition-colors" title={tx("msg.admin_qilish")}>
                            <Icon name="admin_panel_settings" className="text-xl" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => toggleUserStatus(u.id)}
                          className={`p-1 transition-colors ${u.status === "blocked" ? "text-primary hover:text-primary/70" : "text-on-surface-variant hover:text-error"}`}
                          title={u.status === "blocked" ? tx("msg.blokdan_chiqarish") : tx("msg.bloklash")}
                        >
                          <Icon name={u.status === "blocked" ? "lock_open" : "block"} className="text-xl" />
                        </button>
                        <button type="button" onClick={() => setDeleteTarget(u)} className="p-1 text-on-surface-variant hover:text-error transition-colors" title={t("common.delete")}>
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
          {t("common.total")} <span className="font-medium text-on-surface">{rows.length}</span> {tx("msg.pieces")}
        </div>
      </div>

      {/* Create / Edit modal */}
      <Modal
        open={modalOpen}
        title={creatingAdmin ? tx("msg.yangi_admin") : editingAdmin ? tx("msg.adminni_tahrirlash") : editId ? tx("msg.foydalanuvchini_tahrirlash") : tx("msg.yangi_foydalanuvchi")}
        onClose={closeModal}
        footer={
          <>
            <button type="button" onClick={closeModal} className="px-5 py-2.5 text-body-sm border border-outline-variant rounded-lg hover:bg-surface-container-low text-on-surface">{t("common.cancel")}</button>
            <button type="submit" form="user-form" className="px-5 py-2.5 bg-primary-container text-on-primary-container text-body-sm font-medium rounded-lg hover:bg-primary hover:text-on-primary transition-colors">
              {editId ? tx("msg.saqlash") : tx("msg.yaratish")}
            </button>
          </>
        }
      >
        <form id="user-form" onSubmit={handleSubmit} className="space-y-4">
          {[
            { label: t("users.fullName"), name: "name", type: "text", required: true },
            { label: t("users.emailOptional"), name: "email", type: "email", required: false },
            { label: t("users.phoneOptional"), name: "phone", type: "text", required: false },
            { label: editId ? tx("msg.parol_bo_sh_o_zgarmaydi") : tx("msg.parol_req"), name: "password", type: "password", required: !editId }
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
          <p className="text-xs text-on-surface-variant">{t("users.contactRequired")}</p>
          <div className="flex flex-col gap-1.5">
            <label className="text-body-sm font-medium text-on-surface">{t("common.status")}</label>
            <Select
              name="status"
              value={form.status}
              onChange={(e) => setForm((c) => ({ ...c, status: e.target.value }))}
              className="w-full px-4 py-2.5 bg-surface border border-outline-variant rounded-lg text-on-surface font-body-md focus:outline-none focus:border-primary cursor-pointer"
            >
              <option value="active">{t("labels.statuses.active")}</option>
              <option value="pending">{t("labels.statuses.pending")}</option>
              <option value="blocked">{t("labels.statuses.blocked")}</option>
            </Select>
          </div>
          {editId && !editingAdmin && !creatingAdmin && (
            <RolePicker
              kind={form.kind}
              shopId={form.shopId}
              canAdmin={iAmMain}
              shops={shops}
              loadingShops={shopsLoading}
              onChange={({ kind, shopId }) => setForm((c) => ({ ...c, kind, shopId }))}
            />
          )}
        </form>
      </Modal>

      {/* Change role (opened from the role badge) */}
      <Modal
        open={Boolean(roleTarget)}
        title={tx("msg.rolni_o_zgartirish")}
        description={roleTarget ? `"${roleTarget.name}"` : ""}
        onClose={() => setRoleTarget(null)}
        footer={
          <>
            <button type="button" onClick={() => setRoleTarget(null)} className="px-5 py-2.5 text-body-sm border border-outline-variant rounded-lg hover:bg-surface-container-low text-on-surface">{t("common.cancel")}</button>
            <button
              type="button"
              onClick={saveRole}
              disabled={roleDraft.kind === "CASHIER" && !roleDraft.shopId}
              className="px-5 py-2.5 bg-primary-container text-on-primary-container text-body-sm font-medium rounded-lg hover:bg-primary hover:text-on-primary transition-colors disabled:opacity-50"
            >
              {tx("msg.saqlash")}
            </button>
          </>
        }
      >
        <RolePicker
          kind={roleDraft.kind}
          shopId={roleDraft.shopId}
          canAdmin={iAmMain}
          shops={shops}
          loadingShops={shopsLoading}
          onChange={setRoleDraft}
        />
      </Modal>

      {/* Delete confirm */}
      <Modal
        open={Boolean(deleteTarget)}
        title={t("users.deleteTitle")}
        description={deleteTarget ? `"${deleteTarget.name}"` : ""}
        onClose={() => setDeleteTarget(null)}
        footer={
          <>
            <button type="button" onClick={() => setDeleteTarget(null)} className="px-5 py-2.5 text-body-sm border border-outline-variant rounded-lg hover:bg-surface-container-low text-on-surface">{t("common.cancel")}</button>
            <button
              type="button"
              onClick={() => { deleteUser(deleteTarget.id); setDeleteTarget(null); }}
              className="px-5 py-2.5 bg-error text-on-error text-body-sm font-medium rounded-lg hover:bg-error/90"
            >
              {t("common.delete")}
            </button>
          </>
        }
      >
        <p className="text-body-sm text-on-surface-variant">{t("users.deleteHint")}</p>
      </Modal>

      {/* Revoke admin — there's exactly one ADMIN account system-wide (owner
          decision), granted only via CLI (seedAdmin.js), so this modal only
          ever offers to revoke, never to grant. */}
      <Modal
        open={Boolean(grantTarget)}
        title={grantTarget?.action === "grant" ? tx("msg.admin_huquqini_berish") : t("users.revokeAdminTitle")}
        description={grantTarget ? `"${grantTarget.user.name}"` : ""}
        onClose={() => setGrantTarget(null)}
        footer={
          <>
            <button type="button" onClick={() => setGrantTarget(null)} className="px-5 py-2.5 text-body-sm border border-outline-variant rounded-lg hover:bg-surface-container-low text-on-surface">{t("common.cancel")}</button>
            <button
              type="button"
              onClick={async () => {
                if (grantTarget.action === "grant") await promoteToAdmin(grantTarget.user.id);
                else await revokeAdminFromUser(grantTarget.user.id);
                setGrantTarget(null);
              }}
              className={`px-5 py-2.5 text-body-sm font-medium rounded-lg transition-colors ${grantTarget?.action === "grant" ? "bg-primary-container text-on-primary-container hover:bg-primary hover:text-on-primary" : "bg-error text-on-error hover:bg-error/90"}`}
            >
              {grantTarget?.action === "grant" ? tx("msg.admin_qilish") : t("users.revokeAdmin")}
            </button>
          </>
        }
      >
        <p className="text-body-sm text-on-surface-variant">
          {grantTarget?.action === "grant"
            ? tx("msg.bu_foydalanuvchi_to_liq_admin_huquqiga")
            : t("users.revokeAdminHint")}
        </p>
      </Modal>
    </div>
  );
}
