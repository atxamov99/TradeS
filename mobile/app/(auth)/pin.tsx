import { useState, useRef, useEffect } from "react";
import { View, Text, TouchableOpacity, Alert } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useRoleStore } from "@/store/roleStore";
import { useT } from "@/hooks/useT";
import { useTheme } from "@/hooks/useTheme";

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "⌫"];

export default function PinScreen() {
  const [pin, setPin] = useState("");
  const [shake, setShake] = useState(false);
  const { setRole, verifyPIN } = useRoleStore();
  const t = useT();
  const { c } = useTheme();
  const shakeTimer = useRef<NodeJS.Timeout>();

  useEffect(() => {
    return () => clearTimeout(shakeTimer.current);
  }, []);

  function handleKey(k: string) {
    if (k === "⌫") {
      setPin((p) => p.slice(0, -1));
      return;
    }
    if (k === "" || pin.length >= 4) return;
    const next = pin + k;
    setPin(next);
    if (next.length === 4) {
      handleVerify(next);
    }
  }

  async function handleVerify(code: string) {
    const ok = await verifyPIN(code);
    if (ok) {
      await setRole("admin");
      router.back();
    } else {
      setShake(true);
      shakeTimer.current = setTimeout(() => {
        setPin("");
        setShake(false);
      }, 500);
      Alert.alert(t.employees.wrongPin);
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: c.bg, justifyContent: "center", paddingHorizontal: 40 }}>
      <TouchableOpacity
        onPress={() => router.back()}
        style={{ position: "absolute", top: 56, left: 20, flexDirection: "row", alignItems: "center" }}
      >
        <Ionicons name="chevron-back" size={20} color={c.primary} />
        <Text style={{ color: c.primary, fontWeight: "600", fontSize: 15 }}>{t.common.back}</Text>
      </TouchableOpacity>

      <View style={{ alignItems: "center", marginBottom: 48 }}>
        <View style={{ width: 80, height: 80, backgroundColor: c.primary + "20", borderRadius: 40, alignItems: "center", justifyContent: "center", marginBottom: 20 }}>
          <Ionicons name="lock-closed" size={36} color={c.primary} />
        </View>
        <Text style={{ color: c.text, fontSize: 24, fontWeight: "800" }}>{t.employees.enterPin}</Text>
        <Text style={{ color: c.textMuted, fontSize: 13, marginTop: 8, textAlign: "center" }}>
          {t.employees.pinDesc}
        </Text>
        <Text style={{ color: c.textMuted, fontSize: 11, marginTop: 4, opacity: 0.6 }}>
          {t.employees.defaultPinHint}
        </Text>
      </View>

      {/* PIN dots */}
      <View style={{ flexDirection: "row", justifyContent: "center", gap: 20, marginBottom: 48 }}>
        {[0, 1, 2, 3].map((i) => (
          <View
            key={i}
            style={{
              width: 18, height: 18, borderRadius: 9,
              backgroundColor: i < pin.length ? (shake ? c.danger : c.primary) : "transparent",
              borderWidth: 2,
              borderColor: i < pin.length ? (shake ? c.danger : c.primary) : c.border,
            }}
          />
        ))}
      </View>

      {/* Numpad */}
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 14, justifyContent: "center" }}>
        {KEYS.map((k, idx) => (
          <TouchableOpacity
            key={idx}
            onPress={() => handleKey(k)}
            disabled={k === ""}
            style={{
              width: 80, height: 80, borderRadius: 40,
              backgroundColor: k === "⌫" ? c.danger + "15" : k === "" ? "transparent" : c.bgCard,
              borderWidth: k === "" ? 0 : 1.5,
              borderColor: k === "⌫" ? c.danger + "40" : c.border,
              alignItems: "center", justifyContent: "center",
            }}
          >
            {k === "⌫" ? (
              <Ionicons name="backspace-outline" size={24} color={c.danger} />
            ) : k !== "" ? (
              <Text style={{ color: c.text, fontSize: 26, fontWeight: "700" }}>{k}</Text>
            ) : null}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}
