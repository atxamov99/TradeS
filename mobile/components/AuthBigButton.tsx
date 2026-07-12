import { TouchableOpacity, Text, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";

/** Auth ekranlaridagi (login/register/parol tiklash) standart katta tugma. */
export function AuthBigButton({ title, onPress, loading, disabled, color, textColor = "#fff", icon }: {
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
