import { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity,
  ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/hooks/useTheme";
import { api } from "@/services/api";

type Step = "input" | "sent";

export default function ForgotPasswordScreen() {
  const { c } = useTheme();
  const [email, setEmail]     = useState("");
  const [step, setStep]       = useState<Step>("input");
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  async function handleSubmit() {
    if (!isValid || loading) return;
    setError("");
    setLoading(true);
    try {
      await api.post("/auth/forgot-password", { email: email.toLowerCase() });
    } catch (e: any) {
      // no internet or server error — still show success (don't leak user existence)
    } finally {
      setLoading(false);
    }
    setStep("sent");
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: c.bg }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ── */}
        <View style={{ paddingTop: 56, paddingHorizontal: 20, paddingBottom: 8 }}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={{
              width: 42, height: 42, borderRadius: 13,
              backgroundColor: c.bgCard,
              borderWidth: 1.5, borderColor: c.border,
              alignItems: "center", justifyContent: "center",
            }}
          >
            <Ionicons name="arrow-back" size={20} color={c.text} />
          </TouchableOpacity>
        </View>

        {/* ── Content ── */}
        <View style={{ flex: 1, paddingHorizontal: 24, paddingTop: 28 }}>

          {step === "input" ? (
            <>
              {/* Icon */}
              <View style={{
                width: 72, height: 72, borderRadius: 22,
                backgroundColor: c.primary + "20",
                alignItems: "center", justifyContent: "center",
                marginBottom: 24,
              }}>
                <Ionicons name="lock-open-outline" size={34} color={c.primary} />
              </View>

              {/* Title */}
              <Text style={{ color: c.text, fontSize: 28, fontWeight: "800", letterSpacing: -0.8, marginBottom: 8 }}>
                Parolni tiklash
              </Text>
              <Text style={{ color: c.textMuted, fontSize: 14, lineHeight: 21, marginBottom: 32 }}>
                Email manzilingizni kiriting — parolni tiklash havolasini yuboramiz.
              </Text>

              {/* Email input */}
              <View style={{ marginBottom: 8 }}>
                <Text style={{ color: c.primary, fontSize: 11, fontWeight: "700", marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 }}>
                  Email manzil
                </Text>
                <View style={{
                  flexDirection: "row", alignItems: "center",
                  backgroundColor: c.bgCard,
                  borderRadius: 14, paddingHorizontal: 16,
                  borderWidth: 1.5,
                  borderColor: error ? c.danger : email.length > 0 && !isValid ? c.warn : isValid ? c.primary : c.border,
                  height: 56,
                }}>
                  <Ionicons
                    name="mail-outline"
                    size={18}
                    color={isValid ? c.primary : c.textMuted}
                    style={{ marginRight: 12 }}
                  />
                  <TextInput
                    style={{ flex: 1, fontSize: 15, color: c.text }}
                    placeholder="email@gmail.com"
                    placeholderTextColor={c.textMuted}
                    value={email}
                    onChangeText={(v) => { setEmail(v); setError(""); }}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    autoFocus
                  />
                  {email.length > 0 && (
                    <TouchableOpacity onPress={() => setEmail("")}>
                      <Ionicons name="close-circle" size={18} color={c.textMuted} />
                    </TouchableOpacity>
                  )}
                </View>
                {error ? (
                  <Text style={{ color: c.danger, fontSize: 12, marginTop: 6 }}>{error}</Text>
                ) : email.length > 0 && !isValid ? (
                  <Text style={{ color: c.warn, fontSize: 12, marginTop: 6 }}>To'g'ri email kiriting</Text>
                ) : null}
              </View>

              {/* Submit */}
              <TouchableOpacity
                onPress={handleSubmit}
                disabled={!isValid || loading}
                style={{
                  backgroundColor: isValid && !loading ? c.primary : c.bgMuted,
                  borderRadius: 14, height: 56,
                  alignItems: "center", justifyContent: "center",
                  flexDirection: "row", gap: 10,
                  marginTop: 20,
                  shadowColor: c.primary,
                  shadowOffset: { width: 0, height: 6 },
                  shadowOpacity: isValid && !loading ? 0.35 : 0,
                  shadowRadius: 10,
                  elevation: isValid && !loading ? 6 : 0,
                }}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Ionicons
                    name="send-outline"
                    size={18}
                    color={isValid ? "#fff" : c.textMuted}
                  />
                )}
                <Text style={{
                  color: isValid && !loading ? "#fff" : c.textMuted,
                  fontWeight: "800", fontSize: 16,
                }}>
                  {loading ? "Yuborilmoqda..." : "Havola yuborish"}
                </Text>
              </TouchableOpacity>

              {/* Back to login */}
              <TouchableOpacity
                onPress={() => router.back()}
                style={{ alignItems: "center", marginTop: 20, paddingVertical: 12 }}
              >
                <Text style={{ color: c.textMuted, fontSize: 13 }}>
                  Esladingizmi?{" "}
                  <Text style={{ color: c.primary, fontWeight: "700" }}>Kirishga qaytish</Text>
                </Text>
              </TouchableOpacity>

              {/* Info box */}
              <View style={{
                marginTop: 32, backgroundColor: c.bgCard,
                borderRadius: 16, padding: 16,
                borderWidth: 1.5, borderColor: c.border,
                flexDirection: "row", gap: 12,
              }}>
                <Ionicons name="information-circle-outline" size={20} color={c.primary} style={{ marginTop: 1 }} />
                <View style={{ flex: 1 }}>
                  <Text style={{ color: c.text, fontSize: 13, fontWeight: "700", marginBottom: 4 }}>
                    Email kelmasa nima qilish kerak?
                  </Text>
                  <Text style={{ color: c.textMuted, fontSize: 12, lineHeight: 18 }}>
                    Spam papkasini tekshiring. Yoki{" "}
                    <Text style={{ color: c.primary }}>support@savdo.uz</Text>
                    {" "}ga murojaat qiling.
                  </Text>
                </View>
              </View>
            </>
          ) : (
            /* ── Sent state ── */
            <View style={{ flex: 1, alignItems: "center", paddingTop: 40 }}>
              {/* Success icon */}
              <View style={{
                width: 100, height: 100, borderRadius: 30,
                backgroundColor: c.primary + "20",
                alignItems: "center", justifyContent: "center",
                marginBottom: 28,
              }}>
                <Ionicons name="checkmark-circle" size={52} color={c.primary} />
              </View>

              <Text style={{ color: c.text, fontSize: 26, fontWeight: "800", letterSpacing: -0.8, textAlign: "center", marginBottom: 12 }}>
                Email yuborildi!
              </Text>
              <Text style={{ color: c.textMuted, fontSize: 14, lineHeight: 22, textAlign: "center", marginBottom: 8, paddingHorizontal: 8 }}>
                <Text style={{ color: c.primary, fontWeight: "700" }}>{email}</Text>
                {"\n"}manziliga parolni tiklash havolasi yuborildi.
              </Text>
              <Text style={{ color: c.textMuted, fontSize: 13, textAlign: "center", marginBottom: 40 }}>
                Email 5 daqiqa ichida keladi.
              </Text>

              {/* Resend */}
              <TouchableOpacity
                onPress={() => setStep("input")}
                style={{
                  backgroundColor: c.bgCard, borderRadius: 14, height: 52,
                  alignItems: "center", justifyContent: "center",
                  flexDirection: "row", gap: 8,
                  borderWidth: 1.5, borderColor: c.border,
                  paddingHorizontal: 28, marginBottom: 14,
                }}
              >
                <Ionicons name="refresh-outline" size={16} color={c.primary} />
                <Text style={{ color: c.primary, fontWeight: "700", fontSize: 14 }}>
                  Qayta yuborish
                </Text>
              </TouchableOpacity>

              {/* Back to login */}
              <TouchableOpacity
                onPress={() => router.replace("/(auth)/login")}
                style={{
                  backgroundColor: c.primary, borderRadius: 14, height: 52,
                  alignItems: "center", justifyContent: "center",
                  flexDirection: "row", gap: 8,
                  paddingHorizontal: 32,
                  shadowColor: c.primary,
                  shadowOffset: { width: 0, height: 6 },
                  shadowOpacity: 0.35, shadowRadius: 10, elevation: 6,
                }}
              >
                <Ionicons name="arrow-back-outline" size={16} color="#fff" />
                <Text style={{ color: "#fff", fontWeight: "800", fontSize: 15 }}>
                  Kirishga qaytish
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
