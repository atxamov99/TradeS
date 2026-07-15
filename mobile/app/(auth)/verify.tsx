import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { api } from "@/services/api";
import { useAuthStore } from "@/store/authStore";
import { useT } from "@/hooks/useT";
import { useTheme } from "@/hooks/useTheme";

const DEMO_CODE = "000000";

export default function VerifyScreen() {
  const { phone } = useLocalSearchParams<{ phone: string }>();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const setToken = useAuthStore((s) => s.setToken);
  const t = useT();
  const { c } = useTheme();

  async function handleVerify() {
    if (code.length !== 6) return;
    // Demo bypass faqat lokal dev build'da ishlaydi — production'da OTP tekshiruvidan
    // qochib bo'lmasin (audit: CRITICAL#3, demo OTP backdoor).
    if (__DEV__ && code === DEMO_CODE) {
      await setToken("demo-token", "demo-refresh");
      return;
    }
    setLoading(true);
    try {
      const res = await api.post("/auth/verify-otp", {
        phone: `+998${phone}`,
        code,
      });
      const data = res.data?.data ?? res.data;
      await setToken(data.accessToken, data.refreshToken);
    } catch {
      Alert.alert(t.common.error, t.auth.wrongCode);
    } finally {
      setLoading(false);
    }
  }

  async function enterDemo() {
    await setToken("demo-token", "demo-refresh");
  }

  return (
    <View style={{ flex: 1, justifyContent: "flex-end", backgroundColor: c.primary }}>
      {/* Top */}
      <View style={{ flex: 1, paddingHorizontal: 24, paddingTop: 56, justifyContent: "center", alignItems: "center" }}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={{ position: "absolute", top: 56, left: 24, flexDirection: "row", alignItems: "center", gap: 4 }}
        >
          <Ionicons name="chevron-back" size={20} color={c.bg} />
          <Text style={{ color: c.bg, fontWeight: "600" }}>{t.auth.back}</Text>
        </TouchableOpacity>

        <View style={{ width: 80, height: 80, backgroundColor: c.bg, borderRadius: 40, alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
          <Ionicons name="phone-portrait" size={40} color={c.primary} />
        </View>
        <Text style={{ color: "#fff", fontSize: 22, fontWeight: "800", textAlign: "center" }}>{t.auth.smsCode}</Text>
        <Text style={{ color: c.bgMuted, fontSize: 14, marginTop: 6, textAlign: "center" }}>
          +998{phone} {t.auth.codeSent}
        </Text>
      </View>

      {/* Bottom card */}
      <View style={{ backgroundColor: c.bg, borderTopLeftRadius: 32, borderTopRightRadius: 32, paddingHorizontal: 24, paddingTop: 28, paddingBottom: 40 }}>
        <TextInput
          style={{
            backgroundColor: c.bgCard,
            borderWidth: 2,
            borderColor: c.border,
            borderRadius: 16,
            height: 68,
            fontSize: 36,
            textAlign: "center",
            letterSpacing: 12,
            fontWeight: "800",
            color: c.text,
            marginBottom: 16,
          }}
          placeholder="------"
          placeholderTextColor={c.border}
          keyboardType="number-pad"
          maxLength={6}
          value={code}
          onChangeText={setCode}
          autoFocus
        />

        <TouchableOpacity
          style={{
            backgroundColor: code.length === 6 ? c.primary : c.bgMuted,
            borderRadius: 16,
            height: 56,
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "row",
            gap: 8,
            marginBottom: 20,
          }}
          onPress={handleVerify}
          disabled={loading || code.length !== 6}
        >
          <Ionicons name={loading ? "hourglass" : "checkmark-circle"} size={20} color="#fff" />
          <Text style={{ color: "#fff", fontWeight: "800", fontSize: 17 }}>
            {loading ? t.auth.checking : t.auth.enter}
          </Text>
        </TouchableOpacity>

        {/* Demo kirish — faqat dev build'da (production'da ko'rinmaydi) */}
        {__DEV__ && (
          <>
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 16 }}>
              <View style={{ flex: 1, height: 1, backgroundColor: c.border }} />
              <Text style={{ color: c.textMuted, marginHorizontal: 12, fontSize: 13 }}>{t.auth.or}</Text>
              <View style={{ flex: 1, height: 1, backgroundColor: c.border }} />
            </View>

            <TouchableOpacity
              style={{
                backgroundColor: c.bgCard,
                borderRadius: 16,
                height: 52,
                alignItems: "center",
                justifyContent: "center",
                flexDirection: "row",
                gap: 8,
                borderWidth: 1.5,
                borderColor: c.border,
              }}
              onPress={enterDemo}
            >
              <Ionicons name="rocket" size={18} color={c.primaryDark} />
              <Text style={{ color: c.primaryDark, fontWeight: "700", fontSize: 15 }}>
                {t.auth.enterDemo}
              </Text>
            </TouchableOpacity>

            <Text style={{ color: c.textMuted, textAlign: "center", fontSize: 12, marginTop: 12 }}>
              {t.auth.demoCodeHint} <Text style={{ fontWeight: "800" }}>000000</Text>
            </Text>
          </>
        )}
      </View>
    </View>
  );
}
