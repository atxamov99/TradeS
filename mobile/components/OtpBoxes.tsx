import { useRef, useEffect } from "react";
import { View, Text, TextInput, Pressable, AppState } from "react-native";
import { light } from "@/theme/colors";

export const OTP_LEN = 6;

/** Segmented OTP input (6 boxes, single hidden field) — register va parol tiklashda ishlatiladi. */
export function OtpBoxes({ value, onChange, c }: { value: string; onChange: (v: string) => void; c: typeof light }) {
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
