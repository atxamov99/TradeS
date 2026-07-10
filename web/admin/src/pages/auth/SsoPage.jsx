import { useEffect, useRef } from "react";
import axios from "axios";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../../store";
import { appConfig } from "../../config/appConfig";
import { authApi } from "../../services/api/auth.api";

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
  const { ssoLogin } = useAuth();
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    const accessToken = searchParams.get("accessToken");

    // URLdan ma'lumotlarni darhol tozalaymiz (history'da qolmasligi uchun)
    window.history.replaceState({}, document.title, window.location.pathname);

    // Mobil ilova — foydalanuvchi allaqachon Bearer accessToken bilan tizimga
    // kirgan (cookie'siz, native http client). Uni shu accessToken bilan
    // /auth/sso-adopt'ga yuboramiz — u admin panelning O'Z origin'ida yangi
    // httpOnly cookie sessiyasini o'rnatadi.
    if (accessToken) {
      axios
        .post(
          `${appConfig.apiBaseUrl}/auth/sso-adopt`,
          {},
          { headers: { Authorization: `Bearer ${accessToken}` }, withCredentials: true }
        )
        .then(({ data }) => {
          const user = data?.data?.user;
          if (!user || !["ADMIN", "SUPER_ADMIN"].includes(user.role?.toUpperCase())) {
            throw new Error("Ruxsat yo'q");
          }
          ssoLogin({ id: user.id, name: user.name, email: user.email, role: user.role });
          navigate("/dashboard", { replace: true });
        })
        .catch(() => navigate("/login", { replace: true }));
      return;
    }

    // Auth endi httpOnly cookie orqali (token URL'da uzatilmaydi). Cookie localhost
    // portlar aro (5173↔5174) baham ko'riladi — lekin shu sababli brauzerda oldin
    // qolgan boshqa (masalan oddiy USER) sessiyaning cookie'si bo'lishi mumkin.
    // Query paramlardagi email/role'ga ishonib to'g'ridan-to'g'ri dashboardga
    // kiritish xavfli edi (adminsiz odam ham "admin" holatida ko'rinardi va
    // keyinchalik har bir yozish amali serverda 403/404 bilan qulardi). Shuning
    // uchun sessiyani /auth/me orqali backendda tasdiqlab, faqat shundan keyin
    // haqiqiy foydalanuvchi ma'lumoti bilan dashboardga o'tamiz.
    authApi
      .getMe()
      .then(({ data }) => {
        const user = data?.user;
        if (!user || !["ADMIN", "SUPER_ADMIN"].includes(user.role?.toUpperCase())) {
          throw new Error("Ruxsat yo'q");
        }
        ssoLogin({ id: user.id, name: user.name, email: user.email, role: user.role });
        navigate("/dashboard", { replace: true });
      })
      .catch(() => navigate("/login", { replace: true }));
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
