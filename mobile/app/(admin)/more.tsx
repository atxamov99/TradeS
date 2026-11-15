import { View, Text, TouchableOpacity } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/hooks/useTheme";
import { useUserStore } from "@/store/userStore";
import { useAT } from "@/i18n/admin";
import { AScreen } from "@/components/admin/ui";

// The rest of the admin panel pages (the website's sidebar has them all; the app keeps 4 on the tab bar).
export default function AdminMore() {
  const { c } = useTheme();
  const t = useAT();
  const me = useUserStore((s) => (s as any).user);
  const items: { to: string; icon: keyof typeof Ionicons.glyphMap; label: string; bg: string }[] = [
    { to: "products", icon: "cube", label: t.products, bg: "#DBEAFE" },
    { to: "reports", icon: "stats-chart", label: t.reports, bg: "#DCFCE7" },
    { to: "admins", icon: "shield-checkmark", label: t.admins, bg: "#EDE9FE" },
    { to: "content", icon: "document-text", label: t.content, bg: "#FEF3C7" },
    { to: "notifications", icon: "notifications", label: t.notifications, bg: "#FEE2E2" },
    { to: "settings", icon: "settings", label: t.settings, bg: "#E2E8F0" },
  ];
  return (
    <AScreen title={t.moreTitle} sub={me?.name ? `${me.name} · ${t.roleAdmin}` : t.roleAdmin}>
      {items.map((it) => (
        <TouchableOpacity
          key={it.to}
          activeOpacity={0.8}
          onPress={() => router.push(`/(admin)/${it.to}` as any)}
          style={{ flexDirection: "row", alignItems: "center", backgroundColor: c.bgCard, borderRadius: 18, borderWidth: 1, borderColor: c.border, padding: 14, marginBottom: 10 }}
        >
          <View style={{ width: 42, height: 42, borderRadius: 12, backgroundColor: it.bg, alignItems: "center", justifyContent: "center", marginRight: 14 }}>
            <Ionicons name={it.icon} size={21} color="#0E150F" />
          </View>
          <Text style={{ flex: 1, color: c.text, fontSize: 16, fontWeight: "700" }}>{it.label}</Text>
          <Ionicons name="chevron-forward" size={20} color={c.textMuted} />
        </TouchableOpacity>
      ))}
    </AScreen>
  );
}
