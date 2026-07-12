import { useState } from "react";
import {
  View, Text, TouchableOpacity, Alert,
  ScrollView, KeyboardAvoidingView, Platform, Linking,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { api } from "@/services/api";
import { light } from "@/theme/colors";
import { formatPhone, cleanIdentifier } from "@/utils/phone";
import { OtpBoxes, OTP_LEN } from "@/components/OtpBoxes";
import { AuthBigButton as BigButton } from "@/components/AuthBigButton";
import { AuthField as Field } from "@/components/AuthField";

const BOT_URL = "https://t.me/trades_uz_bot?start=reset";
const TG_BLUE = "#229ED9";

// Auth ekranlari doim och (light) ko'rinadi — global dark tema majburlanmaydi.
const c = light;

type Method = "phone" | "email";
type PhoneStep = "form" | "connect" | "otp";

export default function ForgotPasswordScreen() {
  const [method, setMethod] = useState<Method>("phone");

  // ── Telefon oqimi (asosiy) ──
  const [phoneStep, setPhoneStep] = useState<PhoneStep>("form");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

  // ── Email oqimi (ixtiyoriy) ──
  const [email, setEmail] = useState("");
  const [emailSent, setEmailSent] = useState(false);
  const [emailLoading, setEmailLoading] = useState(false);

  const phoneDigits = phone.replace(/\D/g, "");

  const sendPhoneCode = async () => {
    setLoading(true);
    try {
      await api.post("/auth/forgot-password", { phone: cleanIdentifier(phone) });
      setCode("");
      setPhoneStep("otp");
    } catch (error: any) {
      if (error.response?.status === 428) setPhoneStep("connect");
      else Alert.alert("Xatolik", error.response?.data?.message || "Kod yuborishda xatolik");
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneStart = () => {
    if (phoneDigits.length < 12 || password.trim().length < 6) {
      Alert.alert("Xatolik", "Telefon raqam va kamida 6 belgili yangi parolni to'g'ri kiriting");
      return;
    }
    sendPhoneCode();
  };

  const handlePhoneVerify = async () => {
    if (code.length !== OTP_LEN) return;
    setLoading(true);
    try {
      await api.post("/auth/reset-password", {
        phone: cleanIdentifier(phone),
        code,
        password: password.trim(),
      });
      Alert.alert("Tayyor", "Parol muvaffaqiyatli yangilandi. Endi yangi parolingiz bilan kiring.", [
        { text: "OK", onPress: () => router.replace("/login") },
      ]);
    } catch (error: any) {
      Alert.alert("Xatolik", error.response?.data?.message || "Kodni tasdiqlashda xatolik");
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSubmit = async () => {
    const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
    if (!isValid) {
      Alert.alert("Xatolik", "To'g'ri email manzil kiriting");
      return;
    }
    setEmailLoading(true);
    try {
      await api.post("/auth/forgot-password", { email: email.trim().toLowerCase() });
    } catch {
      // tarmoq/server xatosi bo'lsa ham xuddi shu generic xabar — akkaunt mavjudligini oshkor qilmaymiz
    } finally {
      setEmailLoading(false);
    }
    setEmailSent(true);
  };

  const goBack = () => {
    if (method === "phone") {
      if (phoneStep === "form") router.back();
      else setPhoneStep("form");
    } else {
      if (emailSent) setEmailSent(false);
      else router.back();
    }
  };

  const showMethodSwitch = (method === "phone" && phoneStep === "form") || (method === "email" && !emailSent);

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView
        style={{ flex: 1, backgroundColor: c.bg }}
        contentContainerStyle={{ flexGrow: 1, justifyContent: "center", paddingHorizontal: 22, paddingVertical: 36 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Top bar: back */}
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 20 }}>
          <TouchableOpacity onPress={goBack} activeOpacity={0.7} style={{ width: 42, height: 42, borderRadius: 14, borderWidth: 1, borderColor: c.border, alignItems: "center", justifyContent: "center" }}>
            <Ionicons name="arrow-back" size={20} color={c.text} />
          </TouchableOpacity>
        </View>

        {/* Icon + Title */}
        <View style={{ alignItems: "center", marginBottom: 20 }}>
          <View style={{ width: 68, height: 68, borderRadius: 22, backgroundColor: c.primary + "20", alignItems: "center", justifyContent: "center", marginBottom: 14 }}>
            <Ionicons name="lock-open-outline" size={32} color={c.primary} />
          </View>
          <Text style={{ fontSize: 24, fontWeight: "800", color: c.text }}>Parolni tiklash</Text>
        </View>

        {/* Telefon / Email tanlovi — faqat boshlang'ich holatda ko'rinadi */}
        {showMethodSwitch && (
          <View style={{ flexDirection: "row", backgroundColor: c.bgMuted, borderRadius: 14, padding: 4, marginBottom: 20 }}>
            <TouchableOpacity
              onPress={() => setMethod("phone")}
              style={{ flex: 1, paddingVertical: 10, borderRadius: 11, backgroundColor: method === "phone" ? c.primary : "transparent", alignItems: "center" }}
            >
              <Text style={{ color: method === "phone" ? "#fff" : c.textSub, fontWeight: "700", fontSize: 13 }}>Telefon</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setMethod("email")}
              style={{ flex: 1, paddingVertical: 10, borderRadius: 11, backgroundColor: method === "email" ? c.primary : "transparent", alignItems: "center" }}
            >
              <Text style={{ color: method === "email" ? "#fff" : c.textSub, fontWeight: "700", fontSize: 13 }}>Email</Text>
            </TouchableOpacity>
          </View>
        )}

        {method === "phone" ? (
          <>
            {/* ── FORM: telefon + yangi parol ── */}
            {phoneStep === "form" && (
              <View style={{ backgroundColor: c.bgCard, borderRadius: 24, borderWidth: 1, borderColor: c.border, padding: 24 }}>
                <Text style={{ fontSize: 13, marginBottom: 20, lineHeight: 20, color: c.textMuted }}>
                  Telefon raqamingiz va yangi parolni kiriting — tasdiqlash kodi Telegram orqali keladi.
                </Text>
                <Field
                  label="Telefon" icon="call-outline" placeholder="+998 90 123 45 67"
                  value={phone} onChangeText={(t) => setPhone(formatPhone(t))} keyboardType="phone-pad" c={c}
                />
                <Field
                  label="Yangi parol" icon="lock-closed-outline" placeholder="Kamida 6 ta belgi"
                  value={password} onChangeText={setPassword}
                  secure showSecure={showPassword} onToggleSecure={() => setShowPassword(!showPassword)} c={c}
                />
                <View style={{ height: 8 }} />
                <BigButton title="Kod olish" onPress={handlePhoneStart} loading={loading} color={c.primary} icon="arrow-forward" />
              </View>
            )}

            {/* ── CONNECT: Telegram ulanmagan bo'lsa ── */}
            {phoneStep === "connect" && (
              <View style={{ backgroundColor: c.bgCard, borderRadius: 24, borderWidth: 1, borderColor: c.border, padding: 24 }}>
                <View style={{ width: 80, height: 80, borderRadius: 26, alignSelf: "center", alignItems: "center", justifyContent: "center", marginBottom: 18, backgroundColor: TG_BLUE + "1F" }}>
                  <Ionicons name="paper-plane" size={38} color={TG_BLUE} />
                </View>
                <Text style={{ fontSize: 20, fontWeight: "800", marginBottom: 6, color: c.text, textAlign: "center" }}>
                  Telegram'ni ulang
                </Text>
                <Text style={{ fontSize: 13, marginBottom: 22, lineHeight: 20, color: c.textMuted, textAlign: "center" }}>
                  Parol tiklash kodi bepul — Telegram orqali keladi. Avval raqamingizni botga ulang.
                </Text>
                <BigButton title="Telegram botni ochish" onPress={() => Linking.openURL(BOT_URL)} color={TG_BLUE} icon="paper-plane" />
                <View style={{ height: 12 }} />
                <BigButton title="Uladim — kod yuborish" onPress={sendPhoneCode} loading={loading} color={c.primary} icon="checkmark" />
              </View>
            )}

            {/* ── OTP: kod tasdiqlash ── */}
            {phoneStep === "otp" && (
              <View style={{ backgroundColor: c.bgCard, borderRadius: 24, borderWidth: 1, borderColor: c.border, padding: 24 }}>
                <View style={{ width: 80, height: 80, borderRadius: 26, alignSelf: "center", alignItems: "center", justifyContent: "center", marginBottom: 18, backgroundColor: c.primary + "1F" }}>
                  <Ionicons name="shield-checkmark" size={38} color={c.primary} />
                </View>
                <Text style={{ fontSize: 20, fontWeight: "800", marginBottom: 6, color: c.text, textAlign: "center" }}>
                  Tasdiqlash kodi
                </Text>
                <Text style={{ fontSize: 13, marginBottom: 6, lineHeight: 20, color: c.textMuted, textAlign: "center" }}>
                  Telegram'ga yuborilgan 6 xonali kod
                </Text>
                <Text style={{ fontSize: 16, fontWeight: "800", textAlign: "center", marginBottom: 16, color: c.primary }}>{phone}</Text>

                <OtpBoxes value={code} onChange={setCode} c={c} />

                <View style={{ height: 24 }} />
                <BigButton
                  title="Parolni tiklash" onPress={handlePhoneVerify} loading={loading}
                  disabled={code.length !== OTP_LEN} color={c.primary} icon="checkmark-circle"
                />
                <TouchableOpacity onPress={sendPhoneCode} disabled={loading} style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", marginTop: 18 }}>
                  <Ionicons name="refresh" size={15} color={c.textMuted} />
                  <Text style={{ color: c.textMuted, fontSize: 14, marginLeft: 6 }}>Kodni qayta yuborish</Text>
                </TouchableOpacity>
              </View>
            )}
          </>
        ) : (
          /* ── EMAIL OQIMI ── */
          <View style={{ backgroundColor: c.bgCard, borderRadius: 24, borderWidth: 1, borderColor: c.border, padding: 24 }}>
            {!emailSent ? (
              <>
                <Text style={{ fontSize: 13, marginBottom: 20, lineHeight: 20, color: c.textMuted }}>
                  Email manzilingizni kiriting — parolni tiklash havolasini yuboramiz.
                </Text>
                <Field
                  label="Email" icon="mail-outline" placeholder="email@gmail.com"
                  value={email} onChangeText={setEmail} keyboardType="email-address" c={c}
                />
                <View style={{ height: 8 }} />
                <BigButton title="Havola yuborish" onPress={handleEmailSubmit} loading={emailLoading} color={c.primary} icon="send-outline" />
              </>
            ) : (
              <View style={{ alignItems: "center" }}>
                <Ionicons name="checkmark-circle" size={52} color={c.primary} style={{ marginBottom: 16 }} />
                <Text style={{ fontSize: 18, fontWeight: "800", color: c.text, textAlign: "center", marginBottom: 8 }}>
                  Email yuborildi
                </Text>
                <Text style={{ fontSize: 13, color: c.textMuted, textAlign: "center", marginBottom: 20, lineHeight: 20 }}>
                  <Text style={{ color: c.primary, fontWeight: "700" }}>{email}</Text> manziliga tiklash havolasi yuborildi (5 daqiqa amal qiladi).
                </Text>
                <BigButton title="Kirishga qaytish" onPress={() => router.replace("/login")} color={c.primary} icon="arrow-back-outline" />
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
