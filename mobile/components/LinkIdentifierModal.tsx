import { useEffect, useState } from "react";
import { Modal, View, Text, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform } from "react-native";
import { Alert } from "@/utils/alert";
import { api } from "@/services/api";
import { useUserStore } from "@/store/userStore";
import { useTheme } from "@/hooks/useTheme";
import { useT } from "@/hooks/useT";

/**
 * Link a phone to an account opened with an email (or an email to one opened with a phone).
 * Needs the current password + a code sent to the NEW phone (Telegram) / email, and the server refuses
 * an identifier that already belongs to another account. PATCH /users/profile can no longer change them.
 */
export default function LinkIdentifierModal({ kind, onClose }: { kind: "email" | "phone" | null; onClose: () => void }) {
  const { c } = useTheme();
  const t = useT();
  const user = useUserStore((s) => (s as any).user);
  const setUser = useUserStore((s) => (s as any).setUser);
  const [step, setStep] = useState<"form" | "code">("form");
  const [value, setValue] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [devCode, setDevCode] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (kind) { setStep("form"); setValue(""); setPassword(""); setCode(""); setDevCode(""); }
  }, [kind]);

  if (!kind) return null;
  const isEmail = kind === "email";
  const body = isEmail ? { email: value.trim().toLowerCase() } : { phone: value.trim() };

  function explain(e: any) {
    const st = e?.response?.status;
    const cd = e?.response?.data?.code;
    if (cd === "IDENTIFIER_TAKEN") return t.link.taken;
    if (cd === "INVALID_CREDENTIALS") return t.link.wrongPw;
    if (st === 428) return t.link.needBot;
    if (st === 429) return t.link.tooMany;
    return e?.response?.data?.message || t.link.error;
  }

  async function send() {
    setBusy(true);
    try {
      const res = await api.post(`/auth/link/${kind}/request`, { ...body, password });
      setDevCode(res.data?.data?.devCode || "");
      setStep("code");
      Alert.toast(isEmail ? t.link.sentEmail : t.link.sentPhone, "success");
    } catch (e: any) {
      Alert.alert(t.common.error, explain(e));
    } finally {
      setBusy(false);
    }
  }

  async function confirm() {
    setBusy(true);
    try {
      const res = await api.post(`/auth/link/${kind}/verify`, { ...body, code: code.trim() });
      const updated = res.data?.data?.user;
      if (updated) await setUser({ ...user, ...updated });
      Alert.toast(t.link.done, "success");
      onClose();
    } catch (e: any) {
      Alert.alert(t.common.error, explain(e));
    } finally {
      setBusy(false);
    }
  }

  const input = {
    backgroundColor: c.bgMuted, borderRadius: 14, paddingHorizontal: 14, height: 50, fontSize: 15, color: c.text,
    marginBottom: 12, borderWidth: 1, borderColor: c.border,
  } as const;

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.5)" }}>
        <View style={{ backgroundColor: c.bgCard, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 }}>
          <Text style={{ color: c.text, fontSize: 18, fontWeight: "800", marginBottom: 6 }}>{isEmail ? t.link.emailTitle : t.link.phoneTitle}</Text>
          <Text style={{ color: c.textMuted, fontSize: 12, marginBottom: 16 }}>{isEmail ? t.link.hintEmail : t.link.hintPhone}</Text>

          {step === "form" ? (
            <>
              <TextInput
                style={input}
                placeholder={isEmail ? t.link.newEmail : t.link.newPhone}
                placeholderTextColor={c.textMuted}
                value={value}
                onChangeText={setValue}
                keyboardType={isEmail ? "email-address" : "phone-pad"}
                autoCapitalize="none"
                autoCorrect={false}
                autoFocus
              />
              <TextInput
                style={input}
                placeholder={t.link.password}
                placeholderTextColor={c.textMuted}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
              />
            </>
          ) : (
            <>
              {!!devCode && <Text style={{ color: c.warn, fontSize: 12, marginBottom: 8 }}>{t.link.dev} {devCode}</Text>}
              <TextInput
                style={input}
                placeholder={t.link.code}
                placeholderTextColor={c.textMuted}
                value={code}
                onChangeText={(v) => setCode(v.replace(/[^0-9]/g, "").slice(0, 6))}
                keyboardType="number-pad"
                maxLength={6}
                autoFocus
              />
            </>
          )}

          <View style={{ flexDirection: "row", gap: 10 }}>
            <TouchableOpacity onPress={onClose} style={{ flex: 1, height: 50, borderRadius: 14, backgroundColor: c.bgMuted, alignItems: "center", justifyContent: "center" }}>
              <Text style={{ color: c.textSub, fontWeight: "700" }}>{t.link.cancel}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={step === "form" ? send : confirm}
              disabled={busy || (step === "form" ? !value.trim() || !password : code.length !== 6)}
              style={{ flex: 2, height: 50, borderRadius: 14, backgroundColor: c.primary, alignItems: "center", justifyContent: "center", opacity: busy ? 0.6 : 1 }}
            >
              {busy ? <ActivityIndicator color="#fff" /> : <Text style={{ color: "#fff", fontWeight: "800" }}>{step === "form" ? t.link.send : t.link.confirm}</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
