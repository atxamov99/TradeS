import { View, Text, TouchableOpacity } from "react-native";
import { useTheme } from "@/hooks/useTheme";
import { useT } from "@/hooks/useT";
import { router } from "expo-router";

export function PremiumBanner() {
  const { c } = useTheme();
  const t = useT();

  return (
    <TouchableOpacity
      onPress={() => router.push("/settings/subscription")}
      activeOpacity={0.85}
      style={{
        marginHorizontal: 16,
        marginTop: 12,
        backgroundColor: "#0D2F1A",
        borderRadius: 18,
        padding: 14,
        borderWidth: 1,
        borderColor: "rgba(66,199,90,0.2)",
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
      }}
    >
      <View style={{
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: "rgba(66,199,90,0.15)",
        alignItems: "center",
        justifyContent: "center",
      }}>
        <Text style={{ fontSize: 20 }}>💎</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ color: "#FFFFFF", fontWeight: "700", fontSize: 13 }}>
          {t.subscription.pro}
        </Text>
        <Text style={{ color: c.textMuted, fontSize: 11, marginTop: 1 }}>
          {t.subscription.upgrade}
        </Text>
      </View>
      <View style={{
        backgroundColor: c.primary,
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 6,
      }}>
        <Text style={{ color: "#07120B", fontWeight: "800", fontSize: 11 }}>
          {t.subscription.upgrade}
        </Text>
      </View>
    </TouchableOpacity>
  );
}
