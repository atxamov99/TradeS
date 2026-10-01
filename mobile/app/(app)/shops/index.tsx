import { useCallback, useState } from "react";
import { View, Text, FlatList, TouchableOpacity, Alert, ActivityIndicator, RefreshControl } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { api } from "@/services/api";
import { useTheme } from "@/hooks/useTheme";
import { useShopStore } from "@/store/shopStore";

type ShopRow = {
  id: string;
  name: string;
  description: string;
  isBlocked: boolean;
  _count?: { products: number };
};

export default function ShopsScreen() {
  const { c } = useTheme();
  const { activeShopId, setActiveShop } = useShopStore();
  const [shops, setShops] = useState<ShopRow[]>([]);
  const [max, setMax] = useState(10);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const { data: body } = await api.get("/shops/mine");
      const payload = body?.data ?? body ?? {};
      setShops(payload.shops ?? []);
      setMax(payload.max ?? 10);
    } catch {
      Alert.alert("Xato", "Do'konlar ro'yxatini yuklab bo'lmadi");
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

  function handleSwitch(shop: ShopRow) {
    if (shop.id === activeShopId) return;
    if (shop.isBlocked) {
      Alert.alert("Do'kon bloklangan", "Bu do'kon admin tomonidan bloklangan.");
      return;
    }
    Alert.alert("Do'konni almashtirish", `"${shop.name}" faol do'kon qilinsinmi?`, [
      { text: "Bekor qilish", style: "cancel" },
      { text: "Ha", onPress: () => setActiveShop(shop.id) },
    ]);
  }

  const atLimit = shops.length >= max;

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <View style={{ backgroundColor: c.bg, paddingHorizontal: 20, paddingTop: 56, paddingBottom: 12 }}>
        <TouchableOpacity onPress={() => router.back()} style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
          <Ionicons name="chevron-back" size={20} color={c.primary} />
          <Text style={{ color: c.primary, fontWeight: "600" }}>Orqaga</Text>
        </TouchableOpacity>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <Text style={{ color: c.text, fontSize: 28, fontWeight: "800" }}>Do'konlarim</Text>
          <Text style={{ color: atLimit ? c.danger : c.textMuted, fontSize: 12, fontWeight: "600" }}>
            {shops.length}/{max}
          </Text>
        </View>

        {activeShopId && (
          <TouchableOpacity
            onPress={() => router.push("/shops/orders")}
            style={{ flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: c.bgCard, borderRadius: 14, padding: 14, marginTop: 12, borderWidth: 1, borderColor: c.border }}
          >
            <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: c.primary + "18", alignItems: "center", justifyContent: "center" }}>
              <Ionicons name="receipt-outline" size={18} color={c.primary} />
            </View>
            <Text style={{ color: c.text, fontWeight: "700", fontSize: 13, flex: 1 }}>Kelgan buyurtmalar</Text>
            <Ionicons name="chevron-forward" size={16} color={c.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={c.primary} />
      ) : (
        <FlatList
          data={shops}
          keyExtractor={(s) => s.id}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100, paddingTop: 8 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(true); }} tintColor={c.primary} />}
          ListEmptyComponent={
            <View style={{ alignItems: "center", paddingTop: 60 }}>
              <Ionicons name="storefront-outline" size={52} color={c.border} style={{ marginBottom: 12 }} />
              <Text style={{ color: c.textMuted, fontSize: 16, fontWeight: "600" }}>Hali do'koningiz yo'q</Text>
              <Text style={{ color: c.textMuted, fontSize: 13, marginTop: 4 }}>Birinchi do'koningizni oching</Text>
            </View>
          }
          renderItem={({ item }) => {
            const isActive = item.id === activeShopId;
            return (
              <TouchableOpacity
                onPress={() => handleSwitch(item)}
                style={{
                  backgroundColor: c.bgCard, borderRadius: 18, padding: 16, marginBottom: 10,
                  borderWidth: isActive ? 2 : 1, borderColor: isActive ? c.primary : c.border, opacity: item.isBlocked ? 0.6 : 1,
                }}
              >
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <View style={{ flex: 1, marginRight: 8 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                      <Text style={{ color: c.text, fontWeight: "800", fontSize: 16 }}>{item.name}</Text>
                      {isActive && (
                        <View style={{ backgroundColor: c.primary + "20", borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2 }}>
                          <Text style={{ color: c.primary, fontSize: 10, fontWeight: "800" }}>FAOL</Text>
                        </View>
                      )}
                      {item.isBlocked && (
                        <View style={{ backgroundColor: c.danger + "20", borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2 }}>
                          <Text style={{ color: c.danger, fontSize: 10, fontWeight: "800" }}>BLOKLANGAN</Text>
                        </View>
                      )}
                    </View>
                    {!!item.description && (
                      <Text style={{ color: c.textMuted, fontSize: 13, marginTop: 4 }} numberOfLines={2}>
                        {item.description}
                      </Text>
                    )}
                    <Text style={{ color: c.textMuted, fontSize: 12, marginTop: 6 }}>
                      {item._count?.products ?? 0} ta tovar
                    </Text>
                  </View>
                  {!isActive && !item.isBlocked && <Ionicons name="swap-horizontal" size={20} color={c.textMuted} />}
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}

      <TouchableOpacity
        onPress={() => {
          if (atLimit) {
            Alert.alert("Limitga yetdingiz", `Bitta hisobda ko'pi bilan ${max} ta do'kon bo'lishi mumkin.`);
            return;
          }
          router.push("/shops/add");
        }}
        style={{
          position: "absolute", bottom: 28, right: 20, backgroundColor: atLimit ? c.border : c.primary,
          width: 58, height: 58, borderRadius: 29, alignItems: "center", justifyContent: "center",
          shadowColor: c.primary, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 10, elevation: 8, zIndex: 10,
        }}
      >
        <Ionicons name="add" size={30} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}
