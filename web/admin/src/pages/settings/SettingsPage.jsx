import { useEffect, useState } from "react";
import { useI18n } from "../../i18n";
import { useAuth } from "../../store";
import { useAdminData } from "../../store/adminData";
import { Icon } from "../../components/shared/Icon";

const NAV = [
  { id: "profile", label: "Profil", icon: "person" },
  { id: "security", label: "Xavfsizlik", icon: "security" },
  { id: "preference", label: "Tizim", icon: "build" }
];

const inputCls =
  "w-full px-4 py-2.5 bg-surface border border-outline-variant rounded-lg text-on-surface font-body-md focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all";
const labelCls = "block font-label-caps text-label-caps text-on-surface-variant mb-2 uppercase tracking-wider";
const saveBtnCls =
  "bg-primary-container text-on-primary-container font-title-sm text-title-sm px-6 py-2.5 rounded-lg hover:bg-primary hover:text-on-primary transition-colors";

export function SettingsPage() {
  const { locale, setLocale, supportedLocales, t } = useI18n();
  const { profile, updateProfile, changePassword } = useAuth();
  const { pushToast } = useAdminData();

  const [activeTab, setActiveTab] = useState("profile");
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: profile?.name || "", email: profile?.email || "" });
  const [pw, setPw] = useState({ current: "", next: "", confirm: "" });
  const [pwMessage, setPwMessage] = useState("");
  const [pwError, setPwError] = useState("");

  useEffect(() => {
    setForm({ name: profile?.name || "", email: profile?.email || "" });
  }, [profile?.name, profile?.email]);

  async function handleSaveProfile() {
    setSaving(true);
    try {
      await updateProfile({ name: form.name, email: form.email });
      pushToast("O'zgarishlar saqlandi");
    } catch (err) {
      pushToast(err?.message || "Xatolik yuz berdi", "danger");
    } finally {
      setSaving(false);
    }
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
    <div className="space-y-section-gap">
      <div>
        <h2 className="font-headline-md text-headline-md text-on-surface">Sozlamalar</h2>
        <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">Profil, xavfsizlik va tizim sozlamalarini boshqaring.</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Inner nav */}
        <aside className="w-full lg:w-64 shrink-0">
          <div className="bg-surface-bright rounded-xl border border-outline-variant p-2 sticky top-24">
            <nav className="flex flex-col space-y-1">
              {NAV.map((n) => (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => setActiveTab(n.id)}
                  className={`w-full text-left px-4 py-3 rounded-lg font-title-sm text-title-sm transition-colors flex items-center gap-3 ${
                    activeTab === n.id
                      ? "bg-surface-container-highest text-primary font-semibold"
                      : "text-on-surface-variant hover:bg-surface-container-low"
                  }`}
                >
                  <Icon name={n.icon} />
                  {n.label}
                </button>
              ))}
            </nav>
          </div>
        </aside>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {activeTab === "profile" && (
            <div className="bg-surface-bright border border-outline-variant rounded-xl p-6">
              <div className="mb-6 pb-4 border-b border-outline-variant">
                <h3 className="font-headline-md text-headline-md text-on-surface mb-2">Shaxsiy ma'lumotlar</h3>
                <p className="font-body-md text-body-md text-on-surface-variant">Hisobingizga oid asosiy ma'lumotlarni tahrirlang.</p>
              </div>
              <div className="space-y-6 max-w-2xl">
                <div>
                  <label className={labelCls}>Ism</label>
                  <input type="text" className={inputCls} value={form.name} onChange={(e) => setForm((c) => ({ ...c, name: e.target.value }))} />
                </div>
                <div>
                  <label className={labelCls}>Email manzili</label>
                  <input type="email" className={inputCls} value={form.email} onChange={(e) => setForm((c) => ({ ...c, email: e.target.value }))} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className={labelCls}>Rol</label>
                    <div className="w-full px-4 py-2.5 border border-outline-variant rounded-lg bg-surface-container-low text-on-surface-variant font-body-md">
                      {profile?.isPrimary ? "SUPER ADMIN" : "ADMIN"}
                    </div>
                  </div>
                  <div>
                    <label className={labelCls}>Ruxsatlar soni</label>
                    <div className="w-full px-4 py-2.5 border border-outline-variant rounded-lg bg-surface-container-low text-on-surface-variant font-body-md">
                      {profile?.permissions?.length || 0} ta ruxsat
                    </div>
                  </div>
                </div>
                <div className="pt-4 flex justify-end">
                  <button type="button" onClick={handleSaveProfile} disabled={saving} className={`${saveBtnCls} disabled:opacity-60`}>
                    {saving ? "Saqlanmoqda..." : "Saqlash"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === "security" && (
            <div className="bg-surface-bright border border-outline-variant rounded-xl p-6">
              <div className="mb-6 pb-4 border-b border-outline-variant">
                <h3 className="font-headline-md text-headline-md text-on-surface mb-2">Parolni o'zgartirish</h3>
                <p className="font-body-md text-body-md text-on-surface-variant">Hisobingiz xavfsizligi uchun kuchli paroldan foydalaning.</p>
              </div>
              <div className="space-y-6 max-w-xl">
                <div>
                  <label className={labelCls}>Joriy parol</label>
                  <input type="password" className={inputCls} value={pw.current} onChange={(e) => setPw((c) => ({ ...c, current: e.target.value }))} placeholder="••••••••" />
                </div>
                <div>
                  <label className={labelCls}>Yangi parol</label>
                  <input type="password" className={inputCls} value={pw.next} onChange={(e) => setPw((c) => ({ ...c, next: e.target.value }))} placeholder="••••••••" />
                  <p className="font-body-sm text-body-sm text-on-surface-variant mt-2">Parol kamida 8 ta belgidan iborat bo'lishi kerak.</p>
                </div>
                <div>
                  <label className={labelCls}>Yangi parolni tasdiqlang</label>
                  <input type="password" className={inputCls} value={pw.confirm} onChange={(e) => setPw((c) => ({ ...c, confirm: e.target.value }))} placeholder="••••••••" />
                </div>
                {pwError && <p className="text-body-sm text-error">{pwError}</p>}
                {pwMessage && <p className="text-body-sm text-primary">{pwMessage}</p>}
                <div className="pt-4 flex justify-end">
                  <button type="button" onClick={handleChangePassword} className={saveBtnCls}>Parolni yangilash</button>
                </div>
              </div>
            </div>
          )}

          {activeTab === "preference" && (
            <div className="bg-surface-bright border border-outline-variant rounded-xl p-6">
              <div className="mb-6 pb-4 border-b border-outline-variant">
                <h3 className="font-headline-md text-headline-md text-on-surface mb-2">Tizim sozlamalari</h3>
                <p className="font-body-md text-body-md text-on-surface-variant">Interfeys tili va ko'rinish sozlamalari.</p>
              </div>
              <div className="space-y-6 max-w-xl">
                <div>
                  <label className={labelCls}>Interfeys tili</label>
                  <div className="flex flex-wrap gap-2">
                    {supportedLocales.map((code) => (
                      <button
                        key={code}
                        type="button"
                        onClick={() => setLocale(code)}
                        className={`px-4 py-2 text-body-sm rounded-lg transition-colors ${
                          locale === code
                            ? "bg-primary-container text-on-primary-container font-medium"
                            : "bg-surface-container-low text-on-surface hover:bg-surface-container"
                        }`}
                      >
                        {t(`languages.${code}`, {}, code.toUpperCase())}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex items-center justify-between py-4 border-t border-outline-variant">
                  <div>
                    <p className="font-title-sm text-title-sm text-on-surface">Ko'rinish</p>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">Hozircha faqat yorug' (light) tema qo'llab-quvvatlanadi.</p>
                  </div>
                  <span className="px-3 py-1.5 rounded-full bg-primary-container/20 text-on-primary-container text-body-sm font-medium">Yorug'</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
