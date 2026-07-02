import { useEffect, useState } from "react";
import { useI18n } from "../../i18n";
import { useAuth } from "../../store";
import { useAdminData } from "../../store/adminData";
import { useTheme } from "../../theme";

const tabs = (t) => [
  { id: "profile",    label: t("settings.profileSettings") },
  { id: "security",   label: t("settings.securitySettings") },
  { id: "preference", label: t("settings.notificationSettings") }
];

export function SettingsPage() {
  const { locale, setLocale, supportedLocales, t } = useI18n();
  const { profile, updateProfile, changePassword } = useAuth();
  const { saveSettings } = useAdminData();
  const { theme, setTheme } = useTheme();

  const [activeTab, setActiveTab] = useState("profile");
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: profile?.name || "",
    email: profile?.email || ""
  });
  const [pw, setPw] = useState({ current: "", next: "", confirm: "" });
  const [pwMessage, setPwMessage] = useState("");
  const [pwError, setPwError] = useState("");

  // Profile form ni profile ga sinxronlash
  useEffect(() => {
    setForm({
      name: profile?.name || "",
      email: profile?.email || ""
    });
  }, [profile?.name, profile?.email]);

  async function handleSaveProfile() {
    setSaving(true);
    try {
      await updateProfile({ name: form.name, email: form.email });
      saveSettings(t("settings.profileSettings"));
    } finally {
      setSaving(false);
    }
  }

  function handleApplyLanguage(code) {
    setLocale(code);
  }

  async function handleChangePassword() {
    setPwMessage("");
    setPwError("");
    if (pw.next !== pw.confirm) {
      setPwError("Yangi parollar mos kelmayapti");
      return;
    }
    try {
      await changePassword({ currentPassword: pw.current, newPassword: pw.next });
      setPwMessage("Parol muvaffaqiyatli yangilandi");
      setPw({ current: "", next: "", confirm: "" });
    } catch (err) {
      setPwError(err?.message || "Xatolik yuz berdi");
    }
  }

  return (
    <div className="max-w-4xl space-y-5">
      <div className="bg-white rounded-2xl shadow-card">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">{t("settings.pageTitle")}</h2>
          <p className="text-xs text-gray-400 mt-0.5">{t("settings.description")}</p>
        </div>

        <div className="flex gap-1 px-5 pt-4 border-b border-gray-100 overflow-x-auto">
          {tabs(t).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 text-sm rounded-t-xl transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? "bg-primary text-white font-medium"
                  : "text-gray-500 hover:text-gray-800 hover:bg-gray-100"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-5">
          {activeTab === "profile" && (
            <div className="space-y-4 max-w-md">
              {[
                { l: t("settings.displayName"), n: "name", tp: "text" },
                { l: t("common.email"), n: "email", tp: "email" }
              ].map((f) => (
                <div key={f.n}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{f.l}</label>
                  <input
                    type={f.tp}
                    value={form[f.n]}
                    onChange={(e) => setForm((c) => ({ ...c, [f.n]: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>
              ))}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rol</label>
                <div className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl bg-gray-50 text-gray-700">
                  {profile?.isPrimary ? t("labels.roles.super_admin") : t("labels.roles.admin")}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ruxsatlar soni</label>
                <div className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl bg-gray-50 text-gray-700">
                  {profile?.permissions?.length || 0} ta ruxsat
                </div>
              </div>
              <button
                type="button"
                onClick={handleSaveProfile}
                disabled={saving}
                className="px-5 py-2.5 bg-primary hover:bg-primary-dark text-white text-sm font-medium rounded-xl transition-colors disabled:opacity-60"
              >
                {saving ? "Saqlanmoqda..." : t("common.saveChanges")}
              </button>
            </div>
          )}

          {activeTab === "security" && (
            <div className="space-y-4 max-w-md">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Joriy parol</label>
                <input
                  type="password"
                  value={pw.current}
                  onChange={(e) => setPw((c) => ({ ...c, current: e.target.value }))}
                  placeholder="********"
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t("auth.newPassword")}</label>
                <input
                  type="password"
                  value={pw.next}
                  onChange={(e) => setPw((c) => ({ ...c, next: e.target.value }))}
                  placeholder="********"
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t("auth.confirmPassword")}</label>
                <input
                  type="password"
                  value={pw.confirm}
                  onChange={(e) => setPw((c) => ({ ...c, confirm: e.target.value }))}
                  placeholder="********"
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
              {pwError && <p className="text-xs text-red-600">{pwError}</p>}
              {pwMessage && <p className="text-xs text-green-600">{pwMessage}</p>}
              <div className="flex items-start gap-3 p-4 bg-yellow-50 border border-yellow-100 rounded-xl">
                <span className="text-yellow-500 mt-0.5">!</span>
                <p className="text-xs text-yellow-700">{t("settings.securityNote")}</p>
              </div>
              <button
                type="button"
                onClick={handleChangePassword}
                className="px-5 py-2.5 bg-primary hover:bg-primary-dark text-white text-sm font-medium rounded-xl transition-colors"
              >
                {t("auth.saveNewPassword")}
              </button>
            </div>
          )}

          {activeTab === "preference" && (
            <div className="space-y-4 max-w-md">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t("settings.languagePreference")}</label>
                <div className="flex flex-wrap gap-2">
                  {supportedLocales.map((code) => (
                    <button
                      key={code}
                      type="button"
                      onClick={() => handleApplyLanguage(code)}
                      className={`px-4 py-2 text-sm rounded-xl transition-colors ${
                        locale === code
                          ? "bg-primary text-white font-medium"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      {t(`languages.${code}`)}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  Hozirgi til: <span className="font-medium text-gray-700">{t(`languages.${locale}`)}</span>
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tema</label>
                <div className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl bg-gray-50 text-gray-700">
                  {theme === "dark" ? "Qora (Dark)" : "Yorug' (Light)"}
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  Hozircha faqat qora tema qo'llab quvvatlanadi.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}