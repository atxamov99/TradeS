import { View, Text, TextInput, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { light } from "@/theme/colors";

/** Auth ekranlaridagi (login/register/parol tiklash) standart matn kiritish maydoni. */
export function AuthField({
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
  c: typeof light;
}) {
  return (
    <View style={{ marginBottom: 16 }}>
      {label ? (
        <Text style={{ fontSize: 12, fontWeight: "600", color: c.textSub, marginBottom: 6 }}>{label}</Text>
      ) : null}
      <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: c.bg, borderRadius: 12, paddingHorizontal: 16, borderWidth: 1, borderColor: c.border, height: 50 }}>
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
