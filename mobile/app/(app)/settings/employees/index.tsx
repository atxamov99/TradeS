import { View, Text, FlatList, TouchableOpacity, Alert } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useEmployees } from "@/hooks/useEmployees";
import { useTheme } from "@/hooks/useTheme";
import { useT } from "@/hooks/useT";
import { database } from "@/db";

export default function EmployeesScreen() {
  const { c } = useTheme();
  const t = useT();
  const employees = useEmployees();

  function handleDelete(emp: any) {
    Alert.alert(t.employees.delete, `${emp.name} ${t.employees.deleteConfirm}`, [
      { text: t.employees.cancel, style: "cancel" },
      {
        text: t.employees.delete, style: "destructive",
        onPress: async () => {
          await database.write(async () => { await emp.destroyPermanently(); });
        },
      },
    ]);
  }

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <View style={{ backgroundColor: c.bg, paddingHorizontal: 20, paddingTop: 56, paddingBottom: 12 }}>
        <TouchableOpacity onPress={() => router.back()} style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
          <Ionicons name="chevron-back" size={20} color={c.primary} />
          <Text style={{ color: c.primary, fontWeight: "600" }}>{t.common.back}</Text>
        </TouchableOpacity>
        <Text style={{ color: c.text, fontSize: 28, fontWeight: "800" }}>{t.employees.title}</Text>
      </View>

      <FlatList
        data={employees}
        keyExtractor={(e) => e.id}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100, paddingTop: 8 }}
        ListEmptyComponent={
          <View style={{ alignItems: "center", paddingTop: 80 }}>
            <Ionicons name="people" size={52} color={c.border} style={{ marginBottom: 12 }} />
            <Text style={{ color: c.textMuted, fontSize: 16, fontWeight: "600" }}>{t.employees.noEmployees}</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={{ backgroundColor: c.bgCard, borderRadius: 18, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: c.border, flexDirection: "row", alignItems: "center" }}>
            <View style={{ width: 44, height: 44, backgroundColor: item.role === "admin" ? "#EDE9FE" : c.bgMuted, borderRadius: 22, alignItems: "center", justifyContent: "center", marginRight: 12 }}>
              <Ionicons name={item.role === "admin" ? "shield-checkmark" : "person"} size={22} color={item.role === "admin" ? "#7C3AED" : c.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: c.text, fontWeight: "800", fontSize: 16 }}>{item.name}</Text>
              <Text style={{ color: c.textMuted, fontSize: 13, marginTop: 2 }}>
                {item.role === "admin" ? t.employees.admin : t.employees.cashier}
                {item.phone ? ` · ${item.phone}` : ""}
              </Text>
            </View>
            <TouchableOpacity onPress={() => handleDelete(item)} style={{ padding: 8 }}>
              <Ionicons name="trash" size={18} color={c.danger} />
            </TouchableOpacity>
          </View>
        )}
      />

      <TouchableOpacity
        style={{ position: "absolute", bottom: 28, right: 20, backgroundColor: c.primary, width: 58, height: 58, borderRadius: 29, alignItems: "center", justifyContent: "center", shadowColor: c.primary, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 10, elevation: 8, zIndex: 10 }}
        onPress={() => router.push("/settings/employees/add")}
      >
        <Ionicons name="add" size={30} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}
