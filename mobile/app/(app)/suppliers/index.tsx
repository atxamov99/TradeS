import { View, Text, FlatList, TouchableOpacity, TextInput } from "react-native";
import { useState } from "react";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSuppliers } from "@/hooks/useSuppliers";
import { useTheme } from "@/hooks/useTheme";
import { useT } from "@/hooks/useT";

export default function SuppliersScreen() {
  const { c } = useTheme();
  const t = useT();
  const suppliers = useSuppliers();
  const [search, setSearch] = useState("");

  const filtered = suppliers.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase())
  );
  const totalDebt = suppliers.reduce((sum, s) => sum + s.debt, 0);

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <View style={{ backgroundColor: c.bg, paddingHorizontal: 20, paddingTop: 56, paddingBottom: 12 }}>
        <TouchableOpacity onPress={() => router.back()} style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
          <Ionicons name="chevron-back" size={20} color={c.primary} />
          <Text style={{ color: c.primary, fontWeight: "600" }}>{t.common.back}</Text>
        </TouchableOpacity>
        <Text style={{ color: c.text, fontSize: 28, fontWeight: "800" }}>{t.suppliers.title}</Text>

        {totalDebt > 0 && (
          <View style={{ backgroundColor: c.bgCard, borderRadius: 14, padding: 14, marginTop: 12, flexDirection: "row", alignItems: "center", gap: 10, borderWidth: 1, borderColor: c.border }}>
            <Ionicons name="wallet" size={20} color={c.warn} />
            <View>
              <Text style={{ color: c.textMuted, fontSize: 11, fontWeight: "600" }}>{t.suppliers.totalDebt.toUpperCase()}</Text>
              <Text style={{ color: c.warn, fontWeight: "800", fontSize: 18 }}>{totalDebt.toLocaleString()} so'm</Text>
            </View>
          </View>
        )}

        <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: c.bgCard, borderRadius: 14, paddingHorizontal: 14, borderWidth: 1, borderColor: c.border, marginTop: 12 }}>
          <Ionicons name="search" size={17} color={c.textMuted} />
          <TextInput
            style={{ flex: 1, height: 46, marginLeft: 10, fontSize: 15, color: c.text }}
            placeholder={t.suppliers.search}
            placeholderTextColor={c.textMuted}
            value={search}
            onChangeText={setSearch}
          />
        </View>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(s) => s.id}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100, paddingTop: 8 }}
        ListEmptyComponent={
          <View style={{ alignItems: "center", paddingTop: 80 }}>
            <Ionicons name="business" size={52} color={c.border} style={{ marginBottom: 12 }} />
            <Text style={{ color: c.textMuted, fontSize: 16, fontWeight: "600" }}>{t.suppliers.noSuppliers}</Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={{ backgroundColor: c.bgCard, borderRadius: 18, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: item.debt > 0 ? c.warn : c.border }}
            onPress={() => router.push(`/suppliers/${item.id}`)}
          >
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 12, flex: 1 }}>
                <View style={{ width: 44, height: 44, backgroundColor: item.debt > 0 ? "#FEF3C7" : c.bgMuted, borderRadius: 22, alignItems: "center", justifyContent: "center" }}>
                  <Ionicons name="person" size={22} color={item.debt > 0 ? c.warn : c.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: c.text, fontWeight: "800", fontSize: 16 }}>{item.name}</Text>
                  {item.phone && <Text style={{ color: c.textMuted, fontSize: 13, marginTop: 2 }}>{item.phone}</Text>}
                </View>
              </View>
              <View style={{ alignItems: "flex-end" }}>
                {item.debt > 0 ? (
                  <>
                    <Text style={{ color: c.textMuted, fontSize: 11, fontWeight: "600" }}>{t.suppliers.debt.toUpperCase()}</Text>
                    <Text style={{ color: c.warn, fontWeight: "800", fontSize: 15 }}>{item.debt.toLocaleString()} so'm</Text>
                  </>
                ) : (
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                    <Ionicons name="checkmark-circle" size={16} color={c.primary} />
                    <Text style={{ color: c.primary, fontWeight: "700", fontSize: 13 }}>{t.suppliers.debtFree}</Text>
                  </View>
                )}
              </View>
            </View>
          </TouchableOpacity>
        )}
      />

      <TouchableOpacity
        style={{ position: "absolute", bottom: 28, right: 20, backgroundColor: c.primary, width: 58, height: 58, borderRadius: 29, alignItems: "center", justifyContent: "center", shadowColor: c.primary, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 10, elevation: 8, zIndex: 10 }}
        onPress={() => router.push("/suppliers/add")}
      >
        <Ionicons name="add" size={30} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}
