import { View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { PASSWORD_RULES } from "@/utils/passwordRules";
import { light } from "@/theme/colors";

/** Live checklist under the password field: each rule turns green when satisfied (like on the website). */
export function PasswordRules({ password, c }: { password: string; c: typeof light }) {
  if (!password) return null;
  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", marginTop: -8, marginBottom: 14 }}>
      {PASSWORD_RULES.map((r) => {
        const ok = r.test(password);
        return (
          <View key={r.label} style={{ width: "50%", flexDirection: "row", alignItems: "center", paddingVertical: 3 }}>
            <Ionicons name={ok ? "checkmark-circle" : "close-circle"} size={15} color={ok ? c.success : c.textMuted} />
            <Text style={{ marginLeft: 6, fontSize: 12, color: ok ? c.success : c.textMuted }}>{r.label}</Text>
          </View>
        );
      })}
    </View>
  );
}
