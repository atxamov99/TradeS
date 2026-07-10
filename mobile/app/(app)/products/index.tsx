import { View, Text, FlatList, TouchableOpacity, TextInput, ScrollView, Modal } from "react-native";
import { useState } from "react";
import { router } from "expo-router";
import { useProducts } from "@/hooks/useProducts";
import { useCategories } from "@/hooks/useCategories";
import { useT } from "@/hooks/useT";
import { useTheme } from "@/hooks/useTheme";
import { Ionicons } from "@expo/vector-icons";
import { database } from "@/db";
import { Product } from "@/db/models/Product";
import { DraggableFAB } from "@/components/DraggableFAB";

function stockInfo(qty: number, c: any): { color: string; label: string; bg: string } {
  if (qty === 0) return { color: c.danger, label: "Tugadi", bg: c.danger + "18" };
  if (qty <= 5)  return { color: c.warn,   label: `${qty} ta`, bg: c.warn + "18" };
  return             { color: c.primary, label: `${qty} ta`, bg: c.primary + "14" };
}

export default function ProductsScreen() {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [menuProduct, setMenuProduct] = useState<Product | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const products = useProducts(search, selectedCategory);
  const categories = useCategories();
  const t = useT();
  const { c } = useTheme();

  async function deleteProduct(item: Product) {
    setConfirmDelete(false);
    setMenuProduct(null);
    try {
      await database.write(async () => {
        await item.destroyPermanently();
      });
    } catch {}
  }

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      {/* Header */}
      <View style={{ backgroundColor: c.bg, paddingHorizontal: 20, paddingTop: 56, paddingBottom: 8 }}>
        <Text style={{ color: c.text, fontSize: 28, fontWeight: "800", marginBottom: 14 }}>{t.products.title}</Text>
        <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: c.bgCard, borderRadius: 14, paddingHorizontal: 14, borderWidth: 1, borderColor: c.border }}>
          <Ionicons name="search" size={17} color={c.textMuted} />
          <TextInput
            style={{ flex: 1, height: 46, marginLeft: 10, fontSize: 15, color: c.text }}
            placeholder={t.products.search}
            placeholderTextColor={c.textMuted}
            value={search}
            onChangeText={setSearch}
          />
        </View>
      </View>

      {/* Category chips */}
      {categories.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 8, gap: 8 }}
          style={{ flexGrow: 0 }}
        >
          <TouchableOpacity
            onPress={() => setSelectedCategory(null)}
            style={{
              paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20,
              backgroundColor: selectedCategory === null ? c.primary : c.bgCard,
              borderWidth: 1.5, borderColor: selectedCategory === null ? c.primary : c.border,
            }}
          >
            <Text style={{ color: selectedCategory === null ? "#fff" : c.textSub, fontWeight: "700", fontSize: 13 }}>Hammasi</Text>
          </TouchableOpacity>
          {categories.map((cat) => {
            const isActive = selectedCategory === cat.id;
            const dotColor = cat.color || c.primary;
            return (
              <TouchableOpacity
                key={cat.id}
                onPress={() => setSelectedCategory(isActive ? null : cat.id)}
                style={{
                  paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20,
                  backgroundColor: isActive ? dotColor + "22" : c.bgCard,
                  borderWidth: 1.5, borderColor: isActive ? dotColor : c.border,
                  flexDirection: "row", alignItems: "center", gap: 6,
                }}
              >
                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: dotColor }} />
                <Text style={{ color: isActive ? dotColor : c.textSub, fontWeight: "700", fontSize: 13 }}>{cat.name}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

      <FlatList
        data={products}
        keyExtractor={(p) => p.id}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100, paddingTop: 8 }}
        ListEmptyComponent={
          <View style={{ alignItems: "center", paddingTop: 80 }}>
            <Text style={{ fontSize: 48, marginBottom: 12 }}>📦</Text>
            <Text style={{ color: c.textMuted, fontSize: 16, fontWeight: "600" }}>{t.products.noProducts}</Text>
          </View>
        }
        renderItem={({ item }) => {
          const stock = stockInfo(item.stockQty, c);
          return (
            <TouchableOpacity
              style={{ backgroundColor: c.bgCard, borderRadius: 18, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: c.border }}
              onPress={() => router.push(`/products/${item.id}`)}
              onLongPress={() => setMenuProduct(item)}
              delayLongPress={400}
            >
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={{ color: c.text, fontWeight: "800", fontSize: 16 }}>{item.name}</Text>
                  <View style={{ flexDirection: "row", alignItems: "center", marginTop: 5, gap: 5 }}>
                    <View style={{ backgroundColor: stock.bg, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, flexDirection: "row", alignItems: "center", gap: 4 }}>
                      <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: stock.color }} />
                      <Text style={{ color: stock.color, fontSize: 12, fontWeight: "700" }}>
                        {item.stockQty === 0 ? "Tugadi" : stock.label} {item.stockQty > 0 ? item.unit : ""}
                      </Text>
                    </View>
                  </View>
                </View>

                <View style={{ alignItems: "flex-end", gap: 4 }}>
                  <View style={{ backgroundColor: c.bgMuted, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 5 }}>
                    <Text style={{ color: c.primary, fontWeight: "800", fontSize: 13 }}>
                      {item.sellPrice.toLocaleString()} so'm
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => setMenuProduct(item)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Ionicons name="ellipsis-horizontal" size={18} color={c.textMuted} />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={{ height: 1, backgroundColor: c.border, marginVertical: 12 }} />

              <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                <View>
                  <Text style={{ color: c.textMuted, fontSize: 11, fontWeight: "600" }}>{t.products.buyLabel.toUpperCase()}</Text>
                  <Text style={{ color: c.text, fontWeight: "700", fontSize: 13 }}>{item.buyPrice.toLocaleString()}</Text>
                </View>
                <View style={{ alignItems: "center" }}>
                  <Text style={{ color: c.textMuted, fontSize: 11, fontWeight: "600" }}>{t.products.sellLabel.toUpperCase()}</Text>
                  <Text style={{ color: c.text, fontWeight: "700", fontSize: 13 }}>{item.sellPrice.toLocaleString()}</Text>
                </View>
                <View style={{ alignItems: "flex-end" }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
                    <Ionicons name="trending-up" size={11} color={c.primary} />
                    <Text style={{ color: c.textMuted, fontSize: 11, fontWeight: "600" }}>{t.products.profitLabel.toUpperCase()}</Text>
                  </View>
                  <Text style={{ color: c.primary, fontWeight: "800", fontSize: 14 }}>+{item.profit.toLocaleString()}</Text>
                </View>
              </View>
            </TouchableOpacity>
          );
        }}
      />

      <DraggableFAB color={c.primary} onPress={() => router.push("/products/add")} bottomOffset={160} />

      {/* Options bottom sheet */}
      <Modal
        visible={!!menuProduct && !confirmDelete}
        transparent
        animationType="slide"
        onRequestClose={() => setMenuProduct(null)}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setMenuProduct(null)}
          style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "flex-end" }}
        >
          <TouchableOpacity activeOpacity={1} onPress={() => {}}>
            <View style={{ backgroundColor: c.bgCard, borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingTop: 12, paddingBottom: 40, paddingHorizontal: 20 }}>
              <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: c.border, alignSelf: "center", marginBottom: 20 }} />
              <Text style={{ color: c.text, fontSize: 17, fontWeight: "800", marginBottom: 4 }} numberOfLines={1}>
                {menuProduct?.name}
              </Text>
              <Text style={{ color: c.textMuted, fontSize: 13, marginBottom: 20 }}>
                {menuProduct?.sellPrice.toLocaleString()} so'm · {menuProduct?.stockQty} {menuProduct?.unit}
              </Text>

              <TouchableOpacity
                onPress={() => { router.push(`/products/${menuProduct?.id}`); setMenuProduct(null); }}
                style={{ flexDirection: "row", alignItems: "center", gap: 14, backgroundColor: c.bgMuted, borderRadius: 16, paddingHorizontal: 16, paddingVertical: 15, marginBottom: 10 }}
              >
                <View style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: c.primary + "18", alignItems: "center", justifyContent: "center" }}>
                  <Ionicons name="create-outline" size={20} color={c.primary} />
                </View>
                <Text style={{ color: c.text, fontWeight: "700", fontSize: 15 }}>Tahrirlash</Text>
                <View style={{ flex: 1 }} />
                <Ionicons name="chevron-forward" size={16} color={c.textMuted} />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setConfirmDelete(true)}
                style={{ flexDirection: "row", alignItems: "center", gap: 14, backgroundColor: c.danger + "12", borderRadius: 16, paddingHorizontal: 16, paddingVertical: 15, marginBottom: 10 }}
              >
                <View style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: c.danger + "20", alignItems: "center", justifyContent: "center" }}>
                  <Ionicons name="trash-outline" size={20} color={c.danger} />
                </View>
                <Text style={{ color: c.danger, fontWeight: "700", fontSize: 15 }}>O'chirish</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setMenuProduct(null)}
                style={{ backgroundColor: c.bgMuted, borderRadius: 16, height: 50, alignItems: "center", justifyContent: "center" }}
              >
                <Text style={{ color: c.textSub, fontWeight: "700", fontSize: 15 }}>{t.products.cancel}</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Delete confirm modal */}
      <Modal
        visible={confirmDelete}
        transparent
        animationType="fade"
        onRequestClose={() => setConfirmDelete(false)}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setConfirmDelete(false)}
          style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.55)", justifyContent: "flex-end" }}
        >
          <TouchableOpacity activeOpacity={1} onPress={() => {}}>
            <View style={{ backgroundColor: c.bgCard, borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingTop: 12, paddingBottom: 40, paddingHorizontal: 20 }}>
              <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: c.border, alignSelf: "center", marginBottom: 24 }} />
              <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: c.danger + "18", alignItems: "center", justifyContent: "center", alignSelf: "center", marginBottom: 16 }}>
                <Ionicons name="trash" size={28} color={c.danger} />
              </View>
              <Text style={{ color: c.text, fontSize: 20, fontWeight: "800", textAlign: "center", marginBottom: 8 }}>
                O'chirishni tasdiqlang
              </Text>
              <Text style={{ color: c.textMuted, fontSize: 14, textAlign: "center", lineHeight: 20, marginBottom: 28 }}>
                {`"${menuProduct?.name}" tovarini o'chirasizmi?\nBu amalni qaytarib bo'lmaydi.`}
              </Text>
              <TouchableOpacity
                onPress={() => menuProduct && deleteProduct(menuProduct)}
                style={{ backgroundColor: c.danger, borderRadius: 16, height: 54, alignItems: "center", justifyContent: "center", marginBottom: 10 }}
              >
                <Text style={{ color: "#fff", fontWeight: "800", fontSize: 16 }}>Ha, o'chirish</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setConfirmDelete(false)}
                style={{ backgroundColor: c.bgMuted, borderRadius: 16, height: 50, alignItems: "center", justifyContent: "center" }}
              >
                <Text style={{ color: c.textSub, fontWeight: "700", fontSize: 15 }}>{t.products.cancel}</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}
