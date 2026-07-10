import { View, Text } from "react-native";
import { Sale } from "@/db/models/Sale";
import { useTheme } from "@/hooks/useTheme";

export function SaleCard({ sale }: { sale: Sale }) {
  const { c } = useTheme();
  return (
    <View style={{ backgroundColor: c.bgCard, borderRadius: 16, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: c.border, flexDirection: "row", alignItems: "center" }}>
      <View style={{ width: 42, height: 42, backgroundColor: c.bgMuted, borderRadius: 12, alignItems: "center", justifyContent: "center", marginRight: 12 }}>
        <Text style={{ fontSize: 20 }}>📦</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ color: c.text, fontWeight: "700", fontSize: 14 }}>{sale.productName}</Text>
        <Text style={{ color: c.textMuted, fontSize: 12, marginTop: 2 }}>
          {sale.qty} × {sale.sellPrice.toLocaleString()} so'm
        </Text>
      </View>
      <View style={{ alignItems: "flex-end" }}>
        <Text style={{ color: c.primary, fontWeight: "800", fontSize: 14 }}>+{sale.profit.toLocaleString()}</Text>
        <Text style={{ color: c.textMuted, fontSize: 11, marginTop: 2 }}>
          {new Date(sale.soldAt).toLocaleTimeString("uz", { hour: "2-digit", minute: "2-digit" })}
        </Text>
      </View>
    </View>
  );
}
