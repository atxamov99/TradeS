import { View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/hooks/useTheme";
import { useAT } from "@/i18n/admin";
import { adminApi } from "@/services/adminApi";
import { ACard, AScreen, Empty, ErrorBox, Loader, Pill, useLoad } from "@/components/admin/ui";

// Recent system actions (the same audit feed the website's notifications page shows).
export default function AdminNotifications() {
  const { c } = useTheme();
  const t = useAT();
  const feed = useLoad(() => adminApi.audit(), []);
  const logs: any[] = (feed.data as any)?.logs || [];
  const tone = (cat: string) => (cat === "auth" ? "info" : cat === "inventory" ? "warn" : cat === "admin" ? "ok" : "muted");

  return (
    <AScreen title={t.notifTitle} sub={t.notifSub} back onRefresh={feed.refresh} refreshing={feed.refreshing}>
      {feed.loading && !feed.data ? <Loader /> : feed.error ? <ErrorBox text={feed.error} onRetry={feed.reload} retryLabel={t.retry} /> : logs.length === 0 ? <Empty text={t.empty} /> : (
        logs.map((l) => (
          <ACard key={l.id}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <View style={{ width: 36, height: 36, borderRadius: 11, backgroundColor: c.bgMuted, alignItems: "center", justifyContent: "center" }}>
                <Ionicons name="notifications-outline" size={18} color={c.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: c.text, fontWeight: "800", fontSize: 13 }} numberOfLines={1}>{String(l.action || "").replace(/_/g, " ")}</Text>
                <Text style={{ color: c.textMuted, fontSize: 11 }} numberOfLines={1}>{l.target || ""}</Text>
              </View>
              <Pill text={l.category || "—"} tone={tone(l.category) as any} />
            </View>
            <Text style={{ color: c.textMuted, fontSize: 11, marginTop: 8 }}>{l.createdAt ? new Date(l.createdAt).toLocaleString() : ""}</Text>
          </ACard>
        ))
      )}
    </AScreen>
  );
}
