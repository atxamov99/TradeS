import { View, Text, ScrollView, TouchableOpacity, Alert, Linking } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useT } from "@/hooks/useT";
import { useTheme } from "@/hooks/useTheme";
import { useSubscriptionStore, Plan } from "@/store/subscriptionStore";
import { api } from "@/services/api";
import { useState } from "react";

type PlanKey = Plan;

interface PlanConfig {
  key: PlanKey;
  price: string;
  accentColor: string;
  recommended?: boolean;
}

const PLANS: PlanConfig[] = [
  { key: "free",   price: "Bepul",  accentColor: "#6b7280" },
  { key: "pro",    price: "24 900", accentColor: "#16a34a", recommended: true },
  { key: "biznes", price: "49 900", accentColor: "#7c3aed" },
];

function openPayme(url: string) {
  Linking.openURL(url).catch(() => {
    Alert.alert("Xatolik", "Payme ilovasi ochilmadi. Brauzer orqali to'lang.");
  });
}

export default function SubscriptionScreen() {
  const t = useT();
  const { c } = useTheme();
  const { plan: currentPlan, upgrade, expiresAt } = useSubscriptionStore();
  const [paying, setPaying] = useState<string | null>(null);

  const featuresMap: Record<PlanKey, string[]> = {
    free:   t.subscription.freeFeatures,
    pro:    t.subscription.proFeatures,
    biznes: t.subscription.biznesFeatures,
  };

  const nameMap: Record<PlanKey, string> = {
    free:   t.subscription.free,
    pro:    t.subscription.pro,
    biznes: t.subscription.biznes,
  };

  async function handlePay(planKey: string) {
    setPaying(planKey);
    try {
      const res = await api.post("/subscriptions/create-payment", { plan: planKey });
      const data = res.data?.data ?? res.data;
      Alert.alert(
        "Payme orqali to'lov",
        `Summa: ${data.amountUzs} so'm\n\nPayme ilovasi ochiladi.`,
        [
          { text: "Bekor qilish", style: "cancel" },
          { text: "To'lash", onPress: () => openPayme(data.paymeUrl) },
        ]
      );
    } catch (e: any) {
      Alert.alert("Xatolik", e?.response?.data?.message || "To'lov yaratilmadi");
    } finally {
      setPaying(null);
    }
  }

  function handleUpgrade(plan: PlanConfig) {
    if (plan.key === "free") return;
    Alert.alert(
      plan.key.toUpperCase(),
      `Payme orqali to'lang (${plan.price} so'm/oy) yoki demo sinab ko'ring.`,
      [
        { text: "Bekor qilish", style: "cancel" },
        { text: "Payme", onPress: () => handlePay(plan.key) },
        {
          text: "Demo (30 kun)",
          onPress: () => {
            upgrade(plan.key, 30);
            Alert.alert("Aktiv", `${plan.key.toUpperCase()} 30 kunga yoqildi (demo)`);
          },
        },
      ]
    );
  }

  const expiryText = expiresAt ? new Date(expiresAt).toLocaleDateString("uz-UZ") : null;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: c.bg }} showsVerticalScrollIndicator={false}>

      {/* Header */}
      <View style={{ backgroundColor: c.bg, paddingHorizontal: 16, paddingTop: 56, paddingBottom: 8, flexDirection: "row", alignItems: "center" }}>
        <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 12, padding: 4 }}>
          <Ionicons name="chevron-back" size={24} color={c.primary} />
        </TouchableOpacity>
        <Text style={{ fontSize: 22, fontWeight: "800", color: c.text }}>{t.subscription.title}</Text>
      </View>

      {/* Hero */}
      <View style={{ backgroundColor: c.primary, marginHorizontal: 16, borderRadius: 22, padding: 22, marginBottom: 20, marginTop: 8 }}>
        <Ionicons name="rocket" size={32} color="rgba(255,255,255,0.85)" style={{ marginBottom: 10 }} />
        <Text style={{ color: "#fff", fontSize: 20, fontWeight: "800", marginBottom: 4 }}>
          Biznesingizni o'stiring
        </Text>
        <Text style={{ color: "rgba(255,255,255,0.75)", fontSize: 14, lineHeight: 20 }}>
          Hisob-kitob, hisobot va barcha imkoniyatlar — bir joyda
        </Text>

        <View style={{ flexDirection: "row", alignItems: "center", marginTop: 14, backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 7, alignSelf: "flex-start", gap: 6 }}>
          <Ionicons name="checkmark-circle" size={14} color="#fff" />
          <Text style={{ color: "#fff", fontWeight: "700", fontSize: 13 }}>
            {t.subscription.current}: {nameMap[currentPlan]}
            {expiryText ? `  ·  ${expiryText} gacha` : ""}
          </Text>
        </View>
      </View>

      {/* Plan cards */}
      <View style={{ paddingHorizontal: 16, gap: 14, paddingBottom: 40 }}>
        {PLANS.map((plan) => {
          const isActive = plan.key === currentPlan;
          const features = featuresMap[plan.key];

          return (
            <View
              key={plan.key}
              style={{
                backgroundColor: c.bgCard,
                borderRadius: 22,
                borderWidth: isActive ? 2 : 1.5,
                borderColor: isActive ? plan.accentColor : c.border,
                overflow: "hidden",
              }}
            >
              <View style={{ height: 5, backgroundColor: plan.accentColor }} />

              <View style={{ padding: 20 }}>
                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                    <View style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: plan.accentColor + "20", alignItems: "center", justifyContent: "center" }}>
                      <Ionicons
                        name={plan.key === "free" ? "leaf" : plan.key === "pro" ? "star" : "diamond"}
                        size={18}
                        color={plan.accentColor}
                      />
                    </View>
                    <View>
                      <Text style={{ color: c.text, fontSize: 18, fontWeight: "800" }}>{nameMap[plan.key]}</Text>
                      <Text style={{ color: plan.accentColor, fontSize: 14, fontWeight: "700" }}>
                        {plan.key === "free" ? plan.price : `${plan.price} so'm/${t.subscription.perMonth}`}
                      </Text>
                    </View>
                  </View>

                  {isActive && (
                    <View style={{ backgroundColor: plan.accentColor, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12 }}>
                      <Text style={{ color: "#fff", fontSize: 11, fontWeight: "800" }}>{t.subscription.active}</Text>
                    </View>
                  )}
                  {plan.recommended && !isActive && (
                    <View style={{ backgroundColor: plan.accentColor + "20", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12, borderWidth: 1, borderColor: plan.accentColor + "40" }}>
                      <Text style={{ color: plan.accentColor, fontSize: 11, fontWeight: "800" }}>TAVSIYA</Text>
                    </View>
                  )}
                </View>

                <View style={{ gap: 9, marginBottom: isActive || plan.key === "free" ? 0 : 16 }}>
                  {features.map((feature) => (
                    <View key={feature} style={{ flexDirection: "row", alignItems: "flex-start", gap: 8 }}>
                      <View style={{ marginTop: 2, width: 16, height: 16, borderRadius: 8, backgroundColor: plan.accentColor + "20", alignItems: "center", justifyContent: "center" }}>
                        <Ionicons name="checkmark" size={11} color={plan.accentColor} />
                      </View>
                      <Text style={{ color: c.textSub, fontSize: 13, flex: 1, lineHeight: 19 }}>{feature}</Text>
                    </View>
                  ))}
                </View>

                {!isActive && plan.key !== "free" && (
                  <TouchableOpacity
                    style={{
                      backgroundColor: plan.accentColor,
                      borderRadius: 14,
                      height: 50,
                      alignItems: "center",
                      justifyContent: "center",
                      flexDirection: "row",
                      gap: 8,
                      shadowColor: plan.accentColor,
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: 0.3,
                      shadowRadius: 8,
                      elevation: 4,
                      opacity: paying === plan.key ? 0.6 : 1,
                    }}
                    onPress={() => handleUpgrade(plan)}
                  >
                    <Ionicons name="card" size={18} color="#fff" />
                    <Text style={{ color: "#fff", fontWeight: "800", fontSize: 15 }}>
                      {paying === plan.key ? "..." : t.subscription.upgrade}
                    </Text>
                  </TouchableOpacity>
                )}

                {plan.key === "free" && !isActive && (
                  <TouchableOpacity
                    style={{ borderRadius: 14, height: 44, alignItems: "center", justifyContent: "center", borderWidth: 1.5, borderColor: c.border }}
                    onPress={() => { upgrade("free", 0); }}
                  >
                    <Text style={{ color: c.textMuted, fontWeight: "700", fontSize: 14 }}>Bepulga o'tish</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          );
        })}

        <View style={{ backgroundColor: c.bgCard, borderWidth: 1, borderColor: c.border, borderRadius: 14, padding: 14, flexDirection: "row", alignItems: "flex-start", gap: 10 }}>
          <Ionicons name="information-circle" size={18} color={c.textMuted} style={{ marginTop: 1 }} />
          <Text style={{ color: c.textMuted, fontSize: 13, flex: 1, lineHeight: 19 }}>
            Payme orqali to'lang yoki 30 kun demo sinab ko'ring
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}
