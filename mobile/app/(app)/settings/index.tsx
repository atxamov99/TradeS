import { useState } from "react";
import { View, Text, TouchableOpacity, ScrollView, Alert, Switch, Modal, TextInput } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "@/store/authStore";
import { useUserStore } from "@/store/userStore";
import { useLangStore } from "@/store/langStore";
import { useThemeStore } from "@/store/themeStore";
import { useTheme } from "@/hooks/useTheme";
import { useT } from "@/hooks/useT";
import { useRoleStore } from "@/store/roleStore";
import { api } from "@/services/api";
import { Lang } from "@/i18n";
import { clearLocalData } from "@/services/syncEngine";

const LANGS: { code: Lang; label: string; flag: string }[] = [
  { code: "uz", label: "O'zbek", flag: "🇺🇿" },
  { code: "ru", label: "Русский", flag: "🇷🇺" },
  { code: "en", label: "English", flag: "🇬🇧" },
];

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const { c } = useTheme();
  return (
    <View style={{ paddingHorizontal: 16, marginBottom: 6 }}>
      <Text style={{ color: c.textMuted, fontSize: 10, fontWeight: "700", letterSpacing: 1.2, marginBottom: 6, marginLeft: 4 }}>
        {title.toUpperCase()}
      </Text>
      <View style={{ backgroundColor: c.bgCard, borderRadius: 14, overflow: "hidden", borderWidth: 1, borderColor: c.border }}>
        {children}
      </View>
    </View>
  );
}

function Row({ iconName, iconBg, label, sub, right, onPress, danger }: {
  iconName: React.ComponentProps<typeof Ionicons>["name"];
  iconBg?: string;
  label: string;
  sub?: string;
  right?: React.ReactNode;
  onPress?: () => void;
  danger?: boolean;
}) {
  const { c } = useTheme();
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
      style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 14, paddingVertical: 12 }}
    >
      <View style={{ width: 34, height: 34, backgroundColor: danger ? "#FEE2E2" : (iconBg || c.bgMuted), borderRadius: 10, alignItems: "center", justifyContent: "center", marginRight: 10 }}>
        <Ionicons name={iconName} size={18} color={danger ? c.danger : c.textSub} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ color: danger ? c.danger : c.text, fontWeight: "700", fontSize: 13 }}>{label}</Text>
        {sub && <Text style={{ color: c.textMuted, fontSize: 11, marginTop: 1 }}>{sub}</Text>}
      </View>
      {right}
    </TouchableOpacity>
  );
}

function Divider() {
  const { c } = useTheme();
  return <View style={{ height: 1, backgroundColor: c.border, marginLeft: 58 }} />;
}

export default function ProfileScreen() {
  const clearToken = useAuthStore((s) => s.clearToken);
  const { user, setUser, clearUser } = useUserStore();
  const { lang, setLang } = useLangStore();
  const { isDark, toggleTheme } = useThemeStore();
  const { c } = useTheme();
  const t = useT();
  const { isAdmin } = useRoleStore();

  const [emailModalVisible, setEmailModalVisible] = useState(false);
  const [emailInput, setEmailInput] = useState("");
  const [emailSaving, setEmailSaving] = useState(false);

  function handleLogout() {
    Alert.alert(t.settings.logout, t.settings.logoutConfirm, [
      { text: t.products.cancel, style: "cancel" },
      {
        text: t.settings.logout,
        style: "destructive",
        onPress: async () => {
          // Avval lokal bazani tozalaymiz (audit: HIGH H3) — shu qurilmadagi keyingi
          // foydalanuvchi avvalgi hisobning ma'lumotlarini ko'rmasin.
          await clearLocalData().catch(() => {});
          clearUser();
          clearToken();
        },
      },
    ]);
  }

  function openEmailModal() {
    setEmailInput(user?.email || "");
    setEmailModalVisible(true);
  }

  async function handleSaveEmail() {
    const trimmed = emailInput.trim().toLowerCase();
    if (trimmed && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      Alert.alert(t.common.error, "To'g'ri email manzil kiriting");
      return;
    }
    setEmailSaving(true);
    try {
      const res = await api.patch("/users/profile", { email: trimmed });
      const data = res.data?.data ?? res.data;
      const updated = data?.user ?? data;
      await setUser({ ...user, email: updated?.email ?? trimmed });
      setEmailModalVisible(false);
    } catch (e: any) {
      Alert.alert(t.common.error, e.response?.data?.message || "Email saqlashda xatolik");
    } finally {
      setEmailSaving(false);
    }
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: c.bg }} showsVerticalScrollIndicator={false}>

      {/* Profile Header */}
      <View style={{ backgroundColor: c.bg, paddingHorizontal: 16, paddingTop: 48, paddingBottom: 16 }}>
        <Text style={{ color: c.text, fontSize: 22, fontWeight: "800", marginBottom: 14 }}>{t.nav.profile}</Text>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 14, backgroundColor: c.bgCard, borderRadius: 16, padding: 14, borderWidth: 1, borderColor: c.border }}>
          <View style={{ width: 52, height: 52, backgroundColor: c.primary + "20", borderRadius: 26, alignItems: "center", justifyContent: "center" }}>
            <Ionicons name="person" size={24} color={c.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: c.text, fontWeight: "800", fontSize: 16 }}>{user?.name || "Savdogar"}</Text>
            <Text style={{ color: c.textMuted, fontSize: 12, marginTop: 2 }}>{user?.phone || "v1.0.0"}</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={c.border} />
        </View>
      </View>



      {/* Language */}
      <Section title={t.settings.language}>
        {LANGS.map((l, idx) => (
          <View key={l.code}>
            <TouchableOpacity
              style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 14 }}
              onPress={() => setLang(l.code)}
            >
              <View style={{ width: 38, height: 38, backgroundColor: c.bgMuted, borderRadius: 12, alignItems: "center", justifyContent: "center", marginRight: 12 }}>
                <Text style={{ fontSize: 20 }}>{l.flag}</Text>
              </View>
              <Text style={{ flex: 1, color: c.text, fontWeight: "700", fontSize: 14 }}>{l.label}</Text>
              {lang === l.code && (
                <View style={{ backgroundColor: c.primary, borderRadius: 10, padding: 4 }}>
                  <Ionicons name="checkmark" size={13} color="#fff" />
                </View>
              )}
            </TouchableOpacity>
            {idx < LANGS.length - 1 && <Divider />}
          </View>
        ))}
      </Section>

      {/* Business */}
      <Section title="Biznes">
        <Row
          iconName="bar-chart"
          iconBg="#EDE9FE"
          label={t.reports.title}
          sub={t.reports.totalRevenue}
          right={<Ionicons name="chevron-forward" size={18} color={c.textMuted} />}
          onPress={() => router.push("/reports")}
        />
      </Section>

      {/* Team */}
      <Section title={t.employees.title}>
        <Row
          iconName="people"
          iconBg="#D1FAE5"
          label={t.employees.title}
          sub={t.common.comingSoon}
          right={
            <View style={{ backgroundColor: c.bgMuted, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 }}>
              <Text style={{ color: c.textMuted, fontSize: 10, fontWeight: "700" }}>{t.common.comingSoon}</Text>
            </View>
          }
          onPress={() => Alert.alert(t.common.comingSoon, t.common.comingSoonMsg)}
        />
      </Section>

      {/* Appearance */}
      <Section title={t.settings.appearance}>
        <Row
          iconName={isDark ? "moon" : "sunny"}
          iconBg="#FEF3C7"
          label={t.settings.theme}
          sub={isDark ? t.settings.dark : t.settings.light}
          right={
            <Switch
              value={isDark}
              onValueChange={toggleTheme}
              trackColor={{ false: c.border, true: c.primary + "60" }}
              thumbColor={isDark ? c.primary : "#fff"}
              style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
            />
          }
        />
      </Section>

      {/* Account */}
      <Section title={t.settings.account}>
        <Row
          iconName="mail"
          iconBg="#DBEAFE"
          label="Email"
          sub={user?.email || "Qo'shilmagan"}
          right={<Ionicons name="chevron-forward" size={18} color={c.textMuted} />}
          onPress={openEmailModal}
        />
        <Divider />
        <Row iconName="log-out" label={t.settings.logout} danger onPress={handleLogout} />
      </Section>

      <Text style={{ color: c.textMuted, textAlign: "center", fontSize: 12, marginTop: 16, opacity: 0.6 }}>
        TradeS App © {new Date().getFullYear()}
      </Text>
      <Text style={{ color: c.textMuted, textAlign: "center", fontSize: 11, marginTop: 2, marginBottom: 40, opacity: 0.5 }}>
        Powered by KarvonEx
      </Text>

      <Modal visible={emailModalVisible} transparent animationType="slide">
        <View style={{ flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.5)" }}>
          <View style={{ backgroundColor: c.bgCard, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 }}>
            <Text style={{ color: c.text, fontSize: 18, fontWeight: "800", marginBottom: 6 }}>Email manzil</Text>
            <Text style={{ color: c.textMuted, fontSize: 12, marginBottom: 16 }}>
              Ixtiyoriy — parolni tiklash va bildirishnomalar uchun ishlatiladi.
            </Text>
            <TextInput
              style={{ backgroundColor: c.bgMuted, borderRadius: 14, paddingHorizontal: 14, height: 50, fontSize: 15, color: c.text, marginBottom: 16, borderWidth: 1, borderColor: c.border }}
              placeholder="email@gmail.com"
              placeholderTextColor={c.textMuted}
              value={emailInput}
              onChangeText={setEmailInput}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoFocus
            />
            <View style={{ flexDirection: "row", gap: 10 }}>
              <TouchableOpacity onPress={() => setEmailModalVisible(false)} style={{ flex: 1, height: 50, borderRadius: 14, backgroundColor: c.bgMuted, alignItems: "center", justifyContent: "center" }}>
                <Text style={{ color: c.textSub, fontWeight: "700" }}>{t.customers.cancel}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleSaveEmail} disabled={emailSaving} style={{ flex: 2, height: 50, borderRadius: 14, backgroundColor: c.primary, alignItems: "center", justifyContent: "center" }}>
                <Text style={{ color: "#fff", fontWeight: "800" }}>{emailSaving ? "..." : t.customers.save}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}
