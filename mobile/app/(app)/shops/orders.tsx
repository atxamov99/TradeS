import { useCallback, useState } from "react";
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl, Alert } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { api } from "@/services/api";
import { useTheme } from "@/hooks/useTheme";
import { useShopStore } from "@/store/shopStore";

type IncomingOrder = {
  id: string;
  orderNumber: string;
  orderStatus: string;
  totalPrice: number;
  createdAt: string;
  items: { name: string; quantity: number }[];
  user: { name: string | null; phone: string | null };
};

const STATUS_LABEL: Record<string, string> = {
  pending: "Kutilmoqda",
  paid: "To'landi",
  processing: "Tayyorlanmoqda",
  shipped: "Jo'natildi",
  delivered: "Yetkazildi",
  cancelled: "Bekor qilindi",
};

const STATUS_ACTIONS: Record<string, { next: string; label: string; danger?: boolean }[]> = {
  pending: [
    { next: "processing", label: "Qabul qilish" },
    { next: "cancelled", label: "Bekor qilish", danger: true },
  ],
  processing: [{ next: "shipped", label: "Jo'natish" }],
  shipped: [{ next: "delivered", label: "Yetkazildi deb belgilash" }],
};

export default function IncomingOrdersScreen() {
  const { c } = useTheme();
  const activeShopId = useShopStore((s) => s.activeShopId);
  const [orders, setOrders] = useState<IncomingOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const load = useCallback(async (silent = false) => {
    if (!activeShopId) {
      setOrders([]);
      setLoading(false);
      return;
    }
    if (!silent) setLoading(true);
    try {
      const { data: body } = await api.get(`/shops/${activeShopId}/orders`);
      const payload = body?.data ?? body ?? {};
      setOrders(payload.orders ?? []);
    } catch {
      Alert.alert("Xato", "Buyurtmalarni yuklab bo'lmadi");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeShopId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  async function updateStatus(orderId: string, orderStatus: string) {
    if (!activeShopId) return;
    setUpdatingId(orderId);
    try {
      await api.patch(`/shops/${activeShopId}/orders/${orderId}/status`, { orderStatus });
      setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, orderStatus } : o)));
    } catch (e: any) {
      Alert.alert("Xato", e.response?.data?.message || "Statusni yangilab bo'lmadi");
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <View style={{ backgroundColor: c.bg, paddingHorizontal: 20, paddingTop: 56, paddingBottom: 12 }}>
        <TouchableOpacity onPress={() => router.back()} style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
          <Ionicons name="chevron-back" size={20} color={c.primary} />
          <Text style={{ color: c.primary, fontWeight: "600" }}>Orqaga</Text>
        </TouchableOpacity>
        <Text style={{ color: c.text, fontSize: 28, fontWeight: "800" }}>Kelgan buyurtmalar</Text>
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
              <Text style={{ color: c.textMuted, fontSize: 16, fontWeight: "600" }}>Hali buyurtma yo'q</Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={{ backgroundColor: c.bgCard, borderRadius: 16, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: c.border }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: c.text, fontWeight: "800", fontSize: 15 }}>{item.orderNumber}</Text>
                  <Text style={{ color: c.textMuted, fontSize: 12, marginTop: 2 }}>
                    {item.user?.name || item.user?.phone || "Xaridor"}
                  </Text>
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

              {!!STATUS_ACTIONS[item.orderStatus]?.length && (
                <View style={{ flexDirection: "row", gap: 8, marginTop: 12 }}>
                  {STATUS_ACTIONS[item.orderStatus].map((action) => (
                    <TouchableOpacity
                      key={action.next}
                      onPress={() => updateStatus(item.id, action.next)}
                      disabled={updatingId === item.id}
                      style={{
                        flex: 1,
                        borderRadius: 12,
                        paddingVertical: 10,
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor: action.danger ? c.danger + "15" : c.primary,
                        opacity: updatingId === item.id ? 0.6 : 1,
                      }}
                    >
                      {updatingId === item.id ? (
                        <ActivityIndicator size="small" color={action.danger ? c.danger : "#fff"} />
                      ) : (
                        <Text style={{ color: action.danger ? c.danger : "#fff", fontWeight: "700", fontSize: 13 }}>
                          {action.label}
                        </Text>
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          )}
        />
      )}
    </View>
  );
}
