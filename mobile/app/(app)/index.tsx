import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { useMemo } from "react";
import { useT } from "@/hooks/useT";
import { useTodayStats, useSales } from "@/hooks/useSales";
import { useLowStockProducts } from "@/hooks/useProducts";
import { useTheme } from "@/hooks/useTheme";
import { useAuthStore } from "@/store/authStore";
import { SaleCard } from "@/components/SaleCard";
import { MiniChart } from "@/components/MiniChart";


import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

function decodeName(token: string | null): string {
  if (!token || token === "demo-token") return "";
  try {
    const b64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const payload = JSON.parse(atob(b64));
    return payload?.name || payload?.email?.split("@")[0] || "";
  } catch {
    return "";
  }
}

function StatCard({ icon, label, value, color, onPress }: { icon: any; label: string; value: string; color: string; onPress: () => void }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={{ flex: 1, backgroundColor: "rgba(255,255,255,0.06)", borderRadius: 12, padding: 8, alignItems: "center", gap: 2, borderWidth: 1, borderColor: "rgba(255,255,255,0.06)" }}
    >
      <View style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: "rgba(255,255,255,0.08)", alignItems: "center", justifyContent: "center" }}>
        <Ionicons name={icon} size={14} color="#fff" />
      </View>
      <Text style={{ color: "rgba(255,255,255,0.5)", fontSize: 8, fontWeight: "700", letterSpacing: 0.5 }}>{label}</Text>
      <Text style={{ color: "#fff", fontSize: 13, fontWeight: "800" }}>{value}</Text>
    </TouchableOpacity>
  );
}

function ToolCard({ icon, title, desc, color, onPress }: { icon: any; title: string; desc: string; color: string; onPress: () => void }) {
  const { c } = useTheme();
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={{
        flex: 1,
        backgroundColor: c.bgCard,
        borderRadius: 16,
        padding: 12,
        borderWidth: 1,
        borderColor: c.border,
      }}
    >
      <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: color + "15", alignItems: "center", justifyContent: "center", marginBottom: 6 }}>
        <Ionicons name={icon} size={18} color={color} />
      </View>
      <Text style={{ color: c.text, fontWeight: "700", fontSize: 12 }} numberOfLines={1}>{title}</Text>
      <Text style={{ color: c.textMuted, fontSize: 10, marginTop: 1 }} numberOfLines={1}>{desc}</Text>
    </TouchableOpacity>
  );
}

export default function HomeScreen() {
  const t = useT();
  const { revenue, profit, count, sales } = useTodayStats();
  const weekSales = useSales("week");
  const lowStockProducts = useLowStockProducts();
  const { c } = useTheme();
  const token = useAuthStore((s) => s.token);
  const margin = revenue > 0 ? Math.round((profit / revenue) * 100) : 0;
  const userName = decodeName(token) || "Savdogar";

  const chartData = useMemo(() => {
    const days: number[] = [0, 0, 0, 0, 0, 0, 0];
    const now = Date.now();
    weekSales.forEach((s) => {
      const diff = now - s.soldAt;
      const dayIdx = Math.min(6, Math.floor(diff / 86400000));
      if (dayIdx >= 0 && dayIdx < 7) {
        days[6 - dayIdx] += s.totalAmount;
      }
    });
    return days;
  }, [weekSales]);

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>

        {/* SEARCH */}
        <View style={{ paddingHorizontal: 16, paddingTop: 48, paddingBottom: 0 }}>
          <TouchableOpacity
            onPress={() => router.push("/products")}
            activeOpacity={0.8}
            style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: c.bgCard,
              borderRadius: 14,
              paddingHorizontal: 14,
              paddingVertical: 10,
              borderWidth: 1,
              borderColor: c.border,
              gap: 8,
            }}
          >
            <Ionicons name="search" size={16} color={c.textMuted} />
            <Text style={{ color: c.textMuted, fontSize: 13, flex: 1 }}>{t.products.search || t.common.search}</Text>
          </TouchableOpacity>
        </View>

        {/* HEADER */}
        <View style={{
          marginHorizontal: 16,
          marginTop: 10,
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
        }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <View style={{
              width: 36,
              height: 36,
              borderRadius: 12,
              backgroundColor: c.primary + "20",
              alignItems: "center",
              justifyContent: "center",
            }}>
              <Ionicons name="person" size={18} color={c.primary} />
            </View>
            <Text style={{ color: c.text, fontSize: 16, fontWeight: "700" }}>{userName}</Text>
          </View>
          <TouchableOpacity
            onPress={() => router.push("/settings")}
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              backgroundColor: c.bgCard,
              alignItems: "center",
              justifyContent: "center",
              borderWidth: 1,
              borderColor: c.border,
            }}
          >
            <Ionicons name="notifications-outline" size={18} color={c.text} />
          </TouchableOpacity>
        </View>

        {/* REVENUE BLOCK */}
        <View style={{
          marginHorizontal: 16,
          marginTop: 14,
          backgroundColor: "#0A2616",
          borderRadius: 20,
          padding: 16,
          borderWidth: 1,
          borderColor: "rgba(66,199,90,0.15)",
        }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
            <View>
              <Text style={{ color: c.textMuted, fontSize: 10, fontWeight: "700", letterSpacing: 0.5 }}>
                {t.home.todayRevenue.toUpperCase()}
              </Text>
              <Text style={{ color: "#FFFFFF", fontSize: 30, fontWeight: "800", marginTop: 2, letterSpacing: -1 }}>
                {(revenue || 0).toLocaleString()}
              </Text>
              <Text style={{ color: c.textMuted, fontSize: 10, marginTop: -2 }}>so'm</Text>
            </View>
          </View>

          {/* CHART */}
          <View style={{ marginTop: 10, alignItems: "flex-start" }}>
            <MiniChart data={chartData} color={c.primary} height={40} />
          </View>

          {/* KPI CARDS */}
          <View style={{ flexDirection: "row", marginTop: 12, gap: 6 }}>
            <StatCard icon="trending-up" label={t.home.todayProfit.toUpperCase()} value={(profit || 0).toLocaleString()} color={c.primary} onPress={() => router.push("/reports")} />
            <StatCard icon="cart" label={t.nav.sales.toUpperCase()} value={String(count)} color={c.primary} onPress={() => router.push("/sales")} />
            <StatCard icon="analytics" label={t.home.margin.toUpperCase()} value={`${margin}%`} color={c.primary} onPress={() => router.push("/reports")} />
          </View>
        </View>

        {/* QUICK ACTIONS */}
        <View style={{ paddingHorizontal: 16, marginTop: 16 }}>
          <Text style={{ color: c.text, fontSize: 15, fontWeight: "800", marginBottom: 10 }}>{t.home.quickActions}</Text>
          <View style={{ flexDirection: "row", gap: 10 }}>
            <TouchableOpacity
              onPress={() => router.push("/sales/add")}
              activeOpacity={0.85}
              style={{
                flex: 1,
                backgroundColor: c.bgCard,
                borderRadius: 20,
                padding: 16,
                alignItems: "center",
                borderWidth: 1,
                borderColor: c.border,
              }}
            >
              <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: c.primary + "15", alignItems: "center", justifyContent: "center", marginBottom: 8 }}>
                <Ionicons name="cart" size={22} color={c.primary} />
              </View>
              <Text style={{ color: c.text, fontWeight: "700", fontSize: 12 }}>{t.home.addSale}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => router.push("/products/add")}
              activeOpacity={0.85}
              style={{
                flex: 1,
                backgroundColor: c.bgCard,
                borderRadius: 20,
                padding: 16,
                alignItems: "center",
                borderWidth: 1,
                borderColor: c.border,
              }}
            >
              <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: c.warn + "15", alignItems: "center", justifyContent: "center", marginBottom: 8 }}>
                <Ionicons name="cube" size={22} color={c.warn} />
              </View>
              <Text style={{ color: c.text, fontWeight: "700", fontSize: 12 }}>{t.home.addProduct}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* TOOL CARDS */}
        <View style={{ paddingHorizontal: 16, marginTop: 16 }}>
          <Text style={{ color: c.text, fontSize: 15, fontWeight: "800", marginBottom: 10 }}>{t.home.businessTools}</Text>
          <View style={{ gap: 8 }}>
            <View style={{ flexDirection: "row", gap: 8 }}>
              <ToolCard icon="business" title={t.suppliers.title} desc="Yetkazib beruvchilar" color={c.warn} onPress={() => router.push("/suppliers")} />
              <ToolCard icon="people" title={t.customers.title} desc="Mijozlar qarzi" color={c.danger} onPress={() => router.push("/customers")} />
            </View>
            <View style={{ flexDirection: "row", gap: 8 }}>
              <ToolCard icon="document-text" title={t.reports.title} desc="Hisobot va tahlil" color={c.primary} onPress={() => router.push("/reports")} />
              <ToolCard icon="pricetags" title={t.categories.title} desc="Tovarlar turkumi" color={c.accent || c.primary} onPress={() => router.push("/products")} />
            </View>
          </View>
        </View>

        {/* LOW STOCK ALERT */}
        {lowStockProducts.length > 0 && (
          <View style={{ paddingHorizontal: 16, marginTop: 16 }}>
            <View style={{ backgroundColor: c.bgCard, borderRadius: 16, overflow: "hidden", borderWidth: 1, borderColor: c.warn + "40" }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 14, paddingVertical: 10, backgroundColor: c.warn + "12", borderBottomWidth: 1, borderBottomColor: c.warn + "20" }}>
                <Ionicons name="warning" size={16} color={c.warn} />
                <Text style={{ color: c.warn, fontWeight: "800", fontSize: 13, flex: 1 }}>Kam qolgan tovarlar</Text>
                <View style={{ backgroundColor: c.warn, borderRadius: 8, paddingHorizontal: 7, paddingVertical: 1 }}>
                  <Text style={{ color: "#07120B", fontSize: 10, fontWeight: "800" }}>{lowStockProducts.length}</Text>
                </View>
              </View>
              {lowStockProducts.slice(0, 5).map((p, idx) => (
                <TouchableOpacity
                  key={p.id}
                  onPress={() => router.push(`/products/${p.id}`)}
                  style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: idx < Math.min(lowStockProducts.length, 5) - 1 ? 1 : 0, borderBottomColor: c.border }}
                >
                  <Text style={{ color: c.text, fontWeight: "600", fontSize: 13, flex: 1 }} numberOfLines={1}>{p.name}</Text>
                  <View style={{ borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, backgroundColor: p.stockQty === 0 ? c.danger + "15" : c.warn + "15" }}>
                    <Text style={{ color: p.stockQty === 0 ? c.danger : c.warn, fontWeight: "800", fontSize: 11 }}>
                      {p.stockQty === 0 ? "Tugadi" : `${p.stockQty} ${p.unit}`}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* RECENT SALES */}
        <View style={{ paddingHorizontal: 16, marginTop: 20, marginBottom: 80 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <Text style={{ color: c.text, fontSize: 15, fontWeight: "800" }}>{t.home.recentSales}</Text>
            <TouchableOpacity onPress={() => router.push("/sales")} style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
              <Text style={{ color: c.primary, fontSize: 12, fontWeight: "600" }}>{t.home.allSales}</Text>
              <Ionicons name="chevron-forward" size={12} color={c.primary} />
            </TouchableOpacity>
          </View>

          {sales.length === 0 ? (
            <View style={{ backgroundColor: c.bgCard, borderRadius: 16, padding: 28, alignItems: "center", borderWidth: 1, borderColor: c.border }}>
              <View style={{ width: 48, height: 48, borderRadius: 14, backgroundColor: c.primary + "12", alignItems: "center", justifyContent: "center", marginBottom: 10 }}>
                <Ionicons name="cart" size={24} color={c.primary} />
              </View>
              <Text style={{ color: c.textMuted, fontSize: 14, fontWeight: "600" }}>{t.home.noSales}</Text>
              <Text style={{ color: c.textMuted, fontSize: 12, marginTop: 2, opacity: 0.7 }}>{t.home.firstSale}</Text>
            </View>
          ) : (
            sales.slice(0, 8).map((s) => <SaleCard key={s.id} sale={s} />)
          )}
        </View>
      </ScrollView>

    </View>
  );
}
