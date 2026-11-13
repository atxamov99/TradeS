import { View, Text, TouchableOpacity } from "react-native";
import { useLangStore } from "@/store/langStore";
import { dark } from "@/theme/colors";

/** UZ / RU / EN chips in the corner of the auth screens (the website has the same language switch there). */
export function AuthLangSwitch() {
  const lang = useLangStore((s) => s.lang);
  const setLang = useLangStore((s) => s.setLang);
  const c = dark;
  return (
    <View
      style={{
        position: "absolute", top: 46, right: 16, zIndex: 20, flexDirection: "row", gap: 2, padding: 3,
        borderRadius: 14, backgroundColor: c.bgCard, borderWidth: 1, borderColor: c.border,
      }}
    >
      {(["uz", "ru", "en"] as const).map((l) => {
        const active = lang === l;
        return (
          <TouchableOpacity
            key={l}
            activeOpacity={0.8}
            onPress={() => setLang(l)}
            style={{ paddingHorizontal: 10, paddingVertical: 6, borderRadius: 11, backgroundColor: active ? c.primary : "transparent" }}
          >
            <Text style={{ fontSize: 12, fontWeight: "800", color: active ? "#052E16" : c.textSub }}>{l.toUpperCase()}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
