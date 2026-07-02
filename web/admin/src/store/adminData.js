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
  permissionMatrix as initialPermissionMatrix,
  roles as initialRoles
} from "../constants/mockData";
import { usersApi } from "../services/api/users.api";
import { productsApi } from "../services/api/products.api";
import { adminsApi } from "../services/api/admins.api";
import { auditLogsApi } from "../services/api/auditLogs.api";
import { contentApi } from "../services/api/content.api";
import { ordersApi } from "../services/api/orders.api";
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
    isAdmin: ["admin", "super_admin"].includes((u.role || "").toLowerCase()),
    isPrimary: u.role === "SUPER_ADMIN"
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
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // ── Local-only state (no backend endpoints yet) ──────────
  const [admins, setAdmins] = useState([]);
  const [contentRows, setContentRows] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [notificationFeed, setNotificationFeed] = useState([]);
  const [toasts, setToasts] = useState([]);
  const [roles, setRoles] = useState(initialRoles);
  const [permissionMatrix, setPermissionMatrix] = useState(initialPermissionMatrix);

  const loadedRef = useRef(false);

  // ── Load remote data on mount and poll periodically ────────────────────────────
  useEffect(() => {
    if (!profile) { setLoading(false); return; }

    async function load() {
      try {
        const [usersRes, productsRes, adminsRes, auditRes, contentRes, ordersRes] = await Promise.allSettled([
          usersApi.getAll({ limit: 100 }),
          productsApi.getAll({ limit: 100 }),
          adminsApi.getAll(),
          auditLogsApi.getAll({ limit: 10 }),
          contentApi.getAll({ limit: 100 }),
          ordersApi.getAll({ limit: 100 })
        ]);

        let rawUsers = [];
        if (usersRes.status === "fulfilled") {
          rawUsers = usersRes.value?.data?.users || usersRes.value?.data || [];
          setUsers((Array.isArray(rawUsers) ? rawUsers : []).map(normalizeUser));
        }
        if (productsRes.status === "fulfilled") {
          const raw = productsRes.value?.data?.products || productsRes.value?.data || [];
          setProducts((Array.isArray(raw) ? raw : []).map(normalizeProduct));
        }
        if (adminsRes.status === "fulfilled") {
          const raw = adminsRes.value?.data?.users || adminsRes.value?.data || [];
          setAdmins((Array.isArray(raw) ? raw : [])
            .filter(u => u.role !== "SUPER_ADMIN")
            .map(normalizeUser)
          );
        }
        if (auditRes.status === "fulfilled") {
          const rawLogs = auditRes.value?.data?.logs || auditRes.value?.data || [];
          const logsArray = Array.isArray(rawLogs) ? rawLogs : [];
          setAuditLogs(logsArray);
          setRecentActivity(logsArray.slice(0, 8).map(log => ({
            title: log.action || "Amal",
            detail: `${log.actor} → ${log.target}`,
            time: log.timestamp || (log.createdAt ? new Date(log.createdAt).toLocaleString() : "Hozir"),
            tone: log.tone || "info"
          })));
        }
        if (contentRes.status === "fulfilled") {
          const rawContent = contentRes.value?.data?.content || contentRes.value?.data?.contents || contentRes.value?.data || [];
          setContentRows(Array.isArray(rawContent) ? rawContent.map(c => ({
            id: c.id,
            name: c.name || "",
            type: c.type || "landing_page",
            status: c.status || "draft",
            owner: c.owner || "",
            updatedAt: c.updatedAt ? new Date(c.updatedAt).toISOString().slice(0, 10) : ""
          })) : []);
        }
        if (ordersRes.status === "fulfilled") {
          const rawOrders = ordersRes.value?.data?.orders || ordersRes.value?.data || [];
          setOrders(Array.isArray(rawOrders) ? rawOrders : []);
        }

        // Generate dynamic notifications based on fetched users
        const notifications = [];
        if (rawUsers.length > 0) {
          const lastWeek = new Date();
          lastWeek.setDate(lastWeek.getDate() - 7);
          const newUsersCount = rawUsers.filter(u => new Date(u.createdAt) >= lastWeek).length;
          if (newUsersCount > 0) {
            notifications.push({
              id: "n1",
              titleKey: "dashboard.notificationFeed.newUsers",
              detailKey: "dashboard.notificationFeed.newUsersDetail",
              detail: `Bu hafta ${newUsersCount} ta yangi registratsiya`,
              priority: "medium"
            });
          }
          const blockedUsersCount = rawUsers.filter(u => u.isBlocked || u.status === "blocked").length;
          if (blockedUsersCount > 0) {
            notifications.push({
              id: "n2",
              titleKey: "dashboard.notificationFeed.blockedAccounts",
              detailKey: "dashboard.notificationFeed.blockedAccountsDetail",
              detail: `${blockedUsersCount} ta akkaunt faol emas`,
              priority: "high"
            });
          }
        }
        setNotificationFeed(notifications);
      } catch { /* silent */ }
    }

    // Initial load
    load().finally(() => setLoading(false));

    // Poll every 30 seconds for real-time updates
    const intervalId = setInterval(load, 30000);

    return () => clearInterval(intervalId);
  }, [profile]);

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
    try {
      const res = await usersApi.create(payload);
      const user = normalizeUser(res.data?.user || res.data || {});
      setUsers((curr) => [user, ...curr]);
      logAudit("Foydalanuvchi yaratildi", user.id, "user", "success");
      pushToast(`${user.name} yaratildi`);
    } catch (err) {
      pushToast(err?.message || "Yaratishda xatolik", "danger");
    }
  }

  async function updateUser(id, payload) {
    try {
      const res = await usersApi.update(id, payload);
      const updated = normalizeUser(res.data?.user || res.data || payload);
      setUsers((curr) => curr.map((u) => (u.id === id ? { ...u, ...updated } : u)));
      logAudit("Foydalanuvchi yangilandi", id, "user", "info");
      pushToast("O'zgarishlar saqlandi");
    } catch (err) {
      pushToast(err?.message || "Yangilashda xatolik", "danger");
    }
  }

  async function toggleUserStatus(id) {
    const user = users.find((u) => u.id === id);
    if (!user) return;
    const isBlocked = user.status !== "blocked";
    try {
      if (isBlocked) {
        await usersApi.block(id);
      } else {
        await usersApi.unblock(id);
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
      await usersApi.remove(id);
      setUsers((curr) => curr.filter((u) => u.id !== id));
      logAudit("Foydalanuvchi o'chirildi", id, "user", "danger");
      pushToast(`${target?.name || id} o'chirildi`, "danger");
    } catch (err) {
      pushToast(err?.message || "O'chirishda xatolik", "danger");
    }
  }

  // ── Grant / Revoke Admin (local only) ────────────────────
  async function grantAdminToUser(userId) {
    const user = users.find((u) => u.id === userId);
    if (!user) return;
    try {
      const res = await usersApi.update(userId, { role: "ADMIN" });
      const updated = normalizeUser(res?.data?.user || res?.data || { ...user, role: "admin" });
      // Users dan olib tashlash va admins ga qo'shish
      setUsers((curr) => curr.filter(u => u.id !== userId));
      setAdmins((curr) => {
        const exists = curr.find(a => a.id === userId);
        if (exists) {
          return curr.map(a => a.id === userId ? { ...a, ...updated, isAdmin: true } : a);
        }
        return [{ ...updated, isAdmin: true }, ...curr];
      });
      logAudit("Admin huquqi berildi", user.name, "admin", "success");
      pushToast(`${user.name} ga admin huquqi berildi`);
    } catch (err) {
      pushToast(err?.message || "Xatolik yuz berdi", "danger");
    }
  }

  async function revokeAdminFromUser(userId) {
    const adminUser = admins.find((u) => u.id === userId) || users.find((u) => u.id === userId);
    if (!adminUser) return;
    try {
      const res = await usersApi.update(userId, { role: "USER" });
      const updated = normalizeUser(res?.data?.user || res?.data || { ...adminUser, role: "user" });
      // Admins dan olib tashlash va users ga qo'shish
      setAdmins((curr) => curr.filter((a) => a.id !== userId));
      setUsers((curr) => {
        const exists = curr.find(u => u.id === userId);
        if (exists) {
          return curr.map(u => u.id === userId ? { ...u, ...updated, isAdmin: false } : u);
        }
        return [{ ...updated, isAdmin: false }, ...curr];
      });
      logAudit("Admin huquqi olindi", adminUser.name, "admin", "warning");
      pushToast(`${adminUser.name} dan admin huquqi olindi`, "warning");
    } catch (err) {
      pushToast(err?.message || "Xatolik yuz berdi", "danger");
    }
  }

  async function createAdmin(payload) {
    try {
      const res = await adminsApi.create(payload);
      const user = normalizeUser(res.data?.user || res.data || {});
      setAdmins((curr) => [user, ...curr]);
      logAudit("Admin yaratildi", user.name, "admin", "success");
      pushToast(`${user.name} yaratildi`);
    } catch (err) {
      pushToast(err?.message || "Yaratishda xatolik", "danger");
    }
  }

  async function toggleAdminStatus(id) {
    const admin = admins.find(a => a.id === id);
    if (!admin || admin.isPrimary) return;

    try {
      await adminsApi.toggleStatus(id);
      const next = admin.status === "blocked" ? "active" : "blocked";
      setAdmins((curr) =>
        curr.map((a) => (a.id === id ? { ...a, status: next } : a))
      );
      logAudit(
        next === "blocked" ? "Admin bloklandi" : "Admin aktivlashtirildi",
        id, "admin", next === "blocked" ? "danger" : "success"
      );
      pushToast(next === "blocked" ? "Admin bloklandi" : "Admin aktivlashtirildi", next === "blocked" ? "danger" : "success");
    } catch (err) {
      pushToast(err?.message || "Xatolik yuz berdi", "danger");
    }
  }

  // ── Content ──────────────────────────────────────────────
  async function createContent(payload) {
    try {
      const res = await contentApi.create(payload);
      const data = res.data?.content || res.data || {};
      const row = { 
        id: data.id || nextId("CNT", contentRows), 
        name: data.name || payload.name,
        type: data.type || payload.type,
        status: data.status || payload.status,
        owner: data.owner || payload.owner,
        updatedAt: formatNow().slice(0, 10) 
      };
      setContentRows((curr) => [row, ...curr]);
      logAudit("Kontent yaratildi", row.name || row.id, "content", "success");
      pushToast(`"${row.name}" yaratildi`);
    } catch (err) {
      pushToast(err?.message || "Xatolik yuz berdi", "danger");
    }
  }

  async function updateContentStatus(id, status) {
    let name = id;
    try {
      await contentApi.updateStatus(id, status);
      setContentRows((curr) =>
        curr.map((c) => { if (c.id !== id) return c; name = c.name || id; return { ...c, status, updatedAt: formatNow().slice(0, 10) }; })
      );
      logAudit(`Kontent statusi: ${status}`, name, "content", "info");
      pushToast(`Kontent statusi yangilandi: ${status}`);
    } catch (err) {
      pushToast(err?.message || "Xatolik yuz berdi", "danger");
    }
  }

  async function deleteContent(id) {
    const target = contentRows.find((c) => c.id === id);
    try {
      await contentApi.remove(id);
      setContentRows((curr) => curr.filter((c) => c.id !== id));
      logAudit("Kontent o'chirildi", target?.name || id, "content", "danger");
      pushToast(`"${target?.name || id}" o'chirildi`, "danger");
    } catch (err) {
      pushToast(err?.message || "Xatolik yuz berdi", "danger");
    }
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
    logAudit("Ruxsatlar saqlandi", "Permission Matrix", "settings", "success");
    pushToast("Ruxsatlar saqlandi");
  }

  async function updateOrderStatus(id, payload) {
    try {
      const res = await ordersApi.updateStatus(id, payload);
      const updated = res.data?.order || res.data || payload;
      setOrders((curr) => curr.map((o) => (o.id === id ? { ...o, ...updated } : o)));
      logAudit("Buyurtma statusi yangilandi", id, "order", "info");
      pushToast("Buyurtma statusi yangilandi");
    } catch (err) {
      pushToast(err?.message || "Yangilashda xatolik", "danger");
    }
  }

  // ── Products ──────────────────────────────────────────────
  async function createProduct(payload) {
    try {
      const res = await productsApi.create(payload);
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
      const res = await productsApi.update(id, payload);
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
      await productsApi.remove(id);
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
      await productsApi.update(id, { isActive: next === "active" });
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
      orders, setOrders,
      pushToast, dismissToast,
      createUser, updateUser, toggleUserStatus, deleteUser,
      grantAdminToUser, revokeAdminFromUser,
      toggleAdminStatus, createAdmin,
      createContent, updateContentStatus, deleteContent,
      saveSettings,
      createRole, deleteRole,
      togglePermission, savePermissions,
      createProduct, updateProduct, deleteProduct, toggleProductStatus,
      updateOrderStatus
    }),
    [users, admins, contentRows, auditLogs, recentActivity, toasts, roles, permissionMatrix, products, orders, loading]
  );

  return createElement(AdminDataContext.Provider, { value }, children);
}

export function useAdminData() {
  const ctx = useContext(AdminDataContext);
  if (!ctx) throw new Error("useAdminData must be used within AdminDataProvider");
  return ctx;
}
