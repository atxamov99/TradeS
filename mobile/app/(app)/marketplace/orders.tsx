import { useCallback, useState } from "react";
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl, Alert } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { api } from "@/services/api";
import { useTheme } from "@/hooks/useTheme";

type MyOrder = {
  id: string;
  orderNumber: string;
  orderStatus: string;
  totalPrice: number;
  createdAt: string;
  shop: { name: string };
  items: { name: string; quantity: number }[];
};

const STATUS_LABEL: Record<string, string> = {
  pending: "Kutilmoqda",
  paid: "To'landi",
  processing: "Tayyorlanmoqda",
  shipped: "Jo'natildi",
  delivered: "Yetkazildi",
  cancelled: "Bekor qilindi",
};

export default function MyOrdersScreen() {
  const { c } = useTheme();
  const [orders, setOrders] = useState<MyOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const { data: body } = await api.get("/orders/my-orders");
      const payload = body?.data ?? body ?? {};
      setOrders(payload.orders ?? []);
    } catch {
      Alert.alert("Xato", "Buyurtmalarni yuklab bo'lmadi");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <View style={{ backgroundColor: c.bg, paddingHorizontal: 20, paddingTop: 56, paddingBottom: 12 }}>
        <TouchableOpacity onPress={() => router.back()} style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
          <Ionicons name="chevron-back" size={20} color={c.primary} />
          <Text style={{ color: c.primary, fontWeight: "600" }}>Orqaga</Text>
        </TouchableOpacity>
        <Text style={{ color: c.text, fontSize: 28, fontWeight: "800" }}>Buyurtmalarim</Text>
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={c.primary} />
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(o) => o.id}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100, paddingTop: 8 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(true); }} tintColor={c.primary} />}
          ListEmptyComponent={
            <View style={{ alignItems: "center", paddingTop: 80 }}>
              <Ionicons name="receipt-outline" size={48} color={c.border} style={{ marginBottom: 12 }} />
              <Text style={{ color: c.textMuted, fontSize: 16, fontWeight: "600" }}>Hali buyurtma bermagansiz</Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={{ backgroundColor: c.bgCard, borderRadius: 16, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: c.border }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: c.text, fontWeight: "800", fontSize: 15 }}>{item.shop?.name || item.orderNumber}</Text>
                  <Text style={{ color: c.textMuted, fontSize: 12, marginTop: 2 }}>{item.orderNumber}</Text>
                </View>
                <View style={{ backgroundColor: c.primary + "15", borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4 }}>
                  <Text style={{ color: c.primary, fontWeight: "700", fontSize: 11 }}>
                    {STATUS_LABEL[item.orderStatus] || item.orderStatus}
                  </Text>
                </View>
              </View>
              <View style={{ height: 1, backgroundColor: c.border, marginVertical: 10 }} />
              <Text style={{ color: c.textMuted, fontSize: 13 }} numberOfLines={2}>
                {item.items?.map((it) => `${it.name} ×${it.quantity}`).join(", ")}
              </Text>
              <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 8 }}>
                <Text style={{ color: c.textMuted, fontSize: 12 }}>
                  {new Date(item.createdAt).toLocaleDateString("uz")}
                </Text>
                <Text style={{ color: c.primary, fontWeight: "800", fontSize: 15 }}>
                  {item.totalPrice.toLocaleString()} so'm
                </Text>
              </View>
            </View>
          )}
        />
      )}
    </View>
  );
}
