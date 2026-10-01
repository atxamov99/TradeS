import { useCallback, useState } from "react";
import { View, Text, FlatList, TouchableOpacity, TextInput, ActivityIndicator, RefreshControl } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { api } from "@/services/api";
import { useTheme } from "@/hooks/useTheme";

type MarketShop = {
  id: string;
  name: string;
  description: string;
  owner: { name: string | null };
  _count?: { products: number };
};

export default function MarketplaceScreen() {
  const { c } = useTheme();
  const [search, setSearch] = useState("");
  const [shops, setShops] = useState<MarketShop[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const { data: body } = await api.get("/shops", { params: search ? { search } : undefined });
      const payload = body?.data ?? body ?? {};
      setShops(payload.shops ?? []);
    } catch {
      // jim — RefreshControl/loading holati ko'rinishi yetarli
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [search]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <View style={{ backgroundColor: c.bg, paddingHorizontal: 20, paddingTop: 56, paddingBottom: 8 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <Text style={{ color: c.text, fontSize: 28, fontWeight: "800" }}>Bozor</Text>
          <TouchableOpacity
            onPress={() => router.push("/marketplace/orders")}
            style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: c.bgCard, borderWidth: 1, borderColor: c.border, alignItems: "center", justifyContent: "center" }}
          >
            <Ionicons name="receipt-outline" size={18} color={c.text} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.push("/marketplace/cart")}
            style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: c.bgCard, borderWidth: 1, borderColor: c.border, alignItems: "center", justifyContent: "center", marginLeft: 8 }}
          >
            <Ionicons name="cart-outline" size={18} color={c.text} />
          </TouchableOpacity>
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: c.bgCard, borderRadius: 14, paddingHorizontal: 14, borderWidth: 1, borderColor: c.border }}>
          <Ionicons name="search" size={17} color={c.textMuted} />
          <TextInput
            style={{ flex: 1, height: 46, marginLeft: 10, fontSize: 15, color: c.text }}
            placeholder="Do'kon qidirish"
            placeholderTextColor={c.textMuted}
            value={search}
            onChangeText={setSearch}
            onSubmitEditing={() => load()}
          />
        </View>
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
            <View style={{ alignItems: "center", paddingTop: 80 }}>
              <Ionicons name="storefront-outline" size={52} color={c.border} style={{ marginBottom: 12 }} />
              <Text style={{ color: c.textMuted, fontSize: 16, fontWeight: "600" }}>Hozircha do'konlar yo'q</Text>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => router.push(`/marketplace/shop/${item.id}`)}
              style={{ backgroundColor: c.bgCard, borderRadius: 18, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: c.border, flexDirection: "row", alignItems: "center", gap: 12 }}
            >
              <View style={{ width: 46, height: 46, borderRadius: 14, backgroundColor: c.primary + "15", alignItems: "center", justifyContent: "center" }}>
                <Ionicons name="storefront" size={22} color={c.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: c.text, fontWeight: "800", fontSize: 16 }}>{item.name}</Text>
                <Text style={{ color: c.textMuted, fontSize: 12, marginTop: 2 }}>
                  {item._count?.products ?? 0} ta tovar · {item.owner?.name || "Sotuvchi"}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={c.textMuted} />
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}
