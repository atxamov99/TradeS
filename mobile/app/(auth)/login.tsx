import { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, ActivityIndicator, ScrollView, KeyboardAvoidingView, Platform, Image,
} from "react-native";
import { Alert } from "@/utils/alert";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "@/store/authStore";
import { useUserStore } from "@/store/userStore";
import { api } from "@/services/api";
import { dark } from "@/theme/colors";
import { useAuthText } from "@/utils/authText";
import { AuthLangSwitch } from "@/components/AuthLangSwitch";
import { formatPhone, cleanIdentifier } from "@/utils/phone";

// Auth ekranlari eski ilovadagidek DOIM och (light) ko'rinadi — global dark tema majburlanmaydi.
const c = dark; // auth screens are always dark-green, exactly like the website

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
  c: typeof dark;
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
  const a = useAuthText();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"password" | "device-confirm" | "email-request" | "email-otp">("password");
  const [email, setEmail] = useState("");
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
      Alert.alert(a.error, a.errFillLogin);
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
      const msg = e?.response?.data?.message || a.errLogin;
      Alert.alert(a.error, msg);
    } finally {
      setLoading(false);
    }
  }

  async function handleEmailRequest() {
    const e = email.trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(e)) {
      Alert.alert(a.error, a.errEmail);
      return;
    }
    setLoading(true);
    try {
      const res = await api.post("/auth/request-email-otp", { email: e });
      const dev = res.data?.data?.devCode;
      setCode(dev ? String(dev) : "");
      setMode("email-otp");
      // Email provider not configured (dev): server returns the code — show it so the flow is not a dead end.
      if (dev) Alert.alert(a.devMode, a.devMsg + dev, undefined, "info");
    } catch (err: any) {
      Alert.alert(a.error, err?.response?.data?.message || a.errSend);
    } finally {
      setLoading(false);
    }
  }

  async function handleEmailVerify() {
    if (code.length !== 6) return;
    setLoading(true);
    try {
      // No password => login-only (existing account), same as the website.
      const res = await api.post("/auth/verify-email-otp", { email: email.trim().toLowerCase(), code });
      const data = res.data?.data ?? res.data;
      await setUser(data.user);
      await setToken(data.accessToken, data.refreshToken);
    } catch (err: any) {
      Alert.alert(a.error, err?.response?.data?.message || a.errCode);
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
      const msg = e?.response?.data?.message || a.errCode;
      Alert.alert(a.error, msg);
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
          <Image source={require("@/assets/logo-dark.png")} style={{ width: 96, height: 96, marginBottom: 12 }} resizeMode="contain" />
          <Text style={{ color: c.primary, fontSize: 28, fontWeight: "700", letterSpacing: 1 }}>TradeS</Text>
          <Text style={{ color: c.textMuted, fontSize: 14, marginTop: 4 }}>{a.appSub}</Text>
        </View>

        {/* Card */}
        <View style={{ width: "100%", backgroundColor: c.bgCard, borderRadius: 16, padding: 24, borderWidth: 1, borderColor: c.border, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 15, elevation: 2 }}>
          {mode === "email-request" || mode === "email-otp" ? (
          <>
          <View style={{ alignItems: "center", marginBottom: 12 }}>
            <View style={{ width: 64, height: 64, borderRadius: 16, backgroundColor: c.primary + "20", alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
              <Ionicons name="mail-outline" size={30} color={c.primary} />
            </View>
            <Text style={{ color: c.text, fontSize: 18, fontWeight: "800", textAlign: "center" }}>{a.emailLogin}</Text>
            <Text style={{ color: c.textMuted, fontSize: 14, marginTop: 6, textAlign: "center" }}>
              {mode === "email-request" ? a.emailCodeAsk : a.emailCodeSub}
            </Text>
          </View>

          {mode === "email-request" ? (
            <>
              <Field label={a.emailAddr} icon="mail-outline" placeholder="email@misol.com" value={email} onChangeText={setEmail} keyboardType="email-address" c={c} />
              <TouchableOpacity
                onPress={handleEmailRequest}
                disabled={loading}
                activeOpacity={0.85}
                style={{ height: 52, borderRadius: 12, backgroundColor: c.primary, alignItems: "center", justifyContent: "center", opacity: loading ? 0.7 : 1 }}
              >
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={{ color: "#fff", fontWeight: "600", fontSize: 16 }}>{a.getCode}</Text>}
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={{ color: c.primary, fontSize: 15, fontWeight: "800", textAlign: "center", marginBottom: 12 }}>{email.trim().toLowerCase()}</Text>
              <TextInput
                style={{ backgroundColor: c.bgCard, borderRadius: 12, borderWidth: 1, borderColor: c.border, height: 56, fontSize: 24, fontWeight: "800", letterSpacing: 8, color: c.text, textAlign: "center", marginBottom: 16 }}
                placeholder="••••••"
                placeholderTextColor={c.textMuted}
                value={code}
                onChangeText={(v) => setCode(v.replace(/\D/g, "").slice(0, 6))}
                keyboardType="number-pad"
                maxLength={6}
                autoFocus
              />
              <TouchableOpacity
                onPress={handleEmailVerify}
                disabled={loading || code.length !== 6}
                activeOpacity={0.85}
                style={{ height: 52, borderRadius: 12, backgroundColor: c.primary, alignItems: "center", justifyContent: "center", opacity: loading || code.length !== 6 ? 0.6 : 1 }}
              >
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={{ color: "#fff", fontWeight: "600", fontSize: 16 }}>{a.signIn}</Text>}
              </TouchableOpacity>
              <TouchableOpacity onPress={handleEmailRequest} disabled={loading} style={{ alignItems: "center", marginTop: 14 }}>
                <Text style={{ color: c.textMuted, fontSize: 14 }}>{a.resend}</Text>
              </TouchableOpacity>
            </>
          )}

          <TouchableOpacity
            onPress={() => { setMode("password"); setCode(""); }}
            activeOpacity={0.7}
            style={{ height: 50, borderRadius: 12, alignItems: "center", justifyContent: "center", marginTop: 8 }}
          >
            <Text style={{ color: c.textMuted, fontWeight: "600", fontSize: 14 }}>{a.passwordLogin}</Text>
          </TouchableOpacity>
          </>
          ) : mode === "password" ? (
          <>
          <Text style={{ color: c.text, fontSize: 24, fontWeight: "700", marginBottom: 8 }}>{a.welcome}</Text>
          <Text style={{ color: c.textMuted, fontSize: 16, marginBottom: 24 }}>{a.signInSub}</Text>

          <Field
            label={a.phone}
            icon="call-outline"
            placeholder="+998 90 123 45 67"
            value={identifier}
            onChangeText={(v) => setIdentifier(formatPhone(v))}
            keyboardType="phone-pad"
            c={c}
          />
          <Field
            label={a.password}
            icon="lock-closed-outline"
            placeholder={a.passwordPh}
            value={password}
            onChangeText={setPassword}
            secure
            showSecure={showPass}
            onToggleSecure={() => setShowPass(!showPass)}
            c={c}
          />

          <TouchableOpacity onPress={() => router.push("/forgot-password")} style={{ alignSelf: "flex-end", marginTop: 2, marginBottom: 20 }}>
            <Text style={{ color: c.primary, fontWeight: "600", fontSize: 13 }}>{a.forgot}</Text>
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
              <Text style={{ color: "#fff", fontWeight: "600", fontSize: 16 }}>{a.signIn}</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push("/register")}
            activeOpacity={0.7}
            style={{ height: 50, borderRadius: 12, alignItems: "center", justifyContent: "center", marginTop: 12 }}
          >
            <Text style={{ color: c.primary, fontWeight: "600", fontSize: 16 }}>{a.signUp}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => { setMode("email-request"); setCode(""); }}
            activeOpacity={0.7}
            style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, height: 46, marginTop: 4 }}
          >
            <Ionicons name="mail-outline" size={18} color={c.textMuted} />
            <Text style={{ color: c.textMuted, fontWeight: "600", fontSize: 14 }}>{a.emailLogin}</Text>
          </TouchableOpacity>
          </>
          ) : (
          <>
          <View style={{ alignItems: "center", marginBottom: 8 }}>
            <View style={{ width: 64, height: 64, borderRadius: 16, backgroundColor: c.primary + "20", alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
              <Ionicons name="key-outline" size={30} color={c.primary} />
            </View>
            <Text style={{ color: c.text, fontSize: 18, fontWeight: "800", textAlign: "center" }}>{a.newDevice}</Text>
            <Text style={{ color: c.textMuted, fontSize: 14, marginTop: 6, textAlign: "center" }}>
              {a.tgCodeSub}
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
              <Text style={{ color: "#fff", fontWeight: "600", fontSize: 16 }}>{a.signIn}</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => { setMode("password"); setCode(""); }}
            activeOpacity={0.7}
            style={{ height: 50, borderRadius: 12, alignItems: "center", justifyContent: "center", marginTop: 8 }}
          >
            <Text style={{ color: c.textMuted, fontWeight: "600", fontSize: 14 }}>{a.back}</Text>
          </TouchableOpacity>
          </>
          )}
        </View>

        {/* Footer */}
        <Text style={{ color: c.textMuted, fontSize: 10, marginTop: 40 }}>v1.0.0</Text>
      </ScrollView>
      <AuthLangSwitch />
    </KeyboardAvoidingView>
  );
}
