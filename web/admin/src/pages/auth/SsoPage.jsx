import { useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../../store";

const STORAGE_KEY = "savdo-admin-auth";

const ROLE_PERMISSIONS = {
  SUPER_ADMIN: [
    "dashboard.view", "users.view", "users.create", "users.update", "users.delete",
    "content.view", "content.create", "content.update", "content.delete",
    "reports.view", "reports.export", "audit_logs.view", "settings.view",
    "settings.manage", "profile.view", "profile.update", "admins.manage"
  ],
  ADMIN: [
    "dashboard.view", "users.view", "users.create", "users.update", "users.delete",
    "content.view", "content.create", "content.update", "content.delete",
    "reports.view", "reports.export", "audit_logs.view", "settings.view",
    "profile.view", "profile.update"
  ]
};

function buildProfile(user) {
  const role = user.role?.toUpperCase() || "ADMIN";
  const isPrimary = role === "SUPER_ADMIN";
  const initials = (user.name || user.email || "AD").slice(0, 2).toUpperCase();

  return {
    id: user.id,
    name: user.name || "Admin",
    email: user.email,
    role: role.toLowerCase(),
    isPrimary,
    avatar: initials,
    permissions: ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS.ADMIN,
    status: "active",
    lastLogin: { type: "today_at", time: new Date().toTimeString().slice(0, 5) }
  };
}

export function SsoPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isAuthenticated, ssoLogin } = useAuth();
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    const name     = searchParams.get("name");
    const email    = searchParams.get("email");
    const role     = searchParams.get("role");

    // URLdan ma'lumotlarni darhol tozalaymiz (history'da qolmasligi uchun)
    window.history.replaceState({}, document.title, window.location.pathname);

    // Auth endi httpOnly cookie orqali (token URL'da uzatilmaydi). Cookie localhost
    // portlar aro (5173↔5174) baham ko'riladi. Profilni React state'ga hydrate qilamiz
    // (oddiy login bilan bir xil yo'l) va SPA navigatsiya qilamiz — to'liq reload
    // qilmaymiz, aks holda AuthProvider'ning localStorage-tozalash effekti bilan
    // race bo'lib, dashboard qayta /login'ga tushib qolardi.
    if (email && ["ADMIN", "SUPER_ADMIN"].includes(role)) {
      ssoLogin({ id: "", name, email, role });
      navigate("/dashboard", { replace: true });
    } else if (isAuthenticated) {
      navigate("/dashboard", { replace: true });
    } else {
      navigate("/login", { replace: true });
    }
  }, []);

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center",
      justifyContent: "center", flexDirection: "column", gap: 16,
      background: "#0f172a", color: "#fff", fontFamily: "sans-serif"
    }}>
      <div style={{
        width: 40, height: 40, border: "4px solid #6366f1",
        borderTopColor: "transparent", borderRadius: "50%",
        animation: "spin 0.8s linear infinite"
      }} />
      <p style={{ color: "#94a3b8", fontSize: 14 }}>Admin panelga o'tilmoqda...</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
