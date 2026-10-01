import { useCallback, useState } from "react";
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, Alert } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { api } from "@/services/api";
import { useTheme } from "@/hooks/useTheme";

type CartItem = {
  id: string;
  productId: string;
  quantity: number;
  price: number;
  product?: { name: string; stock: number };
};

export default function CartScreen() {
  const { c } = useTheme();
  const [items, setItems] = useState<CartItem[]>([]);
  const [totalPrice, setTotalPrice] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data: body } = await api.get("/cart");
      const payload = body?.data ?? body ?? {};
      const cart = payload.cart ?? payload;
      setItems(cart.items ?? []);
      setTotalPrice(cart.totalPrice ?? 0);
    } catch {
      Alert.alert("Xato", "Savatni yuklab bo'lmadi");
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  async function updateQty(productId: string, quantity: number) {
    setBusyId(productId);
    try {
      if (quantity <= 0) {
        await api.delete(`/cart/item/${productId}`);
      } else {
        await api.patch(`/cart/item/${productId}`, { quantity });
      }
      await load();
    } catch (e: any) {
      Alert.alert("Xato", e.response?.data?.message || "Savatni yangilab bo'lmadi");
    } finally {
      setBusyId(null);
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
        <Text style={{ color: c.text, fontSize: 28, fontWeight: "800" }}>Savat</Text>
      </View>

      <FlatList
        data={items}
        keyExtractor={(i) => i.id}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 140, paddingTop: 8 }}
        ListEmptyComponent={
          <View style={{ alignItems: "center", paddingTop: 80 }}>
            <Ionicons name="cart-outline" size={52} color={c.border} style={{ marginBottom: 12 }} />
            <Text style={{ color: c.textMuted, fontSize: 16, fontWeight: "600" }}>Savat bo'sh</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={{ backgroundColor: c.bgCard, borderRadius: 16, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: c.border, flexDirection: "row", alignItems: "center" }}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: c.text, fontWeight: "700", fontSize: 15 }}>{item.product?.name ?? "Tovar"}</Text>
              <Text style={{ color: c.primary, fontWeight: "800", fontSize: 14, marginTop: 4 }}>
                {(item.price * item.quantity).toLocaleString()} so'm
              </Text>
            </View>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <TouchableOpacity
                disabled={busyId === item.productId}
                onPress={() => updateQty(item.productId, item.quantity - 1)}
                style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: c.bgMuted, alignItems: "center", justifyContent: "center" }}
              >
                <Ionicons name="remove" size={16} color={c.text} />
              </TouchableOpacity>
              <Text style={{ color: c.text, fontWeight: "700", fontSize: 14, minWidth: 20, textAlign: "center" }}>{item.quantity}</Text>
              <TouchableOpacity
                disabled={busyId === item.productId}
                onPress={() => updateQty(item.productId, item.quantity + 1)}
                style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: c.primary, alignItems: "center", justifyContent: "center" }}
              >
                <Ionicons name="add" size={16} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        )}
      />

      {items.length > 0 && (
        <View style={{ position: "absolute", bottom: 0, left: 0, right: 0, backgroundColor: c.bg, padding: 20, paddingBottom: 36, borderTopWidth: 1, borderTopColor: c.border }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 12 }}>
            <Text style={{ color: c.textMuted, fontWeight: "600" }}>Jami</Text>
            <Text style={{ color: c.text, fontWeight: "800", fontSize: 18 }}>{totalPrice.toLocaleString()} so'm</Text>
          </View>
          <TouchableOpacity
            onPress={() => router.push("/marketplace/checkout")}
            style={{ backgroundColor: c.primary, borderRadius: 16, height: 54, alignItems: "center", justifyContent: "center" }}
          >
            <Text style={{ color: "#fff", fontWeight: "800", fontSize: 16 }}>Buyurtma berish</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}
