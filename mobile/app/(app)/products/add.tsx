import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, Modal, FlatList } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { database, productsCollection, categoriesCollection } from "@/db";
import { useT } from "@/hooks/useT";
import { useTheme } from "@/hooks/useTheme";
import { useCategories } from "@/hooks/useCategories";
import { useProductCount } from "@/hooks/useProducts";
import { useRoleStore } from "@/store/roleStore";
import { useSubscriptionStore } from "@/store/subscriptionStore";
import { BarcodeScanner } from "@/components/BarcodeScanner";

const UNIT_KEYS = ["kg", "dona", "litr", "metr", "paket", "quti"] as const;
type UnitKey = typeof UNIT_KEYS[number];

const CATEGORY_COLORS = ["#9AB17A", "#F59E0B", "#3B82F6", "#EF4444", "#8B5CF6", "#EC4899", "#14B8A6", "#F97316"];

export default function AddProductScreen() {
  const t = useT();
  const { c } = useTheme();
  const categories = useCategories();
  const productCount = useProductCount();
  const { isAdmin } = useRoleStore();
  const { getProductLimit } = useSubscriptionStore();
  const FREE_LIMIT = getProductLimit();

  const [name, setName] = useState("");
  const [buyPrice, setBuyPrice] = useState("");
  const [sellPrice, setSellPrice] = useState("");
  const [stock, setStock] = useState("");
  const [barcode, setBarcode] = useState("");
  const [unit, setUnit] = useState<UnitKey>("dona");
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [showCatModal, setShowCatModal] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [newCatColor, setNewCatColor] = useState(CATEGORY_COLORS[0]);

  const profit = buyPrice && sellPrice ? Number(sellPrice) - Number(buyPrice) : null;
  const selectedCat = categories.find((c) => c.id === categoryId);

  async function handleSave() {
    if (!isAdmin()) {
      Alert.alert(t.employees.restricted, t.employees.adminOnly);
      return;
    }
    if (productCount >= FREE_LIMIT) {
      Alert.alert(
        t.subscription.limitTitle,
        t.subscription.limitDesc,
        [
          { text: t.common.cancel, style: "cancel" },
          { text: t.subscription.goToPro, onPress: () => router.push("/settings/subscription") },
        ]
      );
      return;
    }
    if (!name.trim() || !buyPrice || !sellPrice) {
      Alert.alert(t.common.error, t.products.name);
      return;
    }
    setSaving(true);
    try {
      await database.write(async () => {
        await productsCollection.create((p) => {
          p.name = name.trim();
          p.buyPrice = Number(buyPrice);
          p.sellPrice = Number(sellPrice);
          p.stockQty = Number(stock) || 0;
          p.unit = unit;
          p.barcode = barcode.trim() || null;
          p.categoryId = categoryId;
          p.archivedAt = null;
          p.isSynced = false;
          p.serverId = null;
        });
      });
      router.back();
    } catch {
      Alert.alert(t.common.error, t.common.saveError);
    } finally {
      setSaving(false);
    }
  }

  async function handleCreateCategory() {
    if (!newCatName.trim()) return;
    try {
      const cat = await database.write(async () =>
        categoriesCollection.create((c) => {
          c.name = newCatName.trim();
          c.color = newCatColor;
        })
      );
      setCategoryId(cat.id);
      setNewCatName("");
      setNewCatColor(CATEGORY_COLORS[0]);
      setShowCatModal(false);
    } catch {}
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: c.bg }} keyboardShouldPersistTaps="handled">
      {/* Header */}
      <View style={{ backgroundColor: c.bg, paddingHorizontal: 16, paddingTop: 56, paddingBottom: 12 }}>
        <TouchableOpacity onPress={() => router.back()} style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
          <Ionicons name="chevron-back" size={20} color={c.primary} />
          <Text style={{ color: c.primary, fontWeight: "600", fontSize: 14 }}>{t.products.cancel}</Text>
        </TouchableOpacity>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <Text style={{ color: c.text, fontSize: 26, fontWeight: "800" }}>{t.products.addProduct}</Text>
          <Text style={{ color: productCount >= FREE_LIMIT ? c.danger : c.textMuted, fontSize: 12, fontWeight: "600" }}>
            {productCount}/{FREE_LIMIT}
          </Text>
        </View>
      </View>

      <View style={{ paddingHorizontal: 16, gap: 14, paddingBottom: 40 }}>
        <Field label={t.products.name} value={name} onChangeText={setName} placeholder="Masalan: Shakar" c={c} />
        <Field label={t.products.buyPrice} value={buyPrice} onChangeText={setBuyPrice} keyboardType="numeric" placeholder="0" c={c} />
        <Field label={t.products.sellPrice} value={sellPrice} onChangeText={setSellPrice} keyboardType="numeric" placeholder="0" c={c} />
        <Field label={t.products.stock} value={stock} onChangeText={setStock} keyboardType="numeric" placeholder="0" c={c} />

        {/* Barcode */}
        <View>
          <Text style={{ color: c.primaryDark, fontWeight: "700", marginBottom: 6 }}>{t.products.barcode}</Text>
          <View style={{ flexDirection: "row", gap: 8 }}>
            <View style={{ flex: 1, backgroundColor: c.bgCard, borderWidth: 1.5, borderColor: barcode ? c.primary : c.border, borderRadius: 14, paddingHorizontal: 14, height: 50, justifyContent: "center" }}>
              <Text style={{ color: barcode ? c.text : c.textMuted, fontSize: 15 }} numberOfLines={1}>
                {barcode || t.products.barcodePlaceholder}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => setShowScanner(true)}
              style={{ width: 50, height: 50, backgroundColor: c.primary + "18", borderRadius: 14, alignItems: "center", justifyContent: "center", borderWidth: 1.5, borderColor: c.primary + "40" }}
            >
              <Ionicons name="barcode-outline" size={22} color={c.primary} />
            </TouchableOpacity>
            {barcode.length > 0 && (
              <TouchableOpacity
                onPress={() => setBarcode("")}
                style={{ width: 50, height: 50, backgroundColor: c.bgMuted, borderRadius: 14, alignItems: "center", justifyContent: "center" }}
              >
                <Ionicons name="close" size={20} color={c.textMuted} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Kategoriya */}
        <View>
          <Text style={{ color: c.primaryDark, fontWeight: "700", marginBottom: 8 }}>{t.categories.title}</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            <TouchableOpacity
              onPress={() => setCategoryId(null)}
              style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, backgroundColor: !categoryId ? c.primary : c.bgMuted, borderWidth: 1, borderColor: !categoryId ? c.primary : c.border }}
            >
              <Text style={{ color: !categoryId ? "#fff" : c.primaryDark, fontWeight: "700", fontSize: 13 }}>{t.categories.all}</Text>
            </TouchableOpacity>
            {categories.map((cat) => (
              <TouchableOpacity
                key={cat.id}
                onPress={() => setCategoryId(cat.id)}
                style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, backgroundColor: categoryId === cat.id ? cat.color : c.bgMuted, borderWidth: 1, borderColor: cat.color }}
              >
                <Text style={{ color: categoryId === cat.id ? "#fff" : cat.color, fontWeight: "700", fontSize: 13 }}>{cat.name}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              onPress={() => setShowCatModal(true)}
              style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, backgroundColor: c.bgMuted, borderWidth: 1, borderColor: c.border, flexDirection: "row", alignItems: "center", gap: 4 }}
            >
              <Ionicons name="add" size={14} color={c.primary} />
              <Text style={{ color: c.primary, fontWeight: "700", fontSize: 13 }}>{t.categories.new}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Unit */}
        <View>
          <Text style={{ color: c.primaryDark, fontWeight: "700", marginBottom: 8 }}>{t.products.unit}</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {UNIT_KEYS.map((u) => (
              <TouchableOpacity
                key={u}
                onPress={() => setUnit(u)}
                style={{ paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12, backgroundColor: unit === u ? c.primary : c.bgMuted, borderWidth: 1, borderColor: unit === u ? c.primary : c.border }}
              >
                <Text style={{ color: unit === u ? "#fff" : c.primaryDark, fontWeight: "700" }}>
                  {t.products.units[u]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Profit preview */}
        {profit !== null && (
          <View style={{ backgroundColor: profit >= 0 ? c.bgMuted : "#FEE2E2", borderRadius: 16, padding: 14, flexDirection: "row", alignItems: "center", gap: 10 }}>
            <Ionicons name={profit >= 0 ? "trending-up" : "trending-down"} size={20} color={profit >= 0 ? c.primaryDark : c.danger} />
            <View>
              <Text style={{ color: profit >= 0 ? c.accent : c.danger, fontSize: 12, fontWeight: "600" }}>{t.products.profit}</Text>
              <Text style={{ color: profit >= 0 ? c.primaryDark : c.danger, fontWeight: "800", fontSize: 22, marginTop: 2 }}>
                {profit >= 0 ? "+" : ""}{profit.toLocaleString()} so'm
              </Text>
            </View>
          </View>
        )}

        <TouchableOpacity
          style={{ backgroundColor: saving ? c.border : c.primary, borderRadius: 16, height: 56, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 8, marginTop: 8, shadowColor: c.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 8, elevation: 5 }}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? <Text style={{ color: "#fff", fontWeight: "800", fontSize: 17 }}>...</Text> : (
            <>
              <Ionicons name="save" size={20} color="#fff" />
              <Text style={{ color: "#fff", fontWeight: "800", fontSize: 17 }}>{t.products.save}</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Barcode scanner modali */}
      <Modal visible={showScanner} animationType="slide">
        <BarcodeScanner
          onScanned={(code) => {
            setBarcode(code);
            setShowScanner(false);
          }}
          onClose={() => setShowScanner(false)}
        />
      </Modal>

      {/* Kategoriya qo'shish modali */}
      <Modal visible={showCatModal} transparent animationType="slide">
        <View style={{ flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.5)" }}>
          <View style={{ backgroundColor: c.bgCard, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 }}>
            <Text style={{ color: c.text, fontSize: 18, fontWeight: "800", marginBottom: 16 }}>{t.categories.newCategory}</Text>
            <TextInput
              style={{ backgroundColor: c.bgMuted, borderRadius: 14, paddingHorizontal: 14, height: 50, fontSize: 15, color: c.text, marginBottom: 14, borderWidth: 1, borderColor: c.border }}
              placeholder={t.categories.namePlaceholder}
              placeholderTextColor={c.textMuted}
              value={newCatName}
              onChangeText={setNewCatName}
              autoFocus
            />
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 20 }}>
              {CATEGORY_COLORS.map((col) => (
                <TouchableOpacity
                  key={col}
                  onPress={() => setNewCatColor(col)}
                  style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: col, borderWidth: newCatColor === col ? 3 : 0, borderColor: c.text }}
                />
              ))}
            </View>
            <View style={{ flexDirection: "row", gap: 10 }}>
              <TouchableOpacity onPress={() => setShowCatModal(false)} style={{ flex: 1, height: 50, borderRadius: 14, backgroundColor: c.bgMuted, alignItems: "center", justifyContent: "center" }}>
                <Text style={{ color: c.textSub, fontWeight: "700" }}>{t.categories.cancel}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleCreateCategory} style={{ flex: 1, height: 50, borderRadius: 14, backgroundColor: newCatColor, alignItems: "center", justifyContent: "center" }}>
                <Text style={{ color: "#fff", fontWeight: "800" }}>{t.categories.save}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

function Field({ label, c, ...props }: { label: string; c: ReturnType<typeof useTheme>["c"] } & React.ComponentProps<typeof TextInput>) {
  return (
    <View>
      <Text style={{ color: c.primaryDark, fontWeight: "700", marginBottom: 6 }}>{label}</Text>
      <TextInput
        style={{ backgroundColor: c.bgCard, borderWidth: 1.5, borderColor: c.border, borderRadius: 14, paddingHorizontal: 14, height: 50, fontSize: 15, color: c.text }}
        placeholderTextColor={c.border}
        {...props}
      />
    </View>
  );
}
