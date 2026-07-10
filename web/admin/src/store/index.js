import {
  createContext,
  createElement,
  useContext,
  useEffect,
  useMemo,
  useState
} from "react";
import { authApi } from "../services/api/auth.api";

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
    id: user._id || user.id,
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

function getStoredAuth() {
  if (typeof window === "undefined") return null;
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;
    const parsed = JSON.parse(stored);
    return {
      profile: parsed.profile,
      token: "cookie-managed" // Mark as authenticated via cookies
    };
  } catch {
    return null;
  }
}

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(() => getStoredAuth());

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (auth) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({
        profile: auth.profile,
        token: "cookie-managed"
      }));
    } else {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }, [auth]);

  useEffect(() => {
    const handle = () => setAuth(null);
    window.addEventListener("auth:logout", handle);
    return () => window.removeEventListener("auth:logout", handle);
  }, []);

  const value = useMemo(
    () => ({
      auth,
      profile: auth?.profile ?? null,
      isAuthenticated: Boolean(auth),

      login: async (credentials) => {
        const res = await authApi.login(credentials);
        const { user } = res.data;
        const profile = buildProfile(user);
        const nextAuth = { token: "cookie-managed", profile };
        setAuth(nextAuth);
        return nextAuth;
      },

      // SSO handoff from the web app: the auth cookie is already set (shared across
      // localhost ports), so we just hydrate the profile into React state — same path
      // as a normal login, avoiding the full-reload race that cleared localStorage.
      ssoLogin: (userLike) => {
        const profile = buildProfile(userLike);
        const nextAuth = { token: "cookie-managed", profile };
        setAuth(nextAuth);
        return nextAuth;
      },

      updateProfile: async (changes) => {
        const res = await authApi.updateProfile(changes);
        const user = res?.data?.user;
        setAuth((curr) =>
          curr
            ? {
                ...curr,
                profile: {
                  ...curr.profile,
                  ...(user
                    ? { name: user.name, email: user.email, phone: user.phone }
                    : changes)
                }
              }
            : curr
        );
        return { success: true };
      },

      changePassword: async ({ currentPassword, newPassword }) => {
        if (!currentPassword || !newPassword) {
          throw new Error("Parol talab qilinadi");
        }
        await authApi.changePassword({ currentPassword, newPassword });
        return { success: true };
      },

      logout: async () => {
        try {
          await authApi.logout();
        } catch { /* ignore */ }
        setAuth(null);
      },

      hasPermission: (permission) =>
        Boolean(auth?.profile?.permissions?.includes(permission))
    }),
    [auth]
  );

  return createElement(AuthContext.Provider, { value }, children);
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
