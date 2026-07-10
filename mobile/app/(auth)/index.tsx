import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/hooks/useTheme";

const FEATURES = [
  { icon: "phone-portrait-outline", title: "Oflayn ishlaydi", desc: "Internet bo'lmasa ham barcha ma'lumotlar saqlanadi" },
  { icon: "barcode-outline", title: "Barcode skanerlash", desc: "Tovarlarni tez topish va sotuv yozish" },
  { icon: "bar-chart-outline", title: "Batafsil hisobotlar", desc: "Kunlik, haftalik va oylik statistika" },
  { icon: "people-outline", title: "Xodimlar boshqaruvi", desc: "Admin va kassir rollari bilan ishlash" },
];

const PLANS = [
  {
    name: "FREE", price: "Bepul", color: "#2D8B35", highlight: false,
    features: ["30 ta tovar", "Kunlik hisobot", "Oflayn rejim", "1 qurilma"],
  },
  {
    name: "PRO", price: "29,900 so'm/oy", color: "#7C3AED", highlight: true,
    features: ["250 ta tovar", "Narx tarixi", "Excel eksport", "Push xabarlar"],
  },
  {
    name: "BIZNES", price: "49,900 so'm/oy", color: "#D97706", highlight: false,
    features: ["Cheksiz tovar", "API kirish", "Audit jurnali", "Ko'p foydalanuvchi"],
  },
];

const STEPS = [
  { n: "1", title: "Ro'yxatdan o'ting", desc: "1 daqiqada hisob yarating" },
  { n: "2", title: "Tovar qo'shing", desc: "Mahsulotlar va narxlarni kiriting" },
  { n: "3", title: "Savdo qiling", desc: "Har bir savdoni qayd eting" },
  { n: "4", title: "Hisobot ko'ring", desc: "Foyda va statistikani tahlil qiling" },
];

export default function LandingScreen() {
  const { c } = useTheme();

  return (
    <ScrollView style={{ flex: 1, backgroundColor: c.bg }} showsVerticalScrollIndicator={false}>

      {/* Hero */}
      <View style={{
        backgroundColor: c.primary,
        paddingHorizontal: 24, paddingTop: 70, paddingBottom: 44,
        borderBottomLeftRadius: 36, borderBottomRightRadius: 36,
      }}>
        <View style={{ alignItems: "center" }}>
          <View style={{ width: 80, height: 80, backgroundColor: "rgba(255,255,255,0.18)", borderRadius: 24, alignItems: "center", justifyContent: "center", marginBottom: 18 }}>
            <Ionicons name="storefront" size={42} color="#fff" />
          </View>
          <Text style={{ color: "#fff", fontSize: 36, fontWeight: "900", letterSpacing: -1.5 }}>Savdo</Text>
          <Text style={{ color: "rgba(255,255,255,0.8)", fontSize: 15, marginTop: 8, textAlign: "center", lineHeight: 22 }}>
            Savdogar uchun aqlli{"\n"}boshqaruv tizimi
          </Text>
        </View>

        <View style={{ flexDirection: "row", gap: 10, marginTop: 32 }}>
          <TouchableOpacity
            onPress={() => router.push("/login")}
            style={{ flex: 1, backgroundColor: "#fff", borderRadius: 16, height: 54, alignItems: "center", justifyContent: "center" }}
          >
            <Text style={{ color: c.primary, fontWeight: "800", fontSize: 16 }}>Kirish</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.push("/register")}
            style={{ flex: 1, backgroundColor: "rgba(255,255,255,0.15)", borderRadius: 16, height: 54, alignItems: "center", justifyContent: "center", borderWidth: 1.5, borderColor: "rgba(255,255,255,0.35)" }}
          >
            <Text style={{ color: "#fff", fontWeight: "800", fontSize: 16 }}>Ro'yxat</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Stats */}
      <View style={{ flexDirection: "row", paddingHorizontal: 20, marginTop: 24, gap: 10 }}>
        {[
          { value: "500+", label: "Foydalanuvchi" },
          { value: "50K+", label: "Sotuv yozilgan" },
          { value: "4.9★", label: "Reyting" },
        ].map((s) => (
          <View key={s.label} style={{ flex: 1, backgroundColor: c.bgCard, borderRadius: 16, padding: 14, alignItems: "center", borderWidth: 1, borderColor: c.border }}>
            <Text style={{ color: c.primary, fontSize: 18, fontWeight: "900" }}>{s.value}</Text>
            <Text style={{ color: c.textMuted, fontSize: 10, fontWeight: "600", marginTop: 3, textAlign: "center" }}>{s.label}</Text>
          </View>
        ))}
      </View>

      {/* Features */}
      <View style={{ paddingHorizontal: 20, marginTop: 28 }}>
        <Text style={{ color: c.text, fontSize: 20, fontWeight: "800", marginBottom: 14 }}>Imkoniyatlar</Text>
        <View style={{ gap: 10 }}>
          {FEATURES.map((f) => (
            <View key={f.icon} style={{ backgroundColor: c.bgCard, borderRadius: 16, padding: 16, flexDirection: "row", alignItems: "center", gap: 14, borderWidth: 1, borderColor: c.border }}>
              <View style={{ width: 46, height: 46, backgroundColor: c.primary + "18", borderRadius: 14, alignItems: "center", justifyContent: "center" }}>
                <Ionicons name={f.icon as any} size={22} color={c.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: c.text, fontWeight: "700", fontSize: 14 }}>{f.title}</Text>
                <Text style={{ color: c.textMuted, fontSize: 12, marginTop: 3, lineHeight: 17 }}>{f.desc}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* Pricing */}
      <View style={{ paddingHorizontal: 20, marginTop: 28, marginBottom: 50 }}>
        <Text style={{ color: c.text, fontSize: 20, fontWeight: "800", marginBottom: 14 }}>Tarif rejalari</Text>
        <View style={{ gap: 12 }}>
          {PLANS.map((plan) => (
            <View key={plan.name} style={{
              backgroundColor: plan.highlight ? plan.color : c.bgCard,
              borderRadius: 20, padding: 20,
              borderWidth: plan.highlight ? 0 : 1.5,
              borderColor: plan.highlight ? "transparent" : c.border,
            }}>
              {plan.highlight && (
                <View style={{ position: "absolute", top: 14, right: 18, backgroundColor: "#FDE68A", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 }}>
                  <Text style={{ color: "#92400E", fontWeight: "800", fontSize: 11 }}>MASHHUR</Text>
                </View>
              )}
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                <Text style={{ color: plan.highlight ? "#fff" : plan.color, fontWeight: "900", fontSize: 20 }}>{plan.name}</Text>
                <Text style={{ color: plan.highlight ? "rgba(255,255,255,0.85)" : c.text, fontWeight: "700", fontSize: 13 }}>{plan.price}</Text>
              </View>
              {plan.features.map((feat) => (
                <View key={feat} style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 7 }}>
                  <Ionicons name="checkmark-circle" size={16} color={plan.highlight ? "rgba(255,255,255,0.85)" : plan.color} />
                  <Text style={{ color: plan.highlight ? "rgba(255,255,255,0.9)" : c.textSub, fontSize: 13, fontWeight: "600" }}>{feat}</Text>
                </View>
              ))}
            </View>
          ))}
        </View>

        <TouchableOpacity
          onPress={() => router.push("/register")}
          style={{ backgroundColor: c.primary, borderRadius: 18, height: 56, alignItems: "center", justifyContent: "center", marginTop: 24, shadowColor: c.primary, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.35, shadowRadius: 10, elevation: 8 }}
        >
          <Text style={{ color: "#fff", fontWeight: "800", fontSize: 17 }}>Bepul boshlash</Text>
        </TouchableOpacity>
      </View>

      {/* How it works */}
      <View style={{ paddingHorizontal: 20, marginTop: 12, marginBottom: 8 }}>
        <Text style={{ color: c.text, fontSize: 20, fontWeight: "800", marginBottom: 14, textAlign: "center" }}>
          Qanday ishlaydi?
        </Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
          {STEPS.map((step) => (
            <View
              key={step.n}
              style={{ width: "47%", backgroundColor: c.bgCard, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: c.border, alignItems: "center" }}
            >
              <View style={{ width: 42, height: 42, backgroundColor: c.primary, borderRadius: 21, alignItems: "center", justifyContent: "center", marginBottom: 10 }}>
                <Text style={{ color: "#fff", fontWeight: "800", fontSize: 18 }}>{step.n}</Text>
              </View>
              <Text style={{ color: c.text, fontWeight: "700", fontSize: 13, textAlign: "center", marginBottom: 4 }}>{step.title}</Text>
              <Text style={{ color: c.textMuted, fontSize: 11, textAlign: "center", lineHeight: 16 }}>{step.desc}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* CTA */}
      <View style={{ marginHorizontal: 20, marginTop: 16, marginBottom: 16, backgroundColor: c.primary, borderRadius: 24, padding: 28, alignItems: "center" }}>
        <Text style={{ color: "#fff", fontSize: 22, fontWeight: "900", letterSpacing: -0.5, textAlign: "center", marginBottom: 8 }}>
          Hoziroq boshlang
        </Text>
        <Text style={{ color: "rgba(255,255,255,0.8)", fontSize: 13, textAlign: "center", lineHeight: 19, marginBottom: 20 }}>
          Karta kerak emas. Bepul rejim bilan ishlang va biznesingizni o'stiring.
        </Text>
        <TouchableOpacity
          onPress={() => router.push("/register")}
          style={{ backgroundColor: "#fff", borderRadius: 14, paddingHorizontal: 32, height: 52, alignItems: "center", justifyContent: "center" }}
        >
          <Text style={{ color: c.primary, fontWeight: "800", fontSize: 16 }}>Bepul ro'yxatdan o'tish</Text>
        </TouchableOpacity>
      </View>

      {/* Footer */}
      <View style={{ paddingBottom: 40, alignItems: "center" }}>
        <Text style={{ color: c.primary, fontWeight: "900", fontSize: 16, letterSpacing: -0.5 }}>SAVDO</Text>
        <Text style={{ color: c.textMuted, fontSize: 12, marginTop: 4 }}>Business Manager · © 2024</Text>
      </View>
    </ScrollView>
  );
}
