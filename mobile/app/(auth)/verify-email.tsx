import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { api } from "@/services/api";
import { useAuthStore } from "@/store/authStore";
import { useT } from "@/hooks/useT";
import { useTheme } from "@/hooks/useTheme";

const DEMO_CODE = "000000";

export default function VerifyEmailScreen() {
  const { email } = useLocalSearchParams<{ email: string }>();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const { setToken, saveEmailCredentials } = useAuthStore();
  const t = useT();
  const { c } = useTheme();

  async function handleVerify() {
    if (code.length !== 6) return;
    if (code === DEMO_CODE) {
      await setToken("demo-token", "demo-refresh");
      return;
    }
    setLoading(true);
    try {
      const res = await api.post("/auth/verify-email", { email, code });
      await saveEmailCredentials(email, "", res.data.accessToken, res.data.refreshToken);
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
          <Ionicons name="chevron-back" size={20} color="rgba(255,255,255,0.8)" />
          <Text style={{ color: "rgba(255,255,255,0.8)", fontWeight: "600" }}>{t.auth.back}</Text>
        </TouchableOpacity>

        <View style={{ width: 80, height: 80, backgroundColor: "rgba(255,255,255,0.15)", borderRadius: 40, alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
          <Ionicons name="mail" size={40} color="#fff" />
        </View>
        <Text style={{ color: "#fff", fontSize: 22, fontWeight: "800", textAlign: "center" }}>
          {t.auth.email} {t.auth.smsCode}
        </Text>
        <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 14, marginTop: 8, textAlign: "center" }}>
          {email}
        </Text>
        <Text style={{ color: "rgba(255,255,255,0.55)", fontSize: 13, marginTop: 4, textAlign: "center" }}>
          {t.auth.codeSent}
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
            fontSize: 34,
            textAlign: "center",
            letterSpacing: 10,
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
            backgroundColor: code.length === 6 && !loading ? c.primary : c.bgMuted,
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
      </View>
    </View>
  );
}
