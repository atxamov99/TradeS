import { View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/hooks/useTheme";
import { useAT } from "@/i18n/admin";
import { adminApi } from "@/services/adminApi";
import { ACard, AScreen, ErrorBox, Loader, money, useLoad } from "@/components/admin/ui";

function Stat({ icon, label, value }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string }) {
  const { c } = useTheme();
  return (
    <View style={{ width: "48.5%", backgroundColor: c.bgCard, borderRadius: 18, borderWidth: 1, borderColor: c.border, padding: 14, marginBottom: 10 }}>
      <View style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: c.bgMuted, alignItems: "center", justifyContent: "center", marginBottom: 10 }}>
        <Ionicons name={icon} size={18} color={c.primary} />
      </View>
      <Text style={{ color: c.textMuted, fontSize: 12 }}>{label}</Text>
      <Text style={{ color: c.text, fontSize: 22, fontWeight: "800", marginTop: 2 }} numberOfLines={1} adjustsFontSizeToFit>{value}</Text>
    </View>
  );
}

export default function AdminReports() {
  const { c } = useTheme();
  const t = useAT();
  const r = useLoad(async () => {
    const [overview, activity] = await Promise.all([adminApi.overview(), adminApi.activity().catch(() => null)]);
    return { overview, activity };
  }, []);
  const o: any = (r.data as any)?.overview || {};
  const logs: any[] = (r.data as any)?.activity?.logs || [];

  return (
    <AScreen title={t.reportsTitle} back onRefresh={r.refresh} refreshing={r.refreshing}>
      {r.loading && !r.data ? <Loader /> : r.error ? <ErrorBox text={r.error} onRetry={r.reload} retryLabel={t.retry} /> : (
        <>
          <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" }}>
            <Stat icon="people" label={t.totalUsers} value={money(o.totalUsers)} />
            <Stat icon="cube" label={t.totalProducts} value={money(o.totalProducts)} />
            <Stat icon="cart" label={t.totalOrders} value={money(o.totalOrders)} />
            <Stat icon="cash" label={t.revenue} value={money(o.totalRevenue) + " " + t.currency} />
            <Stat icon="pulse" label={t.dau} value={money(o.dailyActiveUsers)} />
            <Stat icon="person-add" label={t.weekRegs} value={money(o.weeklyRegistrations)} />
            <Stat icon="warning" label={t.failedLogins} value={money(o.failedLogins)} />
          </View>
          {logs.length > 0 && (
            <ACard>
              <Text style={{ color: c.text, fontWeight: "800", marginBottom: 8 }}>{t.activity}</Text>
              {logs.slice(0, 12).map((l: any, i: number) => (
                <View key={l.id || i} style={{ paddingVertical: 7, borderBottomWidth: i < Math.min(logs.length, 12) - 1 ? 1 : 0, borderBottomColor: c.border }}>
                  <Text style={{ color: c.text, fontWeight: "700", fontSize: 13 }}>{l.name || l.actor || l.action}</Text>
                  <Text style={{ color: c.textMuted, fontSize: 12 }}>{l.status || l.action || ""}{l.lastLogin ? " · " + new Date(l.lastLogin).toLocaleString() : ""}</Text>
                </View>
              ))}
            </ACard>
          )}
        </>
      )}
    </AScreen>
  );
}
