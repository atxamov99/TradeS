import { View, Text, ScrollView, TouchableOpacity, Alert } from "react-native";
import { useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import * as Sharing from "expo-sharing";
import * as FileSystem from "expo-file-system";
import { useSales } from "@/hooks/useSales";
import { useT } from "@/hooks/useT";
import { useTheme } from "@/hooks/useTheme";

type Period = "today" | "week" | "month";

const MEDALS = ["trophy", "medal", "ribbon", "star", "star-half"] as const;

function csvEscape(val: any): string {
  const str = String(val ?? "");
  return str.includes(";") || str.includes('"') || str.includes("\n")
    ? `"${str.replace(/"/g, '""')}"`
    : str;
}

async function exportCSV(period: string, sales: any[], errorTitle: string, errorMsg: string) {
  try {
    const dir = FileSystem.cacheDirectory;
    if (!dir) throw new Error("No cache dir");
    const header = ["Mahsulot", "Miqdor", "Tushum", "Foyda", "Sana"].map(csvEscape).join(";");
    const rows = sales.map((s) =>
      [
        s.productName,
        s.qty,
        s.sellPrice * s.qty,
        s.profit,
        new Date(s.soldAt).toISOString().slice(0, 19).replace("T", " "),
      ].map(csvEscape).join(";")
    );
    const csv = "﻿" + [header, ...rows].join("\n"); // BOM for Excel
    const uri = dir + `savdo_report_${period}_${Date.now()}.csv`;
    await FileSystem.writeAsStringAsync(uri, csv, { encoding: FileSystem.EncodingType.UTF8 });
    await Sharing.shareAsync(uri, { mimeType: "text/csv", UTI: "public.comma-separated-values-text" });
  } catch {
    Alert.alert(errorTitle, errorMsg);
  }
}

async function exportJSON(period: string, sales: any[], errorTitle: string, errorMsg: string) {
  try {
    const dir = FileSystem.cacheDirectory;
    if (!dir) throw new Error("No cache dir");
    const data = sales.map((s) => ({
      mahsulot: s.productName,
      miqdor: s.qty,
      narx: s.sellPrice,
      tushum: s.sellPrice * s.qty,
      foyda: s.profit,
      sana: new Date(s.soldAt).toISOString(),
    }));
    const json = JSON.stringify(data, null, 2);
    const uri = dir + `savdo_report_${period}_${Date.now()}.json`;
    await FileSystem.writeAsStringAsync(uri, json, { encoding: FileSystem.EncodingType.UTF8 });
    await Sharing.shareAsync(uri, { mimeType: "application/json" });
  } catch {
    Alert.alert(errorTitle, errorMsg);
  }
}

export default function ReportsScreen() {
  const [period, setPeriod] = useState<Period>("today");
  const sales = useSales(period);
  const t = useT();
  const { c } = useTheme();

  const revenue = sales.reduce((s, x) => s + x.totalAmount, 0);
  const profit = sales.reduce((s, x) => s + x.profit, 0);
  const margin = revenue > 0 ? Math.round((profit / revenue) * 100) : 0;

  const productMap: Record<string, { name: string; revenue: number; qty: number; profit: number }> = {};
  sales.forEach((s) => {
    if (!productMap[s.productName]) productMap[s.productName] = { name: s.productName, revenue: 0, qty: 0, profit: 0 };
    productMap[s.productName].revenue += s.totalAmount;
    productMap[s.productName].qty += s.qty;
    productMap[s.productName].profit += s.profit;
  });
  const topProducts = Object.values(productMap).sort((a, b) => b.profit - a.profit).slice(0, 5);

  const FILTERS: { key: Period; label: string }[] = [
    { key: "today", label: t.sales.filters.today },
    { key: "week",  label: t.sales.filters.week },
    { key: "month", label: t.sales.filters.month },
  ];

  const maxProfit = topProducts[0]?.profit || 1;
  const isGoodMargin = margin >= 20;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: c.bg }} showsVerticalScrollIndicator={false}>
      <View style={{ backgroundColor: c.bg, paddingHorizontal: 20, paddingTop: 56, paddingBottom: 12 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <Text style={{ color: c.text, fontSize: 28, fontWeight: "800" }}>{t.reports.title}</Text>
          {sales.length > 0 && (
            <TouchableOpacity
              onPress={() =>
                Alert.alert("Eksport", "Formalni tanlang", [
                  { text: "CSV (Excel)", onPress: () => exportCSV(period, sales, t.common.error, t.common.exportError) },
                  { text: "JSON", onPress: () => exportJSON(period, sales, t.common.error, t.common.exportError) },
                  { text: t.products.cancel, style: "cancel" },
                ])
              }
              style={{ flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: c.bgMuted, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, borderWidth: 1, borderColor: c.border }}
            >
              <Ionicons name="download" size={16} color={c.primary} />
              <Text style={{ color: c.primary, fontWeight: "700", fontSize: 13 }}>Eksport</Text>
            </TouchableOpacity>
          )}
        </View>
        <View style={{ flexDirection: "row", backgroundColor: c.bgMuted, borderRadius: 14, padding: 4 }}>
          {FILTERS.map((f) => (
            <TouchableOpacity
              key={f.key}
              onPress={() => setPeriod(f.key)}
              style={{ flex: 1, paddingVertical: 8, borderRadius: 11, backgroundColor: period === f.key ? c.primary : "transparent", alignItems: "center" }}
            >
              <Text style={{ color: period === f.key ? "#fff" : c.textSub, fontSize: 13, fontWeight: "700" }}>{f.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={{ paddingHorizontal: 20, paddingBottom: 40, gap: 12 }}>
        {/* Big stats */}
        <View style={{ backgroundColor: c.primary, borderRadius: 22, padding: 22 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4 }}>
            <Ionicons name="cash" size={14} color="rgba(255,255,255,0.65)" />
            <Text style={{ color: "rgba(255,255,255,0.65)", fontSize: 12, fontWeight: "700", letterSpacing: 1.5 }}>{t.reports.revenue.toUpperCase()}</Text>
          </View>
          <Text style={{ color: "#fff", fontSize: 36, fontWeight: "800", marginTop: 2, letterSpacing: -1 }}>{revenue.toLocaleString()}</Text>
          <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 14 }}>so'm</Text>
          <View style={{ height: 1, backgroundColor: "rgba(255,255,255,0.2)", marginVertical: 16 }} />
          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <View>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                <Ionicons name="trending-up" size={12} color="rgba(255,255,255,0.65)" />
                <Text style={{ color: "rgba(255,255,255,0.65)", fontSize: 11, fontWeight: "600" }}>{t.reports.totalProfit.toUpperCase()}</Text>
              </View>
              <Text style={{ color: "#fff", fontWeight: "800", fontSize: 20 }}>+{profit.toLocaleString()} so'm</Text>
            </View>
            <View style={{ alignItems: "flex-end" }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                <Ionicons name="cart" size={12} color="rgba(255,255,255,0.65)" />
                <Text style={{ color: "rgba(255,255,255,0.65)", fontSize: 11, fontWeight: "600" }}>{t.reports.sales.toUpperCase()}</Text>
              </View>
              <Text style={{ color: "#fff", fontWeight: "800", fontSize: 20 }}>{sales.length}</Text>
            </View>
          </View>
        </View>

        {/* Margin */}
        <View style={{ backgroundColor: c.bgCard, borderRadius: 18, padding: 18, borderWidth: 1, borderColor: c.border }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <Ionicons name="analytics" size={14} color={c.textMuted} />
            <Text style={{ color: c.textMuted, fontSize: 12, fontWeight: "600" }}>{t.reports.margin.toUpperCase()}</Text>
          </View>
          <View style={{ flexDirection: "row", alignItems: "flex-end", gap: 8, marginTop: 8 }}>
            <Text style={{ color: isGoodMargin ? c.primary : c.warn, fontSize: 40, fontWeight: "800" }}>{margin}%</Text>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 6 }}>
              <Ionicons name={isGoodMargin ? "checkmark-circle" : "alert-circle"} size={16} color={isGoodMargin ? c.primary : c.warn} />
              <Text style={{ color: isGoodMargin ? c.primary : c.warn, fontSize: 13, fontWeight: "600" }}>{isGoodMargin ? t.reports.good : t.reports.low}</Text>
            </View>
          </View>
          <View style={{ height: 8, backgroundColor: c.bgMuted, borderRadius: 4, marginTop: 8 }}>
            <View style={{ height: 8, backgroundColor: isGoodMargin ? c.primary : c.warn, borderRadius: 4, width: `${Math.min(margin, 100)}%` }} />
          </View>
        </View>

        {/* Top products */}
        {topProducts.length > 0 && (
          <View style={{ backgroundColor: c.bgCard, borderRadius: 18, padding: 18, borderWidth: 1, borderColor: c.border }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 16 }}>
              <Ionicons name="trophy" size={18} color={c.primary} />
              <Text style={{ color: c.text, fontSize: 16, fontWeight: "800" }}>{t.reports.top5}</Text>
            </View>
            {topProducts.map((p, i) => (
              <View key={p.name} style={{ marginBottom: i < topProducts.length - 1 ? 16 : 0 }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 6 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flex: 1 }}>
                    <Ionicons name={MEDALS[i] as any} size={18} color={i === 0 ? "#F59E0B" : i === 1 ? "#9CA3AF" : i === 2 ? "#CD7C2F" : c.textMuted} />
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: c.text, fontWeight: "700", fontSize: 14 }}>{p.name}</Text>
                      <Text style={{ color: c.textMuted, fontSize: 12 }}>{p.qty} · {p.revenue.toLocaleString()} so'm</Text>
                    </View>
                  </View>
                  <Text style={{ color: c.primary, fontWeight: "800", fontSize: 14 }}>+{p.profit.toLocaleString()}</Text>
                </View>
                <View style={{ height: 5, backgroundColor: c.bgMuted, borderRadius: 3 }}>
                  <View style={{ height: 5, backgroundColor: c.primary, borderRadius: 3, width: `${(p.profit / maxProfit) * 100}%`, opacity: 0.4 + (0.6 * (1 - i / 5)) }} />
                </View>
              </View>
            ))}
          </View>
        )}

        {topProducts.length === 0 && (
          <View style={{ alignItems: "center", paddingVertical: 40 }}>
            <Ionicons name="stats-chart" size={52} color={c.border} style={{ marginBottom: 12 }} />
            <Text style={{ color: c.textMuted, fontSize: 16, fontWeight: "600" }}>{t.reports.noData}</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}
