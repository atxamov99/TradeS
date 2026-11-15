import { useState } from "react";
import { View, Text, TouchableOpacity, Switch } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Alert } from "@/utils/alert";
import { useTheme } from "@/hooks/useTheme";
import { useThemeStore } from "@/store/themeStore";
import { useLangStore } from "@/store/langStore";
import { useUserStore } from "@/store/userStore";
import { useAuthStore } from "@/store/authStore";
import { useAT } from "@/i18n/admin";
import { adminApi, errText } from "@/services/adminApi";
import { clearLocalData } from "@/services/syncEngine";
import LinkIdentifierModal from "@/components/LinkIdentifierModal";
import { ACard, AScreen, Btn, Field, Sheet } from "@/components/admin/ui";

export default function AdminSettings() {
  const { c, isDark } = useTheme();
  const t = useAT();
  const toggleTheme = useThemeStore((s) => s.toggleTheme);
  const { lang, setLang } = useLangStore();
  const user = useUserStore((s) => (s as any).user);
  const setUser = useUserStore((s) => (s as any).setUser);
  const clearUser = useUserStore((s) => s.clearUser);
  const clearToken = useAuthStore((s) => s.clearToken);

  const [name, setName] = useState(user?.name || "");
  const [pwOpen, setPwOpen] = useState(false);
  const [pw, setPw] = useState({ current: "", next: "" });
  const [link, setLink] = useState<"email" | "phone" | null>(null);
  const [busy, setBusy] = useState(false);

  async function saveName() {
    const v = name.trim();
    if (!v || v === user?.name) return;
    try {
      const res: any = await adminApi.updateProfile({ name: v });
      await setUser({ ...user, name: res?.user?.name ?? v });
      Alert.toast(t.saved, "success");
    } catch (e: any) {
      Alert.alert(t.error, errText(e));
    }
  }

  async function savePw() {
    if (!pw.current || !pw.next) return;
    setBusy(true);
    try {
      await adminApi.changePassword({ currentPassword: pw.current, newPassword: pw.next });
      Alert.toast(t.passwordChanged, "success");
      setPwOpen(false);
      setPw({ current: "", next: "" });
    } catch (e: any) {
      Alert.alert(t.error, errText(e));
    } finally {
      setBusy(false);
    }
  }

  async function logout() {
    await clearLocalData().catch(() => {});
    clearUser();
    clearToken();
  }

  const Row = ({ icon, label, sub, right, onPress }: { icon: keyof typeof Ionicons.glyphMap; label: string; sub?: string; right?: React.ReactNode; onPress?: () => void }) => (
    <TouchableOpacity activeOpacity={onPress ? 0.7 : 1} onPress={onPress} style={{ flexDirection: "row", alignItems: "center", paddingVertical: 12 }}>
      <View style={{ width: 36, height: 36, borderRadius: 11, backgroundColor: c.bgMuted, alignItems: "center", justifyContent: "center", marginRight: 12 }}>
        <Ionicons name={icon} size={18} color={c.textSub} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ color: c.text, fontWeight: "700", fontSize: 14 }}>{label}</Text>
        {!!sub && <Text style={{ color: c.textMuted, fontSize: 12, marginTop: 1 }} numberOfLines={1}>{sub}</Text>}
      </View>
      {right}
    </TouchableOpacity>
  );

  const langs: ("uz" | "ru" | "en")[] = ["uz", "ru", "en"];

  return (
    <AScreen title={t.settingsTitle} back>
      <ACard>
        <Text style={{ color: c.textMuted, fontSize: 11, fontWeight: "800", marginBottom: 10 }}>{t.profile.toUpperCase()}</Text>
        <Field label={t.name} value={name} onChangeText={setName} autoCapitalize="words" onEndEditing={saveName} />
        <Btn label={t.save} small onPress={saveName} disabled={!name.trim() || name.trim() === user?.name} />
        <Row icon="call-outline" label={t.linkPhone} sub={user?.phone || t.notLinked} right={<Ionicons name="chevron-forward" size={18} color={c.textMuted} />} onPress={() => setLink("phone")} />
        <Row icon="mail-outline" label={t.linkEmail} sub={user?.email || t.notLinked} right={<Ionicons name="chevron-forward" size={18} color={c.textMuted} />} onPress={() => setLink("email")} />
        <Row icon="lock-closed-outline" label={t.changePassword} right={<Ionicons name="chevron-forward" size={18} color={c.textMuted} />} onPress={() => setPwOpen(true)} />
      </ACard>

      <ACard>
        <Text style={{ color: c.textMuted, fontSize: 11, fontWeight: "800", marginBottom: 6 }}>{t.language.toUpperCase()}</Text>
        <View style={{ flexDirection: "row", gap: 8, marginBottom: 6 }}>
          {langs.map((l) => (
            <TouchableOpacity key={l} onPress={() => setLang(l)} style={{ flex: 1, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center", backgroundColor: lang === l ? c.primary : c.bgMuted }}>
              <Text style={{ color: lang === l ? "#fff" : c.textSub, fontWeight: "800" }}>{l.toUpperCase()}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <Row icon={isDark ? "moon" : "sunny"} label={t.theme} right={<Switch value={isDark} onValueChange={toggleTheme} trackColor={{ false: c.border, true: c.primaryDark }} thumbColor={isDark ? c.primary : "#fff"} />} />
      </ACard>

      <Btn label={t.logout} tone="danger" icon="log-out-outline" onPress={logout} />

      <Sheet
        visible={pwOpen}
        title={t.changePassword}
        onClose={() => setPwOpen(false)}
        footer={<><View style={{ flex: 1 }}><Btn label={t.cancel} tone="ghost" onPress={() => setPwOpen(false)} /></View><View style={{ flex: 2 }}><Btn label={t.save} onPress={savePw} disabled={busy || !pw.current || !pw.next} /></View></>}
      >
        <Field label={t.currentPassword} value={pw.current} onChangeText={(v) => setPw({ ...pw, current: v })} secureTextEntry />
        <Field label={t.newPassword} value={pw.next} onChangeText={(v) => setPw({ ...pw, next: v })} secureTextEntry />
      </Sheet>

      <LinkIdentifierModal kind={link} onClose={() => setLink(null)} />
    </AScreen>
  );
}
