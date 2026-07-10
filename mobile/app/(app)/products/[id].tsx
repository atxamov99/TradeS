import { useState, useEffect, useRef } from "react";
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, Modal } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { database } from "@/db";
import { salesCollection } from "@/db";
import { useProduct } from "@/hooks/useProducts";
import { useT } from "@/hooks/useT";
import { useTheme } from "@/hooks/useTheme";
import { useRoleStore } from "@/store/roleStore";
import { Q } from "@nozbe/watermelondb";
import { Sale } from "@/db/models/Sale";

function StatCard({ icon, label, value, color, c }: {
  icon: any; label: string; value: string; color: string; c: any;
}) {
  return (
    <View style={{ flex: 1, backgroundColor: c.bgCard, borderRadius: 14, padding: 12, alignItems: "center", borderWidth: 1, borderColor: c.border }}>
      <Ionicons name={icon} size={18} color={color} />
      <Text style={{ color: c.textMuted, fontSize: 10, fontWeight: "600", marginTop: 4, textAlign: "center" }}>{label}</Text>
      <Text style={{ color, fontSize: 15, fontWeight: "800", marginTop: 2, textAlign: "center" }}>{value}</Text>
    </View>
  );
}

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const product = useProduct(id);
  const t = useT();
  const { c } = useTheme();
  const { isAdmin } = useRoleStore();

  const [name, setName] = useState("");
  const [buyPrice, setBuyPrice] = useState("");
  const [sellPrice, setSellPrice] = useState("");
  const [stock, setStock] = useState("");
  const [barcode, setBarcode] = useState("");
  const [saving, setSaving] = useState(false);
  const [sales, setSales] = useState<Sale[]>([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const initialized = useRef(false);

  useEffect(() => {
    if (product && !initialized.current) {
      setName(product.name);
      setBuyPrice(String(product.buyPrice));
      setSellPrice(String(product.sellPrice));
      setStock(String(product.stockQty));
      setBarcode(product.barcode ?? "");
      initialized.current = true;
    }
  }, [product]);

  useEffect(() => {
    if (!id) return;
    const sub = salesCollection
      .query(Q.where("product_id", id))
      .observe()
      .subscribe(setSales);
    return () => sub.unsubscribe();
  }, [id]);

  if (!product || !initialized.current) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: c.bg }}>
        <Ionicons name="hourglass" size={32} color={c.border} />
        <Text style={{ color: c.textMuted, marginTop: 8 }}>{t.common.loading}</Text>
      </View>
    );
  }

  const totalSoldQty = sales.reduce((sum, s) => sum + s.qty, 0);
  const totalRevenue = sales.reduce((sum, s) => sum + s.sellPrice * s.qty, 0);
  const totalProfit = sales.reduce((sum, s) => sum + s.profit, 0);
  const lastSoldAt = sales.length > 0 ? Math.max(...sales.map((s) => s.soldAt)) : null;

  async function handleUpdate() {
    if (!product) return;
    if (!isAdmin()) {
      Alert.alert(t.employees.restricted, t.employees.adminOnly);
      return;
    }
    setSaving(true);
    try {
      await database.write(async () => {
        await product.update((p) => {
          p.name = name.trim();
          p.buyPrice = Number(buyPrice);
          p.sellPrice = Number(sellPrice);
          p.stockQty = Number(stock);
          p.barcode = barcode.trim() || null;
          p.isSynced = false;
        });
      });
      router.back();
    } catch {
      Alert.alert(t.common.error, t.common.saveError);
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    setShowDeleteModal(false);
    try {
      await database.write(async () => {
        await product.destroyPermanently();
      });
      router.back();
    } catch {
      Alert.alert(t.common.error, "O'chirishda xato yuz berdi");
    }
  }

  const profit = Number(sellPrice) - Number(buyPrice);
  const stockNum = Number(stock);
  const stockColor = stockNum === 0 ? c.danger : stockNum <= 5 ? c.warn : c.primary;
  const stockLabel = stockNum === 0 ? "Tugadi" : stockNum <= 5 ? "Kam qoldi" : "Yetarli";

  return (
    <ScrollView style={{ flex: 1, backgroundColor: c.bg }} keyboardShouldPersistTaps="handled">
      {/* Header */}
      <View style={{ backgroundColor: c.bg, paddingHorizontal: 16, paddingTop: 56, paddingBottom: 12, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <TouchableOpacity onPress={() => router.back()} style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
          <Ionicons name="chevron-back" size={20} color={c.primary} />
          <Text style={{ color: c.primary, fontWeight: "600" }}>{t.products.cancel}</Text>
        </TouchableOpacity>
        <Text style={{ color: c.text, fontSize: 18, fontWeight: "800" }}>{t.products.update}</Text>
        <TouchableOpacity onPress={() => setShowDeleteModal(true)} style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
          <Ionicons name="trash" size={16} color={c.danger} />
          <Text style={{ color: c.danger, fontSize: 13, fontWeight: "600" }}>{t.products.delete}</Text>
        </TouchableOpacity>
      </View>

      <View style={{ paddingHorizontal: 16, gap: 14, paddingBottom: 40 }}>

        {/* Stats row */}
        {sales.length > 0 && (
          <View style={{ gap: 8 }}>
            <Text style={{ color: c.textMuted, fontSize: 12, fontWeight: "700", letterSpacing: 0.5 }}>SOTUVLAR STATISTIKASI</Text>
            <View style={{ flexDirection: "row", gap: 8 }}>
              <StatCard icon="cube" label="Jami sotilgan" value={`${totalSoldQty} ta`} color={c.primary} c={c} />
              <StatCard icon="cash" label="Jami tushum" value={`${totalRevenue.toLocaleString()}`} color={c.accent} c={c} />
              <StatCard icon="trending-up" label="Jami foyda" value={`${totalProfit.toLocaleString()}`} color={totalProfit >= 0 ? c.primaryDark : c.danger} c={c} />
            </View>
            {lastSoldAt && (
              <Text style={{ color: c.textMuted, fontSize: 12, textAlign: "right" }}>
                Oxirgi sotuv: {new Date(lastSoldAt).toLocaleDateString("uz-UZ")}
              </Text>
            )}
          </View>
        )}

        {/* Stock status badge */}
        <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: c.bgCard, borderRadius: 14, padding: 14, borderWidth: 1.5, borderColor: stockColor + "44", gap: 10 }}>
          <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: stockColor }} />
          <Text style={{ color: c.text, fontWeight: "700", fontSize: 14, flex: 1 }}>Stok holati</Text>
          <Text style={{ color: stockColor, fontWeight: "800", fontSize: 14 }}>{stockLabel}</Text>
          <Text style={{ color: stockColor, fontWeight: "800", fontSize: 14 }}>({product.stockQty} {product.unit})</Text>
        </View>

        {/* Edit fields */}
        {[
          { label: t.products.name,      value: name,      setter: setName,      numeric: false },
          { label: t.products.buyPrice,  value: buyPrice,  setter: setBuyPrice,  numeric: true },
          { label: t.products.sellPrice, value: sellPrice, setter: setSellPrice, numeric: true },
          { label: t.products.stock,     value: stock,     setter: setStock,     numeric: true },
        ].map(({ label, value, setter, numeric }) => (
          <View key={label}>
            <Text style={{ color: c.primaryDark, fontWeight: "700", marginBottom: 6 }}>{label}</Text>
            <TextInput
              style={{ backgroundColor: c.bgCard, borderWidth: 1.5, borderColor: c.border, borderRadius: 14, paddingHorizontal: 14, height: 50, fontSize: 15, color: c.text }}
              value={value}
              onChangeText={setter}
              keyboardType={numeric ? "numeric" : "default"}
              placeholderTextColor={c.border}
            />
          </View>
        ))}

        {/* Barcode */}
        <View>
          <Text style={{ color: c.primaryDark, fontWeight: "700", marginBottom: 6 }}>{t.products.barcode}</Text>
          <TextInput
            style={{ backgroundColor: c.bgCard, borderWidth: 1.5, borderColor: barcode ? c.primary + "80" : c.border, borderRadius: 14, paddingHorizontal: 14, height: 50, fontSize: 15, color: c.text }}
            value={barcode}
            onChangeText={setBarcode}
            placeholder={t.products.barcodePlaceholder}
            placeholderTextColor={c.border}
          />
        </View>

        {buyPrice && sellPrice && (
          <View style={{ backgroundColor: profit >= 0 ? c.bgMuted : "#FEE2E2", borderRadius: 16, padding: 16, flexDirection: "row", alignItems: "center", gap: 10 }}>
            <Ionicons
              name={profit >= 0 ? "trending-up" : "trending-down"}
              size={20}
              color={profit >= 0 ? c.primaryDark : c.danger}
            />
            <View>
              <Text style={{ color: profit >= 0 ? c.accent : c.danger, fontSize: 12, fontWeight: "600" }}>
                {t.products.profit}
              </Text>
              <Text style={{ color: profit >= 0 ? c.primaryDark : c.danger, fontWeight: "800", fontSize: 24, marginTop: 2 }}>
                {profit >= 0 ? "+" : ""}{profit.toLocaleString()} so'm
              </Text>
            </View>
          </View>
        )}

        <TouchableOpacity
          style={{
            backgroundColor: saving ? c.border : c.primary,
            borderRadius: 16,
            height: 56,
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "row",
            gap: 8,
            marginTop: 8,
            shadowColor: c.primary,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.35,
            shadowRadius: 8,
            elevation: 5,
          }}
          onPress={handleUpdate}
          disabled={saving}
        >
          {saving ? (
            <Text style={{ color: "#fff", fontWeight: "800", fontSize: 17 }}>...</Text>
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={20} color="#fff" />
              <Text style={{ color: "#fff", fontWeight: "800", fontSize: 17 }}>{t.products.update}</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Delete button at bottom */}
        <TouchableOpacity
          onPress={() => setShowDeleteModal(true)}
          style={{ borderRadius: 16, height: 50, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 8, borderWidth: 1.5, borderColor: c.danger + "60", backgroundColor: c.danger + "10" }}
        >
          <Ionicons name="trash-outline" size={18} color={c.danger} />
          <Text style={{ color: c.danger, fontWeight: "700", fontSize: 15 }}>{t.products.delete}</Text>
        </TouchableOpacity>
      </View>

      {/* Custom Delete Confirmation Modal */}
      <Modal visible={showDeleteModal} transparent animationType="fade" onRequestClose={() => setShowDeleteModal(false)}>
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setShowDeleteModal(false)}
          style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.55)", justifyContent: "flex-end" }}
        >
          <TouchableOpacity activeOpacity={1} onPress={() => {}}>
            <View style={{ backgroundColor: c.bgCard, borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingTop: 12, paddingBottom: 40, paddingHorizontal: 20 }}>
              {/* Handle bar */}
              <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: c.border, alignSelf: "center", marginBottom: 24 }} />

              {/* Icon */}
              <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: c.danger + "18", alignItems: "center", justifyContent: "center", alignSelf: "center", marginBottom: 16 }}>
                <Ionicons name="trash" size={28} color={c.danger} />
              </View>

              <Text style={{ color: c.text, fontSize: 20, fontWeight: "800", textAlign: "center", marginBottom: 8 }}>
                {t.products.delete}
              </Text>
              <Text style={{ color: c.textMuted, fontSize: 14, textAlign: "center", lineHeight: 20, marginBottom: 28 }}>
                {`"${product.name}" tovarini o'chirasizmi?\nBu amalni qaytarib bo'lmaydi.`}
              </Text>

              <TouchableOpacity
                onPress={confirmDelete}
                style={{ backgroundColor: c.danger, borderRadius: 16, height: 54, alignItems: "center", justifyContent: "center", marginBottom: 10 }}
              >
                <Text style={{ color: "#fff", fontWeight: "800", fontSize: 16 }}>{t.products.delete}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setShowDeleteModal(false)}
                style={{ backgroundColor: c.bgMuted, borderRadius: 16, height: 50, alignItems: "center", justifyContent: "center" }}
              >
                <Text style={{ color: c.textSub, fontWeight: "700", fontSize: 15 }}>{t.products.cancel}</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </ScrollView>
  );
}
