import { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator,
  ScrollView, KeyboardAvoidingView, Platform, Image,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "@/store/authStore";
import { useUserStore } from "@/store/userStore";
import { api } from "@/services/api";
import { light } from "@/theme/colors";
import { formatPhone, cleanIdentifier } from "@/utils/phone";

// Auth ekranlari eski ilovadagidek DOIM och (light) ko'rinadi — global dark tema majburlanmaydi.
const c = light;

function Field({
  label, icon, placeholder, value, onChangeText, secure, onToggleSecure, showSecure, keyboardType, c,
}: {
  label?: string;
  icon: React.ComponentProps<typeof Ionicons>["name"];
  placeholder: string;
  value: string;
  onChangeText: (v: string) => void;
  secure?: boolean;
  onToggleSecure?: () => void;
  showSecure?: boolean;
  keyboardType?: any;
  c: typeof light;
}) {
  return (
    <View style={{ marginBottom: 16 }}>
      {label ? (
        <Text style={{ fontSize: 12, fontWeight: "600", color: c.textSub, marginBottom: 6 }}>{label}</Text>
      ) : null}
      <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: c.bgCard, borderRadius: 12, paddingHorizontal: 16, borderWidth: 1, borderColor: c.border, height: 50 }}>
        <Ionicons name={icon} size={20} color={c.textMuted} style={{ marginRight: 10 }} />
        <TextInput
          style={{ flex: 1, fontSize: 16, color: c.text }}
          placeholder={placeholder}
          placeholderTextColor={c.textMuted}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secure && !showSecure}
          keyboardType={keyboardType ?? "default"}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {secure && (
          <TouchableOpacity onPress={onToggleSecure} style={{ marginLeft: 8, padding: 2 }}>
            <Ionicons name={showSecure ? "eye-off-outline" : "eye-outline"} size={20} color={c.textMuted} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

export default function LoginScreen() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"password" | "device-confirm">("password");
  const [code, setCode] = useState("");

  const { setToken } = useAuthStore();
  const { setUser } = useUserStore();

  const isValid = identifier.trim().length > 0 && password.length > 0;

  function credentialPayload() {
    const cleanedId = cleanIdentifier(identifier);
    const payload: { email?: string; phone?: string } = {};
    if (cleanedId.includes("@")) payload.email = cleanedId;
    else payload.phone = cleanedId;
    return payload;
  }

  async function handleLogin() {
    if (!isValid) {
      Alert.alert("Xatolik", "Telefon/email va parolni kiriting");
      return;
    }
    setLoading(true);
    try {
      const payload = { ...credentialPayload(), password: password.trim() };
      const res = await api.post("/auth/login", payload);
      const data = res.data?.data ?? res.data;
      if (data.requiresDeviceConfirmation) {
        setCode("");
        setMode("device-confirm");
        return;
      }
      await setUser(data.user);
      await setToken(data.accessToken, data.refreshToken);
      // token o'zgarishi root _layout guard'ini ishga tushiradi → (app) ga o'tadi
    } catch (e: any) {
      const msg = e?.response?.data?.message || "Kirishda xatolik. Ma'lumotlarni tekshiring";
      Alert.alert("Xatolik", msg);
    } finally {
      setLoading(false);
    }
  }

  async function handleDeviceConfirm() {
    if (code.length !== 6) return;
    setLoading(true);
    try {
      const payload = { ...credentialPayload(), password: password.trim(), code };
      const res = await api.post("/auth/verify-new-device", payload);
      const data = res.data?.data ?? res.data;
      await setUser(data.user);
      await setToken(data.accessToken, data.refreshToken);
    } catch (e: any) {
      const msg = e?.response?.data?.message || "Kod noto'g'ri";
      Alert.alert("Xatolik", msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView
        style={{ flex: 1, backgroundColor: c.bg }}
        contentContainerStyle={{ flexGrow: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 20, paddingVertical: 40 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header: logo + brand */}
        <View style={{ alignItems: "center", marginBottom: 32 }}>
          <Image source={require("@/assets/logo.png")} style={{ width: 96, height: 96, marginBottom: 12 }} resizeMode="contain" />
          <Text style={{ color: c.primary, fontSize: 28, fontWeight: "700", letterSpacing: 1 }}>TradeS</Text>
          <Text style={{ color: c.textMuted, fontSize: 14, marginTop: 4 }}>Boshqaruv tizimi</Text>
        </View>

        {/* Card */}
        <View style={{ width: "100%", backgroundColor: c.bgCard, borderRadius: 16, padding: 24, borderWidth: 1, borderColor: c.border, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 15, elevation: 2 }}>
          {mode === "password" ? (
          <>
          <Text style={{ color: c.text, fontSize: 24, fontWeight: "700", marginBottom: 8 }}>Xush kelibsiz</Text>
          <Text style={{ color: c.textMuted, fontSize: 16, marginBottom: 24 }}>Hisobingizga kiring</Text>

          <Field
            label="Telefon"
            icon="call-outline"
            placeholder="+998 90 123 45 67"
            value={identifier}
            onChangeText={(v) => setIdentifier(formatPhone(v))}
            keyboardType="phone-pad"
            c={c}
          />
          <Field
            label="Parol"
            icon="lock-closed-outline"
            placeholder="Parolingiz"
            value={password}
            onChangeText={setPassword}
            secure
            showSecure={showPass}
            onToggleSecure={() => setShowPass(!showPass)}
            c={c}
          />

          <TouchableOpacity onPress={() => router.push("/forgot-password")} style={{ alignSelf: "flex-end", marginTop: 2, marginBottom: 20 }}>
            <Text style={{ color: c.primary, fontWeight: "600", fontSize: 13 }}>Parolni unutdingizmi?</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.85}
            style={{ height: 52, borderRadius: 12, backgroundColor: c.primary, flexDirection: "row", alignItems: "center", justifyContent: "center", opacity: loading ? 0.7 : 1 }}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={{ color: "#fff", fontWeight: "600", fontSize: 16 }}>Kirish</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push("/register")}
            activeOpacity={0.7}
            style={{ height: 50, borderRadius: 12, alignItems: "center", justifyContent: "center", marginTop: 12 }}
          >
            <Text style={{ color: c.primary, fontWeight: "600", fontSize: 16 }}>Ro'yxatdan o'tish</Text>
          </TouchableOpacity>
          </>
          ) : (
          <>
          <View style={{ alignItems: "center", marginBottom: 8 }}>
            <View style={{ width: 64, height: 64, borderRadius: 16, backgroundColor: c.primary + "20", alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
              <Ionicons name="key-outline" size={30} color={c.primary} />
            </View>
            <Text style={{ color: c.text, fontSize: 18, fontWeight: "800", textAlign: "center" }}>Yangi qurilma aniqlandi</Text>
            <Text style={{ color: c.textMuted, fontSize: 14, marginTop: 6, textAlign: "center" }}>
              Telegramga yuborilgan 6 xonali kodni kiriting
            </Text>
          </View>

          <TextInput
            style={{ backgroundColor: c.bgCard, borderRadius: 12, borderWidth: 1, borderColor: c.border, height: 56, fontSize: 24, fontWeight: "800", letterSpacing: 8, color: c.text, textAlign: "center", marginTop: 16, marginBottom: 20 }}
            placeholder="••••••"
            placeholderTextColor={c.textMuted}
            value={code}
            onChangeText={(v) => setCode(v.replace(/\D/g, "").slice(0, 6))}
            keyboardType="number-pad"
            maxLength={6}
            autoFocus
          />

          <TouchableOpacity
            onPress={handleDeviceConfirm}
            disabled={loading || code.length !== 6}
            activeOpacity={0.85}
            style={{ height: 52, borderRadius: 12, backgroundColor: c.primary, flexDirection: "row", alignItems: "center", justifyContent: "center", opacity: loading || code.length !== 6 ? 0.6 : 1 }}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={{ color: "#fff", fontWeight: "600", fontSize: 16 }}>Kirish</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => { setMode("password"); setCode(""); }}
            activeOpacity={0.7}
            style={{ height: 50, borderRadius: 12, alignItems: "center", justifyContent: "center", marginTop: 8 }}
          >
            <Text style={{ color: c.textMuted, fontWeight: "600", fontSize: 14 }}>Orqaga</Text>
          </TouchableOpacity>
          </>
          )}
        </View>

        {/* Footer */}
        <Text style={{ color: c.textMuted, fontSize: 10, marginTop: 40 }}>v1.0.0</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
