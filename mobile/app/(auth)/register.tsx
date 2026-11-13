import { useState } from "react";
import {
  View, Text, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, Linking, Image,
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
import { isPasswordValid } from "@/utils/passwordRules";
import { PasswordRules } from "@/components/PasswordRules";
import { OtpBoxes, OTP_LEN } from "@/components/OtpBoxes";
import { AuthBigButton as BigButton } from "@/components/AuthBigButton";
import { AuthField as Field } from "@/components/AuthField";

const BOT_URL = "https://t.me/trades_uz_bot?start=register";
const TG_BLUE = "#229ED9";

// Auth ekranlari eski ilovadagidek DOIM och (light) ko'rinadi — global dark tema majburlanmaydi.
const c = dark; // auth screens are always dark-green, exactly like the website

export default function RegisterScreen() {
  const a = useAuthText();
  const { setToken } = useAuthStore();
  const { setUser } = useUserStore();

  const [step, setStep] = useState<"form" | "connect" | "otp">("form");
  const [name, setName] = useState("");
  const [accountType, setAccountType] = useState<"USER" | "OWNER">("USER");
  const [shopName, setShopName] = useState("");
  const [method, setMethod] = useState<"phone" | "email">("phone");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const phoneDigits = phone.replace(/\D/g, "");
  const stepNum = step === "form" ? 1 : 2;

  const emailNorm = email.trim().toLowerCase();
  const contactLabel = method === "email" ? emailNorm : phone;

  const sendCode = async () => {
    setLoading(true);
    try {
      if (method === "email") {
        const res = await api.post("/auth/request-email-otp", { email: emailNorm });
        const dev = res.data?.data?.devCode;
        setCode(dev ? String(dev) : "");
        setStep("otp");
        // Email provider not configured on the server (dev mode): the server hands the code back — show it,
        // otherwise the flow is a dead end. Same behaviour as the website.
        if (dev) Alert.alert(a.devMode, a.devMsg + dev, undefined, "info");
        return;
      }
      await api.post("/auth/request-otp", { phone: cleanIdentifier(phone) });
      setCode("");
      setStep("otp");
    } catch (error: any) {
      if (error.response?.status === 428) setStep("connect");
      else Alert.alert(a.error, error.response?.data?.message || a.errReg);
    } finally {
      setLoading(false);
    }
  };

  const handleStart = () => {
    const contactOk = method === "email" ? /^\S+@\S+\.\S+$/.test(emailNorm) : phoneDigits.length >= 12;
    if (!name.trim() || !contactOk || !password || (accountType === "OWNER" && !shopName.trim())) {
      Alert.alert(a.error, method === "email" && !contactOk && email ? a.errEmail : a.errFillAll);
      return;
    }
    if (!isPasswordValid(password)) {
      Alert.alert(a.weakTitle, a.weakMsg, undefined, "warning");
      return;
    }
    sendCode();
  };

  const handleVerify = async () => {
    if (code.length !== OTP_LEN) return;
    setLoading(true);
    try {
      const res = await api.post(method === "email" ? "/auth/verify-email-otp" : "/auth/verify-otp", {
        ...(method === "email" ? { email: emailNorm } : { phone: cleanIdentifier(phone) }),
        code,
        name: name.trim(),
        password,
        accountType,
        ...(accountType === "OWNER" ? { shopName: shopName.trim() } : {}),
      });
      const data = res.data?.data ?? res.data;
      await setUser(data.user);
      await setToken(data.accessToken, data.refreshToken);
      // token o'zgarishi root _layout guard'ini ishga tushiradi → (app) ga o'tadi
    } catch (error: any) {
      Alert.alert(a.error, error.response?.data?.message || a.errReg);
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
          <Image source={require("@/assets/logo-dark.png")} style={{ width: 80, height: 80, marginBottom: 10 }} resizeMode="contain" />
          <Text style={{ fontSize: 26, fontWeight: "900", letterSpacing: -0.5, color: c.text }}>TradeS</Text>
        </View>

        {/* ── STEP 1: FORM ── */}
        {step === "form" && (
          <View style={{ backgroundColor: c.bgCard, borderRadius: 24, borderWidth: 1, borderColor: c.border, padding: 24 }}>
            <Text style={{ fontSize: 22, fontWeight: "800", marginBottom: 6, color: c.text }}>{a.signUp}</Text>
            <Text style={{ fontSize: 13, marginBottom: 16, lineHeight: 20, color: c.textMuted }}>
              {a.regSub}
            </Text>

            <View style={{ flexDirection: "row", backgroundColor: c.bgMuted, borderRadius: 14, padding: 4, marginBottom: 16 }}>
              {([
                { key: "phone", icon: "phone-portrait-outline", label: a.phone },
                { key: "email", icon: "mail-outline", label: "Email" },
              ] as const).map((tab) => {
                const active = method === tab.key;
                return (
                  <TouchableOpacity
                    key={tab.key}
                    activeOpacity={0.85}
                    onPress={() => { setMethod(tab.key); setCode(""); }}
                    style={{ flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, height: 40, borderRadius: 11, backgroundColor: active ? c.primary : "transparent" }}
                  >
                    <Ionicons name={tab.icon} size={16} color={active ? "#fff" : c.textMuted} />
                    <Text style={{ fontSize: 13, fontWeight: "800", color: active ? "#fff" : c.textMuted }}>{tab.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={{ fontSize: 12, fontWeight: "800", marginBottom: 8, color: c.textMuted, letterSpacing: 0.6 }}>{a.who}</Text>
            <View style={{ flexDirection: "row", gap: 10, marginBottom: 16 }}>
              {([
                { key: "USER", icon: "person-outline", title: a.roleUser, sub: a.roleUserSub },
                { key: "OWNER", icon: "storefront-outline", title: a.roleOwner, sub: a.roleOwnerSub },
              ] as const).map((o) => {
                const active = accountType === o.key;
                return (
                  <TouchableOpacity
                    key={o.key}
                    activeOpacity={0.8}
                    onPress={() => setAccountType(o.key)}
                    style={{ flex: 1, borderRadius: 16, borderWidth: 1.5, padding: 12, borderColor: active ? c.primary : c.border, backgroundColor: active ? c.bgMuted : c.bgCard }}
                  >
                    <Ionicons name={o.icon} size={18} color={active ? c.primary : c.textMuted} />
                    <Text style={{ fontSize: 13, fontWeight: "800", marginTop: 6, color: c.text }}>{o.title}</Text>
                    <Text style={{ fontSize: 11, marginTop: 2, lineHeight: 15, color: c.textMuted }}>{o.sub}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Field label={a.name} icon="person-outline" placeholder={a.namePh} value={name} onChangeText={setName} c={c} />
            {accountType === "OWNER" && (
              <Field label={a.shopName} icon="storefront-outline" placeholder={a.shopPh} value={shopName} onChangeText={setShopName} c={c} />
            )}
            {method === "phone" ? (
              <>
                <Field label={a.phone} icon="call-outline" placeholder="+998 90 123 45 67" value={phone} onChangeText={(txt) => setPhone(formatPhone(txt))} keyboardType="phone-pad" c={c} />

                <View style={{ flexDirection: "row", alignItems: "center", marginTop: -6, marginBottom: 16, paddingHorizontal: 2 }}>
                  <Ionicons name="paper-plane-outline" size={13} color={c.textMuted} />
                  <Text style={{ fontSize: 12, marginLeft: 6, flex: 1, color: c.textMuted }}>
                    {a.tgFree}
                  </Text>
                </View>
              </>
            ) : (
              <Field label={a.emailAddr} icon="mail-outline" placeholder="email@misol.com" value={email} onChangeText={setEmail} keyboardType="email-address" c={c} />
            )}

            <Field
              label={a.password} icon="lock-closed-outline" placeholder={a.passwordPh} value={password} onChangeText={setPassword}
              secure showSecure={showPassword} onToggleSecure={() => setShowPassword(!showPassword)} c={c}
            />
            <PasswordRules password={password} c={c} />

            <View style={{ height: 8 }} />
            <BigButton title={a.getCode} onPress={handleStart} loading={loading} color={c.primary} icon="arrow-forward" />

            <View style={{ flexDirection: "row", justifyContent: "center", alignItems: "center", marginTop: 20 }}>
              <Text style={{ color: c.textMuted, fontSize: 14 }}>{a.haveAcc}</Text>
              <TouchableOpacity onPress={() => router.replace("/login")}>
                <Text style={{ color: c.primary, fontSize: 14, fontWeight: "800" }}>{a.signIn}</Text>
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
            <Text style={{ fontSize: 22, fontWeight: "800", marginBottom: 6, color: c.text, textAlign: "center" }}>{a.connectTitle}</Text>
            <Text style={{ fontSize: 13, marginBottom: 22, lineHeight: 20, color: c.textMuted, textAlign: "center" }}>
              {a.connectSub}
            </Text>

            {[
              { icon: "paper-plane-outline" as const, text: a.step1 },
              { icon: "call-outline" as const, text: a.step2 },
              { icon: "key-outline" as const, text: a.step3 },
            ].map((s, i) => (
              <View key={i} style={{ flexDirection: "row", alignItems: "center", marginBottom: 14 }}>
                <View style={{ width: 28, height: 28, borderRadius: 9, alignItems: "center", justifyContent: "center", marginRight: 12, backgroundColor: c.primary + "22" }}>
                  <Ionicons name={s.icon} size={17} color={c.primary} />
                </View>
                <Text style={{ flex: 1, fontSize: 13, lineHeight: 19, color: c.text }}>{s.text}</Text>
              </View>
            ))}

            <View style={{ height: 8 }} />
            <BigButton title={a.openBot} onPress={() => Linking.openURL(BOT_URL)} color={TG_BLUE} icon="paper-plane" />
            <View style={{ height: 12 }} />
            <BigButton title={a.connected} onPress={sendCode} loading={loading} color={c.primary} icon="checkmark" />
          </View>
        )}

        {/* ── STEP 2b: OTP ── */}
        {step === "otp" && (
          <View style={{ backgroundColor: c.bgCard, borderRadius: 24, borderWidth: 1, borderColor: c.border, padding: 24 }}>
            <View style={{ width: 80, height: 80, borderRadius: 26, alignSelf: "center", alignItems: "center", justifyContent: "center", marginBottom: 18, backgroundColor: c.primary + "1F" }}>
              <Ionicons name="shield-checkmark" size={38} color={c.primary} />
            </View>
            <Text style={{ fontSize: 22, fontWeight: "800", marginBottom: 6, color: c.text, textAlign: "center" }}>{a.confirmTitle}</Text>
            <Text style={{ fontSize: 13, marginBottom: 6, lineHeight: 20, color: c.textMuted, textAlign: "center" }}>
              {method === "email" ? a.sentEmail : a.sentTg}
            </Text>
            <Text style={{ fontSize: 16, fontWeight: "800", textAlign: "center", marginBottom: 12, color: c.primary }}>{contactLabel}</Text>

            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", alignSelf: "center", paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20, marginBottom: 22, backgroundColor: TG_BLUE + "14" }}>
              <Ionicons name="paper-plane" size={14} color={TG_BLUE} />
              <Text style={{ fontSize: 12, marginLeft: 6, color: c.textMuted }}>{method === "email" ? a.pillEmail : a.pillTg}</Text>
            </View>

            <OtpBoxes value={code} onChange={setCode} c={c} />

            <View style={{ height: 24 }} />
            <BigButton title={a.confirm} onPress={handleVerify} loading={loading} disabled={code.length !== OTP_LEN} color={c.primary} icon="checkmark-circle" />

            <TouchableOpacity onPress={sendCode} disabled={loading} style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", marginTop: 18 }}>
              <Ionicons name="refresh" size={15} color={c.textMuted} />
              <Text style={{ color: c.textMuted, fontSize: 14, marginLeft: 6 }}>{a.resend}</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
      <AuthLangSwitch />
    </KeyboardAvoidingView>
  );
}
