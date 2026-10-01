import { useEffect, useState } from "react";
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { api } from "@/services/api";
import { useTheme } from "@/hooks/useTheme";

type CartItem = { productId: string; quantity: number; price: number; product?: { name: string } };

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

export default function CheckoutScreen() {
  const { c } = useTheme();
  const [items, setItems] = useState<CartItem[]>([]);
  const [totalPrice, setTotalPrice] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [street, setStreet] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [country, setCountry] = useState("O'zbekiston");
  const [zipCode, setZipCode] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    (async () => {
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
    })();
  }, []);

  async function handleSubmit() {
    if (items.length === 0) {
      Alert.alert("Xato", "Savat bo'sh");
      return;
    }
    if (!street.trim() || !city.trim() || !state.trim() || !country.trim() || !zipCode.trim()) {
      Alert.alert("Xato", "Yetkazib berish manzilini to'liq kiriting");
      return;
    }
    setSubmitting(true);
    try {
      const { data: body } = await api.post("/orders", {
        items: items.map((i) => ({ product: i.productId, quantity: i.quantity })),
        shippingAddress: { street: street.trim(), city: city.trim(), state: state.trim(), country: country.trim(), zipCode: zipCode.trim() },
        paymentMethod: "cash_on_delivery",
        notes: notes.trim(),
      });
      const payload = body?.data ?? body ?? {};
      const orders = payload.orders ?? [];
      Alert.alert(
        "Tayyor!",
        orders.length > 1
          ? `${orders.length} ta buyurtma yaratildi (har do'kon uchun alohida)`
          : "Buyurtma yaratildi",
        [{ text: "OK", onPress: () => router.replace("/marketplace/orders") }]
      );
    } catch (e: any) {
      Alert.alert("Xato", e.response?.data?.message || "Buyurtma berishda xatolik");
    } finally {
      setSubmitting(false);
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
    <ScrollView style={{ flex: 1, backgroundColor: c.bg }} keyboardShouldPersistTaps="handled">
      <View style={{ backgroundColor: c.bg, paddingHorizontal: 16, paddingTop: 56, paddingBottom: 12 }}>
        <TouchableOpacity onPress={() => router.back()} style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
          <Ionicons name="chevron-back" size={20} color={c.primary} />
          <Text style={{ color: c.primary, fontWeight: "600" }}>Orqaga</Text>
        </TouchableOpacity>
        <Text style={{ color: c.text, fontSize: 26, fontWeight: "800" }}>Yetkazib berish</Text>
      </View>

      <View style={{ paddingHorizontal: 16, gap: 14, paddingBottom: 40 }}>
        <View style={{ backgroundColor: c.bgMuted, borderRadius: 14, padding: 14, flexDirection: "row", justifyContent: "space-between" }}>
          <Text style={{ color: c.textSub, fontWeight: "600" }}>{items.length} xil tovar</Text>
          <Text style={{ color: c.text, fontWeight: "800" }}>{totalPrice.toLocaleString()} so'm</Text>
        </View>

        <Field label="Ko'cha, uy" value={street} onChangeText={setStreet} placeholder="Ko'cha nomi, uy raqami" c={c} />
        <Field label="Shahar" value={city} onChangeText={setCity} placeholder="Shahar" c={c} />
        <Field label="Viloyat" value={state} onChangeText={setState} placeholder="Viloyat" c={c} />
        <Field label="Davlat" value={country} onChangeText={setCountry} placeholder="Davlat" c={c} />
        <Field label="Pochta indeksi" value={zipCode} onChangeText={setZipCode} placeholder="100000" keyboardType="numeric" c={c} />
        <Field label="Izoh (ixtiyoriy)" value={notes} onChangeText={setNotes} placeholder="Qo'shimcha izoh" c={c} />

        <TouchableOpacity
          style={{ backgroundColor: submitting ? c.border : c.primary, borderRadius: 16, height: 56, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 8, marginTop: 8 }}
          onPress={handleSubmit}
          disabled={submitting}
        >
          {submitting ? <Text style={{ color: "#fff", fontWeight: "800", fontSize: 17 }}>...</Text> : (
            <>
              <Ionicons name="checkmark-circle" size={20} color="#fff" />
              <Text style={{ color: "#fff", fontWeight: "800", fontSize: 17 }}>Buyurtmani tasdiqlash</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
