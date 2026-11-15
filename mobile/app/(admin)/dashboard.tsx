import { View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/hooks/useTheme";
import { useAT } from "@/i18n/admin";
import { adminApi } from "@/services/adminApi";
import { ACard, AScreen, ErrorBox, Loader, Pill, money, useLoad } from "@/components/admin/ui";

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

export default function AdminDashboard() {
  const { c } = useTheme();
  const t = useAT();
  const { data, loading, error, reload, refreshing, refresh } = useLoad(() => adminApi.stats(), []);
  const d: any = data || {};
  const weekly: any[] = d.weeklyUsers || [];
  const maxW = Math.max(1, ...weekly.map((w) => Math.max(w.users || 0, w.active || 0)));

  return (
    <AScreen title={t.dashTitle} onRefresh={refresh} refreshing={refreshing}>
      {loading && !data ? <Loader /> : error ? <ErrorBox text={error} onRetry={reload} retryLabel={t.retry} /> : (
        <>
          <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" }}>
            <Stat icon="people" label={t.totalUsers} value={money(d.totalUsers)} />
            <Stat icon="cube" label={t.totalProducts} value={money(d.totalProducts)} />
            <Stat icon="cart" label={t.totalOrders} value={money(d.totalOrders)} />
            <Stat icon="cash" label={t.revenue} value={money(d.totalRevenue) + " " + t.currency} />
          </View>

          <ACard>
            <Text style={{ color: c.text, fontWeight: "800", marginBottom: 12 }}>{t.weeklyUsers}</Text>
            <View style={{ flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", height: 110 }}>
              {weekly.map((w, i) => (
                <View key={i} style={{ alignItems: "center", flex: 1 }}>
                  <View style={{ flexDirection: "row", alignItems: "flex-end", height: 90, gap: 3 }}>
                    <View style={{ width: 9, height: Math.max(3, ((w.users || 0) / maxW) * 90), backgroundColor: c.primary, borderRadius: 4 }} />
                    <View style={{ width: 9, height: Math.max(3, ((w.active || 0) / maxW) * 90), backgroundColor: c.bgMuted, borderRadius: 4, borderWidth: 1, borderColor: c.border }} />
                  </View>
                  <Text style={{ color: c.textMuted, fontSize: 10, marginTop: 4 }}>{w.day}</Text>
                </View>
              ))}
            </View>
          </ACard>

          <ACard>
            <Text style={{ color: c.text, fontWeight: "800", marginBottom: 8 }}>{t.monthlyOrders}</Text>
            {(d.monthlyOrders || []).map((m: any, i: number) => (
              <View key={i} style={{ flexDirection: "row", paddingVertical: 6, borderBottomWidth: i < (d.monthlyOrders || []).length - 1 ? 1 : 0, borderBottomColor: c.border }}>
                <Text style={{ color: c.textSub, flex: 1 }}>{m.month}</Text>
                <Text style={{ color: c.text, fontWeight: "700", marginRight: 14 }}>{money(m.orders)}</Text>
                <Text style={{ color: c.textMuted }}>{money(m.revenue)} {t.currency}</Text>
              </View>
            ))}
          </ACard>

          <ACard>
            <Text style={{ color: c.text, fontWeight: "800", marginBottom: 8 }}>{t.recentOrders}</Text>
            {(d.recentOrders || []).length === 0 && <Text style={{ color: c.textMuted }}>{t.noOrders}</Text>}
            {(d.recentOrders || []).map((o: any, i: number) => (
              <View key={o.id || i} style={{ flexDirection: "row", alignItems: "center", paddingVertical: 8 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: c.text, fontWeight: "700" }}>{o.orderNumber || o.id}</Text>
                  <Text style={{ color: c.textMuted, fontSize: 12 }}>{o.user?.name || "—"}</Text>
                </View>
                <Text style={{ color: c.text, fontWeight: "700", marginRight: 8 }}>{money(o.totalPrice)}</Text>
                <Pill text={(t as any)["st_" + o.orderStatus] || o.orderStatus} tone="info" />
              </View>
            ))}
          </ACard>
        </>
      )}
    </AScreen>
  );
}
