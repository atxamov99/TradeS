import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../store";

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ identifier: "", password: "" });
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
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ background: "var(--app-bg)" }}
    >
      <div
        className="w-full max-w-md rounded-2xl shadow-xl p-8"
        style={{ background: "var(--card-bg)", color: "var(--text-primary)" }}
      >
        {/* Logo / Header */}
        <div className="text-center mb-8">
          <img
            src="/logo-dark.png"
            alt="TradeS"
            className="w-14 h-14 object-contain mx-auto mb-4"
          />
          <h1 className="text-2xl font-bold">Savdo Admin</h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
            Admin paneliga kirish
          </p>
        </div>

        {error && (
          <div className="mb-4 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>
              Email yoki telefon raqam
            </label>
            <input
              type="text"
              required
              autoComplete="username"
              value={form.identifier}
              onChange={(e) => setForm((p) => ({ ...p, identifier: e.target.value }))}
              className="w-full px-4 py-3 rounded-xl border text-sm outline-none focus:ring-2 focus:ring-indigo-500"
              style={{
                background: "var(--input-bg, #f9fafb)",
                borderColor: "var(--border-color, #e5e7eb)",
                color: "#000",
              }}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>
              Parol
            </label>
            <input
              type="password"
              required
              autoComplete="current-password"
              value={form.password}
              onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
              className="w-full px-4 py-3 rounded-xl border text-sm outline-none focus:ring-2 focus:ring-indigo-500 text-black"
              style={{
                background: "var(--input-bg, #f9fafb)",
                borderColor: "var(--border-color, #e5e7eb)",
                color: "#000",
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-semibold text-sm transition-colors disabled:opacity-60"
          >
            {loading ? "Kirish..." : "Kirish"}
          </button>
        </form>
      </div>
    </div>
  );
}
