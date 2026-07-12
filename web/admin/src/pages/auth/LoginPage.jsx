import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../store";
import { Icon } from "../../components/shared/Icon";

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ identifier: "", password: "" });
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      // Detect if identifier is phone or email
      const isPhone = /^[+]?[0-9]{7,15}$/.test(form.identifier.replace(/\s/g, ""));
      const credentials = isPhone
        ? { phone: form.identifier.replace(/\s/g, ""), password: form.password }
        : { email: form.identifier.trim(), password: form.password };

      const auth = await login(credentials);
      const role = auth?.profile?.role?.toUpperCase();
      if (role !== "ADMIN" && role !== "SUPER_ADMIN") {
        throw new Error("Ruxsat yo'q: Siz admin emassiz");
      }
      navigate("/dashboard", { replace: true });
    } catch (err) {
      const msg = err?.message || "";
      if (msg.includes("401") || msg.toLowerCase().includes("invalid")) {
        setError("Email/telefon yoki parol noto'g'ri");
      } else if (msg.includes("blocked") || msg.includes("403")) {
        setError("Akkauntingiz bloklangan. Admin bilan bog'laning.");
      } else {
        setError(msg || "Tizimga kirishda xatolik yuz berdi");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <main className="w-full max-w-[420px] bg-surface-container-lowest rounded-xl border border-outline-variant p-section-gap shadow-card flex flex-col items-center">
        {/* Header */}
        <header className="flex flex-col items-center text-center w-full mb-section-gap">
          <div className="w-14 h-14 bg-surface-container-lowest border border-outline-variant rounded-lg flex items-center justify-center overflow-hidden mb-gutter shadow-sm">
            <img src="/logo.png" alt="TradeS" className="w-full h-full object-contain p-1" />
          </div>
          <h1 className="font-display-lg-mobile text-display-lg-mobile text-on-surface">TradeS Admin</h1>
          <p className="font-body-sm text-body-sm text-on-surface-variant mt-2">
            Boshqaruv paneliga xush kelibsiz
          </p>
        </header>

        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-gutter">
          {error && (
            <div className="px-4 py-3 rounded-lg bg-error-container text-on-error-container text-body-sm border border-error/20">
              {error}
            </div>
          )}

          {/* Identifier */}
          <div className="flex flex-col gap-element-gap">
            <label htmlFor="identifier" className="font-label-caps text-label-caps text-on-surface-variant uppercase">
              Email yoki telefon
            </label>
            <div className="relative w-full">
              <Icon name="mail" className="absolute left-4 top-1/2 -translate-y-1/2 text-outline-variant text-[20px]" />
              <input
                id="identifier"
                type="text"
                required
                autoComplete="username"
                value={form.identifier}
                onChange={(e) => setForm((p) => ({ ...p, identifier: e.target.value }))}
                placeholder="admin@trades.uz"
                className="w-full h-12 pl-11 pr-4 rounded-lg border border-outline-variant bg-surface-container-lowest text-on-surface font-body-md focus:outline-none focus:border-primary-container focus:ring-2 focus:ring-primary-container/20 transition-all placeholder:text-outline"
              />
            </div>
          </div>

          {/* Password */}
          <div className="flex flex-col gap-element-gap">
            <label htmlFor="password" className="font-label-caps text-label-caps text-on-surface-variant uppercase">
              Parol
            </label>
            <div className="relative w-full">
              <Icon name="lock" className="absolute left-4 top-1/2 -translate-y-1/2 text-outline-variant text-[20px]" />
              <input
                id="password"
                type={showPw ? "text" : "password"}
                required
                autoComplete="current-password"
                value={form.password}
                onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                placeholder="••••••••"
                className="w-full h-12 pl-11 pr-11 rounded-lg border border-outline-variant bg-surface-container-lowest text-on-surface font-body-md focus:outline-none focus:border-primary-container focus:ring-2 focus:ring-primary-container/20 transition-all placeholder:text-outline"
              />
              <button
                type="button"
                onClick={() => setShowPw((v) => !v)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-outline-variant hover:text-on-surface transition-colors"
                aria-label="Parolni ko'rsatish"
              >
                <Icon name={showPw ? "visibility" : "visibility_off"} className="text-[20px]" />
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-12 mt-2 bg-primary-container text-on-primary font-title-sm text-title-sm rounded-lg hover:bg-primary transition-colors flex items-center justify-center gap-2 shadow-sm disabled:opacity-60"
          >
            {loading ? "Kirish..." : "Kirish"}
            {!loading && <Icon name="arrow_forward" className="text-[20px]" />}
          </button>
        </form>
      </main>
    </div>
  );
}
