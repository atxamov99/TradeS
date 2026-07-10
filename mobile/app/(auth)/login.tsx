import { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator,
  ScrollView, KeyboardAvoidingView, Platform,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useLangStore } from "@/store/langStore";
import { useAuthStore } from "@/store/authStore";
import { api } from "@/services/api";
import { useTheme } from "@/hooks/useTheme";
import { light } from "@/theme/colors";
import { Lang } from "@/i18n";
import { formatPhone, cleanIdentifier } from "@/utils/phone";

const LANGS: { code: Lang; label: string; flag: string }[] = [
  { code: "uz", label: "UZ", flag: "🇺🇿" },
  { code: "ru", label: "RU", flag: "🇷🇺" },
  { code: "en", label: "EN", flag: "🇬🇧" },
];

function Field({
  icon, placeholder, value, onChangeText, secure, onToggleSecure, showSecure, keyboardType, c,
}: {
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
    <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: c.bg, borderRadius: 14, paddingHorizontal: 14, marginBottom: 12, borderWidth: 1.5, borderColor: c.border, height: 54 }}>
      <Ionicons name={icon} size={17} color={c.textMuted} style={{ marginRight: 10 }} />
      <TextInput
        style={{ flex: 1, fontSize: 15, color: c.text }}
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
        <TouchableOpacity onPress={onToggleSecure}>
          <Ionicons name={showSecure ? "eye-off" : "eye"} size={18} color={c.textMuted} />
        </TouchableOpacity>
      )}
    </View>
  );
}

export default function LoginScreen() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const { lang, setLang } = useLangStore();
  const { setToken } = useAuthStore();
  const { c } = useTheme();

  const isValid = identifier.trim().length > 0 && password.length > 0;

  async function handleLogin() {
    if (!isValid) {
      Alert.alert("Xatolik", "Telefon/email va parolni kiriting");
      return;
    }
    setLoading(true);
    try {
      const cleanedId = cleanIdentifier(identifier);
      const payload: { password: string; email?: string; phone?: string } = {
        password: password.trim(),
      };
      if (cleanedId.includes("@")) payload.email = cleanedId;
      else payload.phone = cleanedId;

      const res = await api.post("/auth/login", payload);
      const data = res.data?.data ?? res.data;
      await setToken(data.accessToken, data.refreshToken);
      // token o'zgarishi root _layout guard'ini ishga tushiradi → (app) ga o'tadi
    } catch (e: any) {
      const msg = e?.response?.data?.message || "Kirishda xatolik. Ma'lumotlarni tekshiring";
      Alert.alert("Xatolik", msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView
        style={{ flex: 1, backgroundColor: c.bg }}
        contentContainerStyle={{ flexGrow: 1, justifyContent: "center", paddingHorizontal: 24, paddingVertical: 40 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Logo */}
        <View style={{ alignItems: "center", marginBottom: 28 }}>
          <View style={{ width: 84, height: 84, backgroundColor: c.primary, borderRadius: 26, alignItems: "center", justifyContent: "center", marginBottom: 14, shadowColor: c.primary, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 16, elevation: 10 }}>
            <Ionicons name="stats-chart" size={40} color="#fff" />
          </View>
          <Text style={{ color: c.text, fontSize: 30, fontWeight: "900", letterSpacing: -1 }}>Savdo</Text>
          <Text style={{ color: c.textMuted, fontSize: 14, marginTop: 4 }}>Savdogar uchun ilova</Text>
        </View>

        {/* Language switcher */}
        <View style={{ flexDirection: "row", backgroundColor: c.bgCard, borderRadius: 14, padding: 4, marginBottom: 24, borderWidth: 1, borderColor: c.border }}>
          {LANGS.map((l) => {
            const active = lang === l.code;
            return (
              <TouchableOpacity
                key={l.code}
                onPress={() => setLang(l.code)}
                style={{ flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, height: 42, borderRadius: 10, backgroundColor: active ? c.primary : "transparent" }}
              >
                <Text style={{ fontSize: 15 }}>{l.flag}</Text>
                <Text style={{ color: active ? "#fff" : c.textMuted, fontWeight: "700", fontSize: 14 }}>{l.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Card */}
        <View style={{ backgroundColor: c.bgCard, borderRadius: 22, padding: 22, borderWidth: 1, borderColor: c.border }}>
          <Text style={{ color: c.text, fontSize: 22, fontWeight: "800", marginBottom: 4 }}>Kirish</Text>
          <Text style={{ color: c.textMuted, fontSize: 13, marginBottom: 20 }}>Hisobingizga kiring</Text>

          <Field
            icon="person-outline"
            placeholder="Telefon yoki email"
            value={identifier}
            onChangeText={(v) => setIdentifier(formatPhone(v))}
            keyboardType="default"
            c={c}
          />
          <Field
            icon="lock-closed-outline"
            placeholder="Parol"
            value={password}
            onChangeText={setPassword}
            secure
            showSecure={showPass}
            onToggleSecure={() => setShowPass(!showPass)}
            c={c}
          />

          <TouchableOpacity onPress={() => router.push("/forgot-password")} style={{ alignSelf: "flex-end", marginTop: 4, marginBottom: 16 }}>
            <Text style={{ color: c.primary, fontWeight: "700", fontSize: 13 }}>Parolni unutdingizmi?</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleLogin}
            disabled={!isValid || loading}
            style={{ height: 54, borderRadius: 16, backgroundColor: isValid && !loading ? c.primary : c.bgMuted, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 }}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="arrow-forward" size={18} color={isValid ? "#fff" : c.textMuted} />
                <Text style={{ color: isValid ? "#fff" : c.textMuted, fontWeight: "800", fontSize: 16 }}>Kirish</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Register link */}
        <View style={{ flexDirection: "row", justifyContent: "center", alignItems: "center", marginTop: 22 }}>
          <Text style={{ color: c.textMuted, fontSize: 14 }}>Hisobingiz yo'qmi? </Text>
          <TouchableOpacity onPress={() => router.push("/register")}>
            <Text style={{ color: c.primary, fontSize: 14, fontWeight: "800" }}>Ro'yxatdan o'tish</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
