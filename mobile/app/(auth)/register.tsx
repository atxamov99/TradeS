import { useState, useRef, useEffect } from "react";
import {
  View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator,
  ScrollView, KeyboardAvoidingView, Platform, Linking, Pressable, AppState,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "@/store/authStore";
import { api } from "@/services/api";
import { useTheme } from "@/hooks/useTheme";
import { light } from "@/theme/colors";
import { formatPhone, cleanIdentifier } from "@/utils/phone";

const BOT_URL = "https://t.me/trades_uz_bot?start=register";
const TG_BLUE = "#229ED9";
const OTP_LEN = 6;

/* ── Segmented OTP input (6 boxes, single hidden field) ── */
function OtpBoxes({ value, onChange, c }: { value: string; onChange: (v: string) => void; c: typeof light }) {
  const ref = useRef<TextInput>(null);
  const digits = value.split("");

  const focusInput = () => {
    ref.current?.blur();
    requestAnimationFrame(() => ref.current?.focus());
  };

  useEffect(() => {
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") setTimeout(() => ref.current?.focus(), 350);
    });
    return () => sub.remove();
  }, []);

  return (
    <Pressable style={{ position: "relative", height: 56, justifyContent: "center" }} onPress={focusInput}>
      <View style={{ flexDirection: "row", justifyContent: "space-between" }} pointerEvents="none">
        {Array.from({ length: OTP_LEN }).map((_, i) => {
          const filled = i < digits.length;
          const active = i === digits.length;
          return (
            <View
              key={i}
              style={{
                width: 46, height: 56, borderRadius: 14, borderWidth: active ? 2 : 1.5,
                alignItems: "center", justifyContent: "center",
                backgroundColor: c.bgCard,
                borderColor: active ? c.primary : filled ? c.primary + "66" : c.border,
              }}
            >
              <Text style={{ fontSize: 24, fontWeight: "800", color: c.text }}>{digits[i] || ""}</Text>
            </View>
          );
        })}
      </View>
      <TextInput
        ref={ref}
        value={value}
        onChangeText={(v) => onChange(v.replace(/\D/g, "").slice(0, OTP_LEN))}
        keyboardType="number-pad"
        maxLength={OTP_LEN}
        autoFocus
        caretHidden
        style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, opacity: 0, color: "transparent" }}
      />
    </Pressable>
  );
}

function BigButton({ title, onPress, loading, disabled, color, textColor = "#fff", icon }: {
  title: string; onPress: () => void; loading?: boolean; disabled?: boolean;
  color: string; textColor?: string; icon?: React.ComponentProps<typeof Ionicons>["name"];
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.85}
      style={{ height: 54, borderRadius: 16, flexDirection: "row", alignItems: "center", justifyContent: "center", backgroundColor: color, opacity: disabled || loading ? 0.55 : 1 }}
    >
      {loading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <>
          {icon && <Ionicons name={icon} size={18} color={textColor} style={{ marginRight: 8 }} />}
          <Text style={{ fontSize: 16, fontWeight: "800", color: textColor }}>{title}</Text>
        </>
      )}
    </TouchableOpacity>
  );
}

function Field({ icon, placeholder, value, onChangeText, secure, onToggleSecure, showSecure, keyboardType, c }: {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  placeholder: string; value: string; onChangeText: (v: string) => void;
  secure?: boolean; onToggleSecure?: () => void; showSecure?: boolean; keyboardType?: any; c: typeof light;
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

export default function RegisterScreen() {
  const { c } = useTheme();
  const { setToken } = useAuthStore();

  const [step, setStep] = useState<"form" | "connect" | "otp">("form");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const phoneDigits = phone.replace(/\D/g, "");
  const stepNum = step === "form" ? 1 : 2;

  const sendCode = async () => {
    setLoading(true);
    try {
      await api.post("/auth/request-otp", { phone: cleanIdentifier(phone) });
      setCode("");
      setStep("otp");
    } catch (error: any) {
      if (error.response?.status === 428) setStep("connect");
      else Alert.alert("Xatolik", error.response?.data?.message || "Ro'yxatdan o'tishda xatolik");
    } finally {
      setLoading(false);
    }
  };

  const handleStart = () => {
    if (!name.trim() || phoneDigits.length < 12 || !password.trim()) {
      Alert.alert("Xatolik", "Barcha maydonlarni to'ldiring");
      return;
    }
    sendCode();
  };

  const handleVerify = async () => {
    if (code.length !== OTP_LEN) return;
    setLoading(true);
    try {
      const res = await api.post("/auth/verify-otp", {
        phone: cleanIdentifier(phone),
        code,
        name: name.trim(),
        password: password.trim(),
      });
      const data = res.data?.data ?? res.data;
      await setToken(data.accessToken, data.refreshToken);
      // token o'zgarishi root _layout guard'ini ishga tushiradi → (app) ga o'tadi
    } catch (error: any) {
      Alert.alert("Xatolik", error.response?.data?.message || "Ro'yxatdan o'tishda xatolik");
    } finally {
      setLoading(false);
    }
  };

  const goBack = () => (step === "form" ? router.replace("/login") : setStep("form"));

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView
        style={{ flex: 1, backgroundColor: c.bg }}
        contentContainerStyle={{ flexGrow: 1, justifyContent: "center", paddingHorizontal: 22, paddingVertical: 36 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Top bar: back + step pills */}
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 24 }}>
          <TouchableOpacity onPress={goBack} activeOpacity={0.7} style={{ width: 42, height: 42, borderRadius: 14, borderWidth: 1, borderColor: c.border, alignItems: "center", justifyContent: "center" }}>
            <Ionicons name="arrow-back" size={20} color={c.text} />
          </TouchableOpacity>
          <View style={{ flexDirection: "row", gap: 6, marginLeft: 14, flex: 1 }}>
            <View style={{ height: 5, borderRadius: 3, flex: 1, backgroundColor: c.primary }} />
            <View style={{ height: 5, borderRadius: 3, flex: 1, backgroundColor: stepNum >= 2 ? c.primary : c.border }} />
          </View>
        </View>

        {/* Brand header */}
        <View style={{ alignItems: "center", marginBottom: 24 }}>
          <View style={{ width: 72, height: 72, borderRadius: 22, backgroundColor: c.primary, alignItems: "center", justifyContent: "center", marginBottom: 12, shadowColor: c.primary, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.35, shadowRadius: 16, elevation: 8 }}>
            <Ionicons name="stats-chart" size={34} color="#fff" />
          </View>
          <Text style={{ fontSize: 26, fontWeight: "900", letterSpacing: -0.5, color: c.text }}>Savdo</Text>
        </View>

        {/* ── STEP 1: FORM ── */}
        {step === "form" && (
          <View style={{ backgroundColor: c.bgCard, borderRadius: 24, borderWidth: 1, borderColor: c.border, padding: 24 }}>
            <Text style={{ fontSize: 22, fontWeight: "800", marginBottom: 6, color: c.text }}>Ro'yxatdan o'tish</Text>
            <Text style={{ fontSize: 13, marginBottom: 20, lineHeight: 20, color: c.textMuted }}>
              Telefon raqamingiz orqali ro'yxatdan o'ting
            </Text>

            <Field icon="person-outline" placeholder="Ismingiz" value={name} onChangeText={setName} c={c} />
            <Field icon="call-outline" placeholder="+998 90 123 45 67" value={phone} onChangeText={(txt) => setPhone(formatPhone(txt))} keyboardType="phone-pad" c={c} />

            <View style={{ flexDirection: "row", alignItems: "center", marginTop: -4, marginBottom: 16, paddingHorizontal: 2 }}>
              <Ionicons name="paper-plane-outline" size={13} color={c.textMuted} />
              <Text style={{ fontSize: 12, marginLeft: 6, flex: 1, color: c.textMuted }}>
                Tasdiqlash kodi bepul — Telegram bot orqali keladi
              </Text>
            </View>

            <Field
              icon="lock-closed-outline" placeholder="Parol" value={password} onChangeText={setPassword}
              secure showSecure={showPassword} onToggleSecure={() => setShowPassword(!showPassword)} c={c}
            />

            <View style={{ height: 8 }} />
            <BigButton title="Kod olish" onPress={handleStart} loading={loading} color={c.primary} icon="arrow-forward" />

            <View style={{ flexDirection: "row", justifyContent: "center", alignItems: "center", marginTop: 20 }}>
              <Text style={{ color: c.textMuted, fontSize: 14 }}>Hisobingiz bormi? </Text>
              <TouchableOpacity onPress={() => router.replace("/login")}>
                <Text style={{ color: c.primary, fontSize: 14, fontWeight: "800" }}>Kirish</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ── STEP 2a: CONNECT TELEGRAM ── */}
        {step === "connect" && (
          <View style={{ backgroundColor: c.bgCard, borderRadius: 24, borderWidth: 1, borderColor: c.border, padding: 24 }}>
            <View style={{ width: 80, height: 80, borderRadius: 26, alignSelf: "center", alignItems: "center", justifyContent: "center", marginBottom: 18, backgroundColor: TG_BLUE + "1F" }}>
              <Ionicons name="paper-plane" size={38} color={TG_BLUE} />
            </View>
            <Text style={{ fontSize: 22, fontWeight: "800", marginBottom: 6, color: c.text, textAlign: "center" }}>Telegram'ni ulang</Text>
            <Text style={{ fontSize: 13, marginBottom: 22, lineHeight: 20, color: c.textMuted, textAlign: "center" }}>
              Kod bepul — Telegram orqali keladi
            </Text>

            {[
              { icon: "paper-plane-outline" as const, text: "«Telegram botni ochish» tugmasini bosing" },
              { icon: "call-outline" as const, text: "Botda «📱 Raqamni ulashish» ni bosing" },
              { icon: "key-outline" as const, text: "6 xonali kod shu botga keladi" },
            ].map((s, i) => (
              <View key={i} style={{ flexDirection: "row", alignItems: "center", marginBottom: 14 }}>
                <View style={{ width: 28, height: 28, borderRadius: 9, alignItems: "center", justifyContent: "center", marginRight: 12, backgroundColor: c.primary + "22" }}>
                  <Ionicons name={s.icon} size={17} color={c.primary} />
                </View>
                <Text style={{ flex: 1, fontSize: 13, lineHeight: 19, color: c.text }}>{s.text}</Text>
              </View>
            ))}

            <View style={{ height: 8 }} />
            <BigButton title="Telegram botni ochish" onPress={() => Linking.openURL(BOT_URL)} color={TG_BLUE} icon="paper-plane" />
            <View style={{ height: 12 }} />
            <BigButton title="Uladim — kod yuborish" onPress={sendCode} loading={loading} color={c.primary} icon="checkmark" />
          </View>
        )}

        {/* ── STEP 2b: OTP ── */}
        {step === "otp" && (
          <View style={{ backgroundColor: c.bgCard, borderRadius: 24, borderWidth: 1, borderColor: c.border, padding: 24 }}>
            <View style={{ width: 80, height: 80, borderRadius: 26, alignSelf: "center", alignItems: "center", justifyContent: "center", marginBottom: 18, backgroundColor: c.primary + "1F" }}>
              <Ionicons name="shield-checkmark" size={38} color={c.primary} />
            </View>
            <Text style={{ fontSize: 22, fontWeight: "800", marginBottom: 6, color: c.text, textAlign: "center" }}>Tasdiqlash kodi</Text>
            <Text style={{ fontSize: 13, marginBottom: 6, lineHeight: 20, color: c.textMuted, textAlign: "center" }}>
              Telegram'ga yuborilgan 6 xonali kod
            </Text>
            <Text style={{ fontSize: 16, fontWeight: "800", textAlign: "center", marginBottom: 12, color: c.primary }}>{phone}</Text>

            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", alignSelf: "center", paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20, marginBottom: 22, backgroundColor: TG_BLUE + "14" }}>
              <Ionicons name="paper-plane" size={14} color={TG_BLUE} />
              <Text style={{ fontSize: 12, marginLeft: 6, color: c.textMuted }}>Kod @trades_uz_bot botiga yuborildi</Text>
            </View>

            <OtpBoxes value={code} onChange={setCode} c={c} />

            <View style={{ height: 24 }} />
            <BigButton title="Tasdiqlash" onPress={handleVerify} loading={loading} disabled={code.length !== OTP_LEN} color={c.primary} icon="checkmark-circle" />

            <TouchableOpacity onPress={sendCode} disabled={loading} style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", marginTop: 18 }}>
              <Ionicons name="refresh" size={15} color={c.textMuted} />
              <Text style={{ color: c.textMuted, fontSize: 14, marginLeft: 6 }}>Kodni qayta yuborish</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
