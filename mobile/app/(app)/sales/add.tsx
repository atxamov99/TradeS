import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, FlatList, Alert, Modal } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { BarcodeScanner } from "@/components/BarcodeScanner";
import { database, salesCollection } from "@/db";
import { Product } from "@/db/models/Product";
import { useProducts } from "@/hooks/useProducts";
import { useT } from "@/hooks/useT";
import { useTheme } from "@/hooks/useTheme";

type SaleResult = { name: string; qty: number; totalAmount: number; profit: number };

export default function AddSaleScreen() {
  const t = useT();
  const { c } = useTheme();
  const allProducts = useProducts();
  const [search, setSearch] = useState("");
  const [showScanner, setShowScanner] = useState(false);
  const [selected, setSelected] = useState<Product | null>(null);
  const [qty, setQty] = useState("1");
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<SaleResult | null>(null);

  const filtered = allProducts.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const qtyNum = Number(qty) || 0;
  const totalAmount = selected ? selected.sellPrice * qtyNum : 0;
  const totalProfit = selected ? (selected.sellPrice - selected.buyPrice) * qtyNum : 0;

  async function doSale() {
    if (!selected) return;
    setSaving(true);
    try {
      await database.write(async () => {
        await salesCollection.create((s) => {
          s.productId = selected.id;
          s.productName = selected.name;
          s.qty = qtyNum;
          s.sellPrice = selected.sellPrice;
          s.profit = totalProfit;
          s.note = null;
          s.soldAt = Date.now();
          s.isSynced = false;
          s.serverId = null;
        });
        await selected.update((p) => {
          p.stockQty = p.stockQty - qtyNum;
          p.isSynced = false;
        });
      });
      setResult({ name: selected.name, qty: qtyNum, totalAmount, profit: totalProfit });
    } catch {
      Alert.alert(t.common.error, t.common.saveError);
    } finally {
      setSaving(false);
    }
  }

  async function handleSale() {
    if (!selected || qtyNum <= 0) return;
    if (qtyNum > selected.stockQty) {
      Alert.alert(
        "⚠️ Stok yetarli emas",
        `Stokda ${selected.stockQty} ${selected.unit} bor, siz ${qtyNum} ta yozmoqdasiz.\n\nBaribir davom ettirasizmi?`,
        [
          { text: "Bekor qilish", style: "cancel" },
          { text: "Ha, yozish", onPress: doSale },
        ]
      );
      return;
    }
    doSale();
  }

  function handleBarcodeScanned(code: string) {
    setShowScanner(false);
    const found = allProducts.find((p) => p.barcode === code || p.name === code);
    if (found) {
      setSelected(found);
    } else {
      setSearch(code);
    }
  }

  function resetForNextSale() {
    setResult(null);
    setSelected(null);
    setSearch("");
    setQty("1");
  }

  // ── NATIJA EKRANI ──
  if (result) {
    return (
      <View style={{ flex: 1, backgroundColor: c.primary, justifyContent: "center", alignItems: "center", paddingHorizontal: 32 }}>
        <View style={{ width: 96, height: 96, backgroundColor: c.bg, borderRadius: 48, alignItems: "center", justifyContent: "center", marginBottom: 24 }}>
          <Ionicons name="checkmark" size={52} color={c.primary} />
        </View>

        <Text style={{ color: c.bg, fontSize: 22, fontWeight: "800", textAlign: "center" }}>{t.sales.saleRecorded}</Text>
        <Text style={{ color: c.bg, fontSize: 16, marginBottom: 4, textAlign: "center" }}>
          {result.name} · {result.qty} {t.sales.qty}
        </Text>
        <Text style={{ color: "#fff", fontSize: 36, fontWeight: "800", marginBottom: 40 }}>
          {result.totalAmount.toLocaleString()} so'm
        </Text>

        <TouchableOpacity
          onPress={resetForNextSale}
          style={{ backgroundColor: c.bg, borderRadius: 16, height: 54, width: "100%", alignItems: "center", justifyContent: "center", marginBottom: 12, flexDirection: "row", gap: 8 }}
        >
          <Ionicons name="add-circle" size={20} color={c.primaryDark} />
          <Text style={{ color: c.primaryDark, fontWeight: "800", fontSize: 16 }}>{t.sales.addAnother}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.replace("/(app)")}
          style={{ height: 54, width: "100%", alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 8 }}
        >
          <Ionicons name="home" size={16} color={c.bgMuted} />
          <Text style={{ color: c.bgMuted, fontWeight: "600", fontSize: 15 }}>{t.sales.goHome}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ── SOTUV YOZISH EKRANI ──
  if (showScanner) {
    return (
      <Modal visible animationType="slide">
        <BarcodeScanner
          onScanned={handleBarcodeScanned}
          onClose={() => setShowScanner(false)}
        />
      </Modal>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <View style={{ backgroundColor: c.bg, paddingHorizontal: 16, paddingTop: 56, paddingBottom: 12 }}>
        <TouchableOpacity onPress={() => router.back()} style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
          <Ionicons name="chevron-back" size={20} color={c.primary} />
          <Text style={{ color: c.primary, fontWeight: "600", fontSize: 14 }}>{t.products.cancel}</Text>
        </TouchableOpacity>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <Text style={{ color: c.text, fontSize: 26, fontWeight: "800" }}>{t.sales.addSale}</Text>
          <TouchableOpacity onPress={() => setShowScanner(true)} style={{ backgroundColor: c.bgMuted, borderRadius: 10, padding: 8, borderWidth: 1, borderColor: c.border }}>
            <Ionicons name="barcode" size={20} color={c.primary} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={{ flex: 1, paddingHorizontal: 16 }}>
        {!selected ? (
          <>
            <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: c.bgCard, borderRadius: 14, paddingHorizontal: 12, marginBottom: 12, borderWidth: 1, borderColor: c.border }}>
              <Ionicons name="search" size={18} color={c.primary} />
              <TextInput
                style={{ flex: 1, height: 48, marginLeft: 8, fontSize: 15, color: c.text }}
                placeholder={t.sales.searchProduct}
                placeholderTextColor={c.border}
                value={search}
                onChangeText={setSearch}
                autoFocus
              />
              {search.length > 0 && (
                <TouchableOpacity onPress={() => setSearch("")}>
                  <Ionicons name="close-circle" size={20} color={c.textMuted} />
                </TouchableOpacity>
              )}
            </View>

            <FlatList
              data={filtered}
              keyExtractor={(p) => p.id}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={{ backgroundColor: item.stockQty === 0 ? c.bgMuted : c.bgCard, borderRadius: 16, padding: 14, marginBottom: 8, flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderWidth: 1, borderColor: c.border, opacity: item.stockQty === 0 ? 0.5 : 1 }}
                  onPress={() => { if (item.stockQty > 0) { setSelected(item); setSearch(""); } }}
                  disabled={item.stockQty === 0}
                >
                  <View>
                    <Text style={{ color: c.text, fontWeight: "700", fontSize: 15 }}>{item.name}</Text>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 }}>
                      {item.isLowStock && <Ionicons name="warning" size={12} color={c.warn} />}
                      <Text style={{ color: item.isLowStock ? c.warn : c.textMuted, fontSize: 12 }}>
                        {t.sales.stock} {item.stockQty} {item.unit}
                      </Text>
                    </View>
                  </View>
                  <View style={{ alignItems: "flex-end" }}>
                    <Text style={{ color: c.primary, fontWeight: "800", fontSize: 15 }}>{item.sellPrice.toLocaleString()} so'm</Text>
                    <Text style={{ color: c.textMuted, fontSize: 11 }}>{t.sales.totalProfit} +{item.profit.toLocaleString()}</Text>
                  </View>
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <View style={{ alignItems: "center", paddingTop: 48 }}>
                  <Ionicons name="search" size={40} color={c.border} style={{ marginBottom: 12 }} />
                  <Text style={{ color: c.textMuted, textAlign: "center", fontSize: 15 }}>
                    {search ? t.sales.noProduct : t.sales.searchProduct}
                  </Text>
                </View>
              }
            />
          </>
        ) : (
          <View style={{ gap: 12 }}>
            <View style={{ backgroundColor: c.bgCard, borderRadius: 16, padding: 16, flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderWidth: 1, borderColor: c.border }}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: c.text, fontWeight: "700", fontSize: 16 }}>{selected.name}</Text>
                <Text style={{ color: c.textMuted, fontSize: 13, marginTop: 2 }}>
                  {t.sales.stock} {selected.stockQty} {selected.unit} · {selected.sellPrice.toLocaleString()} so'm
                </Text>
              </View>
              <TouchableOpacity onPress={() => { setSelected(null); setQty("1"); }} style={{ padding: 4 }}>
                <Ionicons name="close-circle" size={22} color={c.textMuted} />
              </TouchableOpacity>
            </View>

            <View>
              <Text style={{ color: c.primaryDark, fontWeight: "700", marginBottom: 8 }}>{t.sales.qty}</Text>
              <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
                <TouchableOpacity style={{ width: 52, height: 64, backgroundColor: c.bgMuted, borderRadius: 14, alignItems: "center", justifyContent: "center" }} onPress={() => setQty(String(Math.max(1, qtyNum - 1)))}>
                  <Ionicons name="remove" size={28} color={c.primaryDark} />
                </TouchableOpacity>
                <TextInput
                  style={{ flex: 1, backgroundColor: c.bgCard, borderRadius: 14, height: 64, fontSize: 32, textAlign: "center", fontWeight: "800", color: qtyNum > selected.stockQty ? c.danger : c.text, borderWidth: 2, borderColor: qtyNum > selected.stockQty ? c.danger : c.border }}
                  keyboardType="numeric"
                  value={qty}
                  onChangeText={setQty}
                  selectTextOnFocus
                />
                <TouchableOpacity style={{ width: 52, height: 64, backgroundColor: c.primary, borderRadius: 14, alignItems: "center", justifyContent: "center" }} onPress={() => setQty(String(qtyNum + 1))}>
                  <Ionicons name="add" size={28} color="#fff" />
                </TouchableOpacity>
              </View>
              {qtyNum > selected.stockQty && (
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 8, backgroundColor: c.danger + "15", borderRadius: 10, padding: 10 }}>
                  <Ionicons name="warning" size={16} color={c.danger} />
                  <Text style={{ color: c.danger, fontWeight: "700", fontSize: 13 }}>
                    Stokda {selected.stockQty} {selected.unit} bor. {qtyNum - selected.stockQty} ta oshiqcha!
                  </Text>
                </View>
              )}
            </View>

            <View style={{ backgroundColor: c.bgMuted, borderRadius: 16, padding: 16, gap: 8 }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                <Text style={{ color: c.accent }}>{t.sales.totalAmount}</Text>
                <Text style={{ color: c.text, fontWeight: "700" }}>{totalAmount.toLocaleString()} so'm</Text>
              </View>
              <View style={{ height: 1, backgroundColor: c.border }} />
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                  <Ionicons name="trending-up" size={14} color={c.primaryDark} />
                  <Text style={{ color: c.primaryDark, fontWeight: "700" }}>{t.sales.netProfit.toUpperCase()}</Text>
                </View>
                <Text style={{ color: c.primaryDark, fontWeight: "800", fontSize: 20 }}>+{totalProfit.toLocaleString()} so'm</Text>
              </View>
            </View>

            <TouchableOpacity
              style={{ backgroundColor: saving ? c.border : c.primary, borderRadius: 16, height: 64, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 8, shadowColor: c.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 8, elevation: 5 }}
              onPress={handleSale}
              disabled={saving}
            >
              {saving ? <Text style={{ color: "#fff", fontWeight: "800", fontSize: 18 }}>...</Text> : (
                <>
                  <Ionicons name="checkmark-circle" size={24} color="#fff" />
                  <Text style={{ color: "#fff", fontWeight: "800", fontSize: 18 }}>{t.sales.write}</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}
