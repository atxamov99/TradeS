import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { api } from "@/services/api";
import { useTheme } from "@/hooks/useTheme";
import { useShopStore } from "@/store/shopStore";

export default function AddShopScreen() {
  const { c } = useTheme();
  const { activeShopId, setActiveShop } = useShopStore();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!name.trim()) {
      Alert.alert("Xato", "Do'kon nomini kiriting");
      return;
    }
    setSaving(true);
    try {
      const { data: body } = await api.post("/shops", { name: name.trim(), description: description.trim() });
      const payload = body?.data ?? body ?? {};
      const shop = payload.shop;
      // Foydalanuvchining birinchi do'koni bo'lsa — avtomatik faollashtiramiz,
      // aks holda mavjud faol do'kon o'zgarishsiz qoladi (Do'konlarim ekranidan tanlanadi).
      if (shop?.id && !activeShopId) {
        await setActiveShop(shop.id);
      }
      router.back();
    } catch (e: any) {
      const code = e.response?.data?.errorCode;
      const message =
        code === "SHOP_LIMIT_REACHED"
          ? e.response?.data?.message
          : e.response?.data?.message || "Do'kon ochishda xatolik";
      Alert.alert("Xato", message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: c.bg }} keyboardShouldPersistTaps="handled">
      <View style={{ backgroundColor: c.bg, paddingHorizontal: 16, paddingTop: 56, paddingBottom: 12 }}>
        <TouchableOpacity onPress={() => router.back()} style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
          <Ionicons name="chevron-back" size={20} color={c.primary} />
          <Text style={{ color: c.primary, fontWeight: "600" }}>Bekor qilish</Text>
        </TouchableOpacity>
        <Text style={{ color: c.text, fontSize: 26, fontWeight: "800" }}>Do'kon ochish</Text>
      </View>

      <View style={{ paddingHorizontal: 16, gap: 14, paddingBottom: 40 }}>
        <View>
          <Text style={{ color: c.primaryDark, fontWeight: "700", marginBottom: 6 }}>Do'kon nomi</Text>
          <TextInput
            style={{ backgroundColor: c.bgCard, borderWidth: 1.5, borderColor: c.border, borderRadius: 14, paddingHorizontal: 14, height: 50, fontSize: 15, color: c.text }}
            value={name}
            onChangeText={setName}
            placeholder="Masalan: Aziz do'koni"
            placeholderTextColor={c.border}
          />
        </View>
        <View>
          <Text style={{ color: c.primaryDark, fontWeight: "700", marginBottom: 6 }}>Tavsif (ixtiyoriy)</Text>
          <TextInput
            style={{ backgroundColor: c.bgCard, borderWidth: 1.5, borderColor: c.border, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, minHeight: 90, fontSize: 15, color: c.text }}
            value={description}
            onChangeText={setDescription}
            placeholder="Do'koningiz haqida qisqacha"
            placeholderTextColor={c.border}
            multiline
            textAlignVertical="top"
          />
        </View>

        <TouchableOpacity
          style={{ backgroundColor: saving ? c.border : c.primary, borderRadius: 16, height: 56, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 8, marginTop: 8, shadowColor: c.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 8, elevation: 5 }}
          onPress={handleSave}
          disabled={saving}
        >
          <Ionicons name="storefront" size={20} color="#fff" />
          <Text style={{ color: "#fff", fontWeight: "800", fontSize: 17 }}>{saving ? "..." : "Do'kon ochish"}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
