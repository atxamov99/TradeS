import { tx } from "../../i18n";
import { useEffect, useState } from "react";
import { useI18n } from "../../i18n";
import { useAuth } from "../../store";
import { useAdminData } from "../../store/adminData";
import { Icon } from "../../components/shared/Icon";

const NAV = [
  { id: "profile", label: "navigation.menu.profile.label", icon: "person" },
  { id: "security", label: "reports.security", icon: "security" },
  { id: "preference", label: "settings.system", icon: "build" }
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
      pushToast(tx("msg.o_zgarishlar_saqlandi"));
    } catch (err) {
      pushToast(err?.message || tx("msg.xatolik_yuz_berdi"), "danger");
    } finally {
      setSaving(false);
    }
  }

  async function handleChangePassword() {
    setPwMessage("");
    setPwError("");
    if (pw.next !== pw.confirm) {
      setPwError(tx("msg.yangi_parollar_mos_kelmayapti"));
      return;
    }
    try {
      await changePassword({ currentPassword: pw.current, newPassword: pw.next });
      setPwMessage(tx("msg.parol_muvaffaqiyatli_yangilandi"));
      setPw({ current: "", next: "", confirm: "" });
    } catch (err) {
      setPwError(err?.message || tx("msg.xatolik_yuz_berdi"));
    }
  }

  return (
    <div className="space-y-section-gap">
      <div>
        <h2 className="font-headline-md text-headline-md text-on-surface">{t("navigation.menu.settings.label")}</h2>
        <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">{t("settings.subtitle")}</p>
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
                  {t(n.label)}
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
                <h3 className="font-headline-md text-headline-md text-on-surface mb-2">{t("settings.personalInfo")}</h3>
                <p className="font-body-md text-body-md text-on-surface-variant">{t("settings.personalInfoHint")}</p>
              </div>
              <div className="space-y-6 max-w-2xl">
                <div>
                  <label className={labelCls}>{t("settings.name")}</label>
                  <input type="text" className={inputCls} value={form.name} onChange={(e) => setForm((c) => ({ ...c, name: e.target.value }))} />
                </div>
                <div>
                  <label className={labelCls}>{t("settings.email")}</label>
                  <input type="email" className={inputCls} value={form.email} onChange={(e) => setForm((c) => ({ ...c, email: e.target.value }))} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className={labelCls}>{t("common.role")}</label>
                    <div className="w-full px-4 py-2.5 border border-outline-variant rounded-lg bg-surface-container-low text-on-surface-variant font-body-md">
                      {t("labels.roles.admin")}
                    </div>
                  </div>
                  <div>
                    <label className={labelCls}>{t("settings.permissionCount")}</label>
                    <div className="w-full px-4 py-2.5 border border-outline-variant rounded-lg bg-surface-container-low text-on-surface-variant font-body-md">
                      {tx("msg.permCount", { n: profile?.permissions?.length || 0 })}
                    </div>
                  </div>
                </div>
                <div className="pt-4 flex justify-end">
                  <button type="button" onClick={handleSaveProfile} disabled={saving} className={`${saveBtnCls} disabled:opacity-60`}>
                    {saving ? tx("msg.saqlanmoqda_dots") : tx("msg.saqlash")}
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === "security" && (
            <div className="bg-surface-bright border border-outline-variant rounded-xl p-6">
              <div className="mb-6 pb-4 border-b border-outline-variant">
                <h3 className="font-headline-md text-headline-md text-on-surface mb-2">{t("settings.changePassword")}</h3>
                <p className="font-body-md text-body-md text-on-surface-variant">{t("settings.passwordHint")}</p>
              </div>
              <div className="space-y-6 max-w-xl">
                <div>
                  <label className={labelCls}>{t("settings.currentPassword")}</label>
                  <input type="password" className={inputCls} value={pw.current} onChange={(e) => setPw((c) => ({ ...c, current: e.target.value }))} placeholder="••••••••" />
                </div>
                <div>
                  <label className={labelCls}>{t("auth.newPassword")}</label>
                  <input type="password" className={inputCls} value={pw.next} onChange={(e) => setPw((c) => ({ ...c, next: e.target.value }))} placeholder="••••••••" />
                  <p className="font-body-sm text-body-sm text-on-surface-variant mt-2">{t("settings.passwordMin")}</p>
                </div>
                <div>
                  <label className={labelCls}>{t("settings.confirmPassword")}</label>
                  <input type="password" className={inputCls} value={pw.confirm} onChange={(e) => setPw((c) => ({ ...c, confirm: e.target.value }))} placeholder="••••••••" />
                </div>
                {pwError && <p className="text-body-sm text-error">{pwError}</p>}
                {pwMessage && <p className="text-body-sm text-primary">{pwMessage}</p>}
                <div className="pt-4 flex justify-end">
                  <button type="button" onClick={handleChangePassword} className={saveBtnCls}>{t("auth.resetPasswordTitle")}</button>
                </div>
              </div>
            </div>
          )}

          {activeTab === "preference" && (
            <div className="bg-surface-bright border border-outline-variant rounded-xl p-6">
              <div className="mb-6 pb-4 border-b border-outline-variant">
                <h3 className="font-headline-md text-headline-md text-on-surface mb-2">{t("settings.systemSettings")}</h3>
                <p className="font-body-md text-body-md text-on-surface-variant">{t("settings.appearanceHint")}</p>
              </div>
              <div className="space-y-6 max-w-xl">
                <div>
                  <label className={labelCls}>{t("settings.language")}</label>
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
                    <p className="font-title-sm text-title-sm text-on-surface">{t("settings.appearance")}</p>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">{tx("msg.hozircha_faqat_yorug_light_tema_qo_lla")}</p>
                  </div>
                  <span className="px-3 py-1.5 rounded-full bg-primary-container/20 text-on-primary-container text-body-sm font-medium">{t("settings.light")}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
