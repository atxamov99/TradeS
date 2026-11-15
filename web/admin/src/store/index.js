import { tx } from "../i18n";
import {
  createContext,
  createElement,
  useContext,
  useEffect,
  useMemo,
  useState
} from "react";
import { authApi } from "../services/api/auth.api";
import { adminTokens } from "../services/http";

const STORAGE_KEY = "savdo-admin-auth";

// Single ADMIN tier system-wide (owner decision, 2026-07-22) — one set of
// permissions, no second/lesser admin tier.
const ROLE_PERMISSIONS = {
  ADMIN: [
    "dashboard.view", "users.view", "users.create", "users.update", "users.delete",
    "content.view", "content.create", "content.update", "content.delete",
    "reports.view", "reports.export", "audit_logs.view", "settings.view",
    "settings.manage", "profile.view", "profile.update", "admins.manage"
  ]
};

function buildProfile(user) {
  const role = user.role?.toUpperCase() || "ADMIN";
  const isPrimary = role === "ADMIN";
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
    const handle = () => { adminTokens.clear(); setAuth(null); };
    window.addEventListener("auth:logout", handle);
    return () => window.removeEventListener("auth:logout", handle);
  }, []);

  // The stored profile says "admin", but the server is the judge: if this account lost its admin rights (or was
  // blocked) the panel must not stay open on a stale profile — it asks /auth/me and signs out when it is no admin.
  useEffect(() => {
    if (!auth) return;
    authApi.getMe()
      .then((res) => {
        const role = String(res?.data?.user?.role || "").toUpperCase();
        if (role && role !== "ADMIN") window.dispatchEvent(new Event("auth:logout"));
      })
      .catch(() => { /* 401/403 are handled by the http layer; network errors are ignored */ });
  }, [auth?.profile?.id]);

  // One login for the site and the panel (same host): if somebody is already signed in on the website as an ADMIN,
  // the panel takes that session over silently instead of asking for the password again.
  useEffect(() => {
    if (auth) return undefined;
    let stop = false;
    authApi.ssoAdopt()
      .then((res) => {
        const user = res?.data?.user;
        if (stop || !user || String(user.role).toUpperCase() !== 'ADMIN') return;
        if (res.data.accessToken) adminTokens.set(res.data);
        setAuth({ token: 'cookie-managed', profile: buildProfile(user) });
      })
      .catch(() => { /* not signed in on the website: show the login form */ });
    return () => { stop = true; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // A session that has a profile but no tokens of its own (older login / website SSO) relied on a cookie that
  // any other login on this host can overwrite. Take the panel's own tokens once; if the cookie belongs to
  // somebody who is not an admin the server refuses and the panel asks for a fresh admin login.
  useEffect(() => {
    if (!auth || adminTokens.get()?.accessToken) return;
    authApi.ssoAdopt()
      .then((res) => { if (res?.data?.accessToken) adminTokens.set(res.data); })
      .catch(() => window.dispatchEvent(new Event("auth:logout")));
  }, [auth]);

  const value = useMemo(
    () => ({
      auth,
      profile: auth?.profile ?? null,
      isAuthenticated: Boolean(auth),

      login: async (credentials) => {
        const res = await authApi.login(credentials);
        // The account has a Telegram sign-in code: the panel cannot ask for it, the website can (same host).
        if (res.data?.requiresDeviceConfirmation) { const e = new Error('CODE_REQUIRED'); e.codeRequired = true; throw e; }
        const { user } = res.data;
        if (res.data?.accessToken) adminTokens.set(res.data);
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
          throw new Error(tx("msg.parol_talab_qilinadi"));
        }
        await authApi.changePassword({ currentPassword, newPassword });
        return { success: true };
      },

      logout: async () => {
        try {
          await authApi.logout();
        } catch { /* ignore */ }
        adminTokens.clear();
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
