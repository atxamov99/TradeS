import {
  createContext,
  createElement,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";
import {
  admins as initialAdmins,
  auditLogs as initialAuditLogs,
  contentRows as initialContentRows,
  notificationFeed,
  permissionMatrix as initialPermissionMatrix,
  recentActivities as initialRecentActivities,
  roles as initialRoles
} from "../constants/mockData";
import { getAllUsers, blockUser, unblockUser, deleteUser } from "../api/admin.api";
import { getProducts, createProduct, updateProduct, deleteProduct } from "../api/products.api";
import { useAuth } from "./index";

const AdminDataContext = createContext(null);

// ── Normalizers ────────────────────────────────────────────
function normalizeUser(u) {
  return {
    id: u._id || u.id,
    name: u.name || "",
    email: u.email || "",
    phone: u.phone || "",
    role: (u.role || "viewer").toLowerCase(),
    status: u.isBlocked ? "blocked" : "active",
    createdAt: u.createdAt ? u.createdAt.slice(0, 10) : "",
    lastLogin: u.lastLoginAt ? u.lastLoginAt.slice(0, 16).replace("T", " ") : null,
    isAdmin: ["admin", "super_admin"].includes((u.role || "").toLowerCase())
  };
}

function normalizeProduct(p) {
  return {
    id: p._id || p.id,
    name: p.name || "",
    category: p.category || "",
    price: p.price || 0,
    stock: p.stock ?? p.countInStock ?? 0,
    sku: p.sku || "",
    status: p.isActive !== false ? "active" : "inactive",
    createdAt: p.createdAt ? p.createdAt.slice(0, 10) : ""
  };
}

function formatNow() {
  return new Date().toISOString().slice(0, 16).replace("T", " ");
}

function nextId(prefix, list) {
  const max = list.reduce((m, item) => {
    const n = Number(String(item.id || "").replace(/\D/g, ""));
    return Number.isFinite(n) ? Math.max(m, n) : m;
  }, 0);
  return `${prefix}-${String(max + 1).padStart(4, "0")}`;
}

export function AdminDataProvider({ children }) {
  const { profile } = useAuth();

  // ── Remote state ─────────────────────────────────────────
  const [users, setUsers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // ── Local-only state (no backend endpoints yet) ──────────
  const [admins, setAdmins] = useState(initialAdmins);
  const [contentRows, setContentRows] = useState(initialContentRows);
  const [auditLogs, setAuditLogs] = useState(initialAuditLogs);
  const [recentActivity, setRecentActivity] = useState(initialRecentActivities);
  const [toasts, setToasts] = useState([]);
  const [roles, setRoles] = useState(initialRoles);
  const [permissionMatrix, setPermissionMatrix] = useState(initialPermissionMatrix);

  const loadedRef = useRef(false);

  // ── Load remote data on mount ────────────────────────────
  useEffect(() => {
    if (loadedRef.current) return;
    loadedRef.current = true;

    async function load() {
      try {
        const [usersRes, productsRes] = await Promise.allSettled([
          getAllUsers({ limit: 100 }),
          getProducts({ limit: 100 })
        ]);

        if (usersRes.status === "fulfilled") {
          const raw = usersRes.value?.data?.users || [];
          setUsers(raw.map(normalizeUser));
        }
        if (productsRes.status === "fulfilled") {
          const raw = productsRes.value?.data?.products || [];
          setProducts(raw.map(normalizeProduct));
        }
      } catch { /* silent — pages degrade gracefully */ }
      finally { setLoading(false); }
    }

    load();
  }, []);

  // ── Toast ────────────────────────────────────────────────
  function dismissToast(id) {
    setToasts((curr) => curr.filter((t) => t.id !== id));
  }

  function pushToast(message, tone = "success") {
    const id = `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
    setToasts((curr) => [...curr, { id, message, tone }]);
    window.setTimeout(() => dismissToast(id), 3400);
  }

  // ── Activity + Audit ─────────────────────────────────────
  function appendActivity(title, detail, tone = "info") {
    setRecentActivity((curr) =>
      [{ title, detail, time: "Hozir", tone }, ...curr].slice(0, 8)
    );
  }

  function logAudit(action, target, category = "user", tone = "info") {
    const actor = profile?.name || "Tizim";
    setAuditLogs((curr) => [
      { id: `${Date.now()}`, action, category, actor, target, ip: "—", timestamp: formatNow() },
      ...curr
    ]);
    appendActivity(action, `${actor} → ${target}`, tone);
  }

  // ── Users ────────────────────────────────────────────────
  async function createUser(payload) {
    // No POST /admin/users endpoint — optimistic local add
    const user = {
      id: nextId("USR", users),
      createdAt: formatNow().slice(0, 10),
      lastLogin: null,
      isAdmin: false,
      status: "active",
      ...payload
    };
    setUsers((curr) => [user, ...curr]);
    logAudit("Foydalanuvchi yaratildi", user.id, "user", "success");
    pushToast(`${user.name} yaratildi`);
  }

  async function updateUser(id, payload) {
    setUsers((curr) => curr.map((u) => (u.id === id ? { ...u, ...payload } : u)));
    logAudit("Foydalanuvchi yangilandi", id, "user", "info");
    pushToast("O'zgarishlar saqlandi");
  }

  async function toggleUserStatus(id) {
    const user = users.find((u) => u.id === id);
    if (!user) return;
    const isBlocked = user.status !== "blocked";
    try {
      if (isBlocked) {
        await blockUser(id);
      } else {
        await unblockUser(id);
      }
      setUsers((curr) =>
        curr.map((u) => u.id === id ? { ...u, status: isBlocked ? "blocked" : "active" } : u)
      );
      const label = isBlocked ? "Foydalanuvchi bloklandi" : "Foydalanuvchi aktivlashtirildi";
      logAudit(label, id, "user", isBlocked ? "danger" : "success");
      pushToast(label, isBlocked ? "danger" : "success");
    } catch (err) {
      pushToast(err?.message || "Xatolik yuz berdi", "danger");
    }
  }

  async function deleteUser(id) {
    const target = users.find((u) => u.id === id);
    try {
      await deleteUser(id);
      setUsers((curr) => curr.filter((u) => u.id !== id));
      logAudit("Foydalanuvchi o'chirildi", id, "user", "danger");
      pushToast(`${target?.name || id} o'chirildi`, "danger");
    } catch (err) {
      pushToast(err?.message || "O'chirishda xatolik", "danger");
    }
  }

  // ── Grant / Revoke Admin (local only) ────────────────────
  function grantAdminToUser(userId) {
    const user = users.find((u) => u.id === userId);
    if (!user) return;
    setUsers((curr) => curr.map((u) => u.id === userId ? { ...u, isAdmin: true } : u));
    const alreadyAdmin = admins.find((a) => a.email === user.email);
    if (!alreadyAdmin) {
      setAdmins((curr) => [...curr, {
        id: nextId("ADM", admins),
        name: user.name,
        email: user.email,
        isPrimary: false,
        status: "active",
        lastActive: formatNow(),
        createdBy: profile?.name || "Bosh Admin",
        grantedFromUserId: userId
      }]);
    }
    logAudit("Admin huquqi berildi", user.name, "admin", "success");
    pushToast(`${user.name} ga admin huquqi berildi`);
  }

  function revokeAdminFromUser(userId) {
    const user = users.find((u) => u.id === userId);
    if (!user) return;
    setUsers((curr) => curr.map((u) => u.id === userId ? { ...u, isAdmin: false } : u));
    setAdmins((curr) => curr.filter((a) => a.grantedFromUserId !== userId && a.email !== user.email));
    logAudit("Admin huquqi olindi", user.name, "admin", "warning");
    pushToast(`${user.name} dan admin huquqi olindi`, "warning");
  }

  function toggleAdminStatus(id) {
    let next = "suspended";
    setAdmins((curr) =>
      curr.map((a) => {
        if (a.id !== id || a.isPrimary) return a;
        next = a.status === "suspended" ? "active" : "suspended";
        return { ...a, status: next };
      })
    );
    logAudit(
      next === "suspended" ? "Admin to'xtatildi" : "Admin aktivlashtirildi",
      id, "admin", "warning"
    );
    pushToast(next === "suspended" ? "Admin to'xtatildi" : "Admin aktivlashtirildi", "warning");
  }

  // ── Content ──────────────────────────────────────────────
  function createContent(payload) {
    const row = { id: nextId("CNT", contentRows), updatedAt: formatNow(), ...payload };
    setContentRows((curr) => [row, ...curr]);
    logAudit("Kontent yaratildi", row.name || row.id, "content", "success");
    pushToast(`"${row.name}" yaratildi`);
  }

  function updateContentStatus(id, status) {
    let name = id;
    setContentRows((curr) =>
      curr.map((c) => { if (c.id !== id) return c; name = c.name || id; return { ...c, status, updatedAt: formatNow() }; })
    );
    logAudit(`Kontent statusi: ${status}`, name, "content", "info");
    pushToast(`Kontent statusi yangilandi: ${status}`);
  }

  function deleteContent(id) {
    const target = contentRows.find((c) => c.id === id);
    setContentRows((curr) => curr.filter((c) => c.id !== id));
    logAudit("Kontent o'chirildi", target?.name || id, "content", "danger");
    pushToast(`"${target?.name || id}" o'chirildi`, "danger");
  }

  function saveSettings(section) {
    logAudit("Sozlamalar saqlandi", section, "settings", "success");
    pushToast("Sozlamalar saqlandi");
  }

  // ── Roles ─────────────────────────────────────────────────
  function createRole(payload) {
    const role = { id: `role-${Date.now()}`, name: payload.name, scope: payload.scope, note: payload.note, members: 0, isSystem: false };
    setRoles((curr) => [...curr, role]);
    logAudit("Rol yaratildi", role.name, "settings", "success");
    pushToast(`"${role.name}" roli yaratildi`);
  }

  function deleteRole(id) {
    const target = roles.find((r) => r.id === id);
    if (target?.isSystem) { pushToast("Tizim rolini o'chirib bo'lmaydi", "danger"); return; }
    setRoles((curr) => curr.filter((r) => r.id !== id));
    logAudit("Rol o'chirildi", target?.name || id, "settings", "danger");
    pushToast(`"${target?.name}" roli o'chirildi`, "danger");
  }

  // ── Permissions ───────────────────────────────────────────
  function togglePermission(module, roleKey, action) {
    setPermissionMatrix((curr) =>
      curr.map((row) => {
        if (row.module !== module) return row;
        const current = row[roleKey] || [];
        const updated = current.includes(action) ? current.filter((a) => a !== action) : [...current, action];
        return { ...row, [roleKey]: updated };
      })
    );
  }

  function savePermissions() {
    logAudit("Ruxsatlar saqlandi", "permission matrix", "settings", "success");
    pushToast("Ruxsatlar saqlandi");
  }

  // ── Products ──────────────────────────────────────────────
  async function createProduct(payload) {
    try {
      const res = await createProduct(payload);
      const product = normalizeProduct(res.data?.product || res.data || {});
      setProducts((curr) => [product, ...curr]);
      logAudit("Mahsulot yaratildi", product.name, "content", "success");
      pushToast(`"${product.name}" qo'shildi`);
    } catch (err) {
      pushToast(err?.message || "Mahsulot qo'shishda xatolik", "danger");
    }
  }

  async function updateProduct(id, payload) {
    try {
      const res = await updateProduct(id, payload);
      const updated = normalizeProduct(res.data?.product || res.data || payload);
      setProducts((curr) => curr.map((p) => p.id === id ? { ...p, ...updated } : p));
      logAudit("Mahsulot yangilandi", id, "content", "info");
      pushToast("Mahsulot saqlandi");
    } catch (err) {
      pushToast(err?.message || "Yangilashda xatolik", "danger");
    }
  }

  async function deleteProduct(id) {
    const target = products.find((p) => p.id === id);
    try {
      await deleteProduct(id);
      setProducts((curr) => curr.filter((p) => p.id !== id));
      logAudit("Mahsulot o'chirildi", target?.name || id, "content", "danger");
      pushToast(`"${target?.name || id}" o'chirildi`, "danger");
    } catch (err) {
      pushToast(err?.message || "O'chirishda xatolik", "danger");
    }
  }

  async function toggleProductStatus(id) {
    const product = products.find((p) => p.id === id);
    if (!product) return;
    const next = product.status === "active" ? "inactive" : "active";
    try {
      await updateProduct(id, { isActive: next === "active" });
      setProducts((curr) => curr.map((p) => p.id === id ? { ...p, status: next } : p));
      logAudit(
        next === "active" ? "Mahsulot aktivlashtirildi" : "Mahsulot nofaol qilindi",
        id, "content", next === "active" ? "success" : "warning"
      );
      pushToast(next === "active" ? "Mahsulot aktivlashtirildi" : "Mahsulot nofaol qilindi");
    } catch (err) {
      pushToast(err?.message || "Xatolik", "danger");
    }
  }

  const value = useMemo(
    () => ({
      loading,
      users, admins, contentRows, auditLogs,
      notificationFeed, recentActivity, toasts,
      roles, permissionMatrix,
      products,
      pushToast, dismissToast,
      createUser, updateUser, toggleUserStatus, deleteUser,
      grantAdminToUser, revokeAdminFromUser,
      toggleAdminStatus,
      createContent, updateContentStatus, deleteContent,
      saveSettings,
      createRole, deleteRole,
      togglePermission, savePermissions,
      createProduct, updateProduct, deleteProduct, toggleProductStatus
    }),
    [users, admins, contentRows, auditLogs, recentActivity, toasts, roles, permissionMatrix, products, loading]
  );

  return createElement(AdminDataContext.Provider, { value }, children);
}

export function useAdminData() {
  const ctx = useContext(AdminDataContext);
  if (!ctx) throw new Error("useAdminData must be used within AdminDataProvider");
  return ctx;
}
