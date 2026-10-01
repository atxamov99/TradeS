import { useCallback, useEffect, useState } from "react";
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, Alert } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { api } from "@/services/api";
import { useTheme } from "@/hooks/useTheme";

type ShopDetail = {
  id: string;
  name: string;
  description: string;
  isBlocked: boolean;
  owner: { name: string | null };
};

type ShopProduct = {
  id: string;
  name: string;
  finalPrice: number;
  stock: number;
  unit: string;
  isActive: boolean;
};

export default function ShopDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { c } = useTheme();
  const [shop, setShop] = useState<ShopDetail | null>(null);
  const [products, setProducts] = useState<ShopProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingId, setAddingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [shopRes, productsRes] = await Promise.all([
        api.get(`/shops/${id}`),
        api.get(`/shops/${id}/products`, { params: { limit: 200 } }),
      ]);
      const shopPayload = shopRes.data?.data ?? shopRes.data ?? {};
      const productsPayload = productsRes.data?.data ?? productsRes.data ?? {};
      setShop(shopPayload.shop ?? null);
      setProducts((productsPayload.products ?? []).filter((p: ShopProduct) => p.isActive));
    } catch {
      Alert.alert("Xato", "Do'kon ma'lumotini yuklab bo'lmadi");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  async function addToCart(product: ShopProduct) {
    if (product.stock <= 0) return;
    setAddingId(product.id);
    try {
      await api.post("/cart/add", { productId: product.id, quantity: 1 });
      Alert.alert("Qo'shildi", `"${product.name}" savatga qo'shildi`);
    } catch (e: any) {
      Alert.alert("Xato", e.response?.data?.message || "Savatga qo'shib bo'lmadi");
    } finally {
      setAddingId(null);
    }
  }

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: c.bg, justifyContent: "center" }}>
        <ActivityIndicator color={c.primary} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <View style={{ backgroundColor: c.bg, paddingHorizontal: 20, paddingTop: 56, paddingBottom: 12 }}>
        <TouchableOpacity onPress={() => router.back()} style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
          <Ionicons name="chevron-back" size={20} color={c.primary} />
          <Text style={{ color: c.primary, fontWeight: "600" }}>Orqaga</Text>
        </TouchableOpacity>
        <Text style={{ color: c.text, fontSize: 24, fontWeight: "800" }}>{shop?.name}</Text>
        {!!shop?.description && (
          <Text style={{ color: c.textMuted, fontSize: 13, marginTop: 4 }}>{shop.description}</Text>
        )}
        {shop?.isBlocked && (
          <View style={{ backgroundColor: c.danger + "15", borderRadius: 10, padding: 10, marginTop: 10 }}>
            <Text style={{ color: c.danger, fontWeight: "700", fontSize: 12 }}>Bu do'kon vaqtincha bloklangan</Text>
          </View>
        )}
      </View>

      <FlatList
        data={products}
        keyExtractor={(p) => p.id}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100, paddingTop: 8 }}
        ListEmptyComponent={
          <View style={{ alignItems: "center", paddingTop: 60 }}>
            <Text style={{ color: c.textMuted, fontSize: 15 }}>Bu do'konda hozircha tovar yo'q</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={{ backgroundColor: c.bgCard, borderRadius: 16, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: c.border, flexDirection: "row", alignItems: "center" }}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: c.text, fontWeight: "700", fontSize: 15 }}>{item.name}</Text>
              <Text style={{ color: c.textMuted, fontSize: 12, marginTop: 2 }}>
                {item.stock > 0 ? `${item.stock} ${item.unit} bor` : "Tugagan"}
              </Text>
              <Text style={{ color: c.primary, fontWeight: "800", fontSize: 15, marginTop: 4 }}>
                {item.finalPrice.toLocaleString()} so'm
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => addToCart(item)}
              disabled={item.stock <= 0 || addingId === item.id}
              style={{
                width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center",
                backgroundColor: item.stock <= 0 ? c.bgMuted : c.primary,
              }}
            >
              {addingId === item.id ? (
                <ActivityIndicator size="small" color={item.stock <= 0 ? c.textMuted : "#fff"} />
              ) : (
                <Ionicons name="add" size={22} color={item.stock <= 0 ? c.textMuted : "#fff"} />
              )}
            </TouchableOpacity>
          </View>
        )}
      />
    </View>
  );
}
