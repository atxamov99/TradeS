import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { database, employeesCollection } from "@/db";
import { useTheme } from "@/hooks/useTheme";
import { useT } from "@/hooks/useT";

type Role = "admin" | "cashier";

export default function AddEmployeeScreen() {
  const { c } = useTheme();
  const t = useT();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [pin, setPin] = useState("");
  const [role, setRole] = useState<Role>("cashier");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!name.trim()) { Alert.alert(t.common.error, t.employees.name); return; }
    if (pin.length !== 4) { Alert.alert(t.common.error, t.employees.pin); return; }
    setSaving(true);
    try {
      await database.write(async () => {
        await employeesCollection.create((e) => {
          e.name = name.trim();
          e.phone = phone.trim() || null;
          e.pin = pin;
          e.role = role;
        });
      });
      router.back();
    } catch {
      Alert.alert(t.common.error, t.common.saveError);
    } finally {
      setSaving(false);
    }
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: c.bg }} keyboardShouldPersistTaps="handled">
      <View style={{ backgroundColor: c.bg, paddingHorizontal: 16, paddingTop: 56, paddingBottom: 12 }}>
        <TouchableOpacity onPress={() => router.back()} style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
          <Ionicons name="chevron-back" size={20} color={c.primary} />
          <Text style={{ color: c.primary, fontWeight: "600" }}>{t.employees.cancel}</Text>
        </TouchableOpacity>
        <Text style={{ color: c.text, fontSize: 26, fontWeight: "800" }}>{t.employees.add}</Text>
      </View>

      <View style={{ paddingHorizontal: 16, gap: 14, paddingBottom: 40 }}>
        {/* Rol tanlash */}
        <View>
          <Text style={{ color: c.primaryDark, fontWeight: "700", marginBottom: 8 }}>{t.employees.role}</Text>
          <View style={{ flexDirection: "row", gap: 10 }}>
            {(["cashier", "admin"] as Role[]).map((r) => (
              <TouchableOpacity
                key={r}
                onPress={() => setRole(r)}
                style={{ flex: 1, paddingVertical: 12, borderRadius: 14, alignItems: "center", backgroundColor: role === r ? c.primary : c.bgMuted, borderWidth: 1, borderColor: role === r ? c.primary : c.border }}
              >
                <Ionicons name={r === "admin" ? "shield-checkmark" : "person"} size={20} color={role === r ? "#fff" : c.primaryDark} />
                <Text style={{ color: role === r ? "#fff" : c.primaryDark, fontWeight: "700", marginTop: 4 }}>
                  {r === "admin" ? t.employees.admin : t.employees.cashier}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {[
          { label: t.employees.name, value: name, setter: setName, placeholder: t.employees.namePlaceholder, numeric: false },
          { label: t.employees.phone, value: phone, setter: setPhone, placeholder: t.employees.phonePlaceholder, numeric: false },
          { label: t.employees.pin, value: pin, setter: (v: string) => setPin(v.slice(0, 4)), placeholder: t.employees.pinPlaceholder, numeric: true },
        ].map(({ label, value, setter, placeholder, numeric }) => (
          <View key={label}>
            <Text style={{ color: c.primaryDark, fontWeight: "700", marginBottom: 6 }}>{label}</Text>
            <TextInput
              style={{ backgroundColor: c.bgCard, borderWidth: 1.5, borderColor: c.border, borderRadius: 14, paddingHorizontal: 14, height: 50, fontSize: 15, color: c.text }}
              value={value}
              onChangeText={setter}
              placeholder={placeholder}
              placeholderTextColor={c.border}
              keyboardType={numeric ? "numeric" : "default"}
              secureTextEntry={label === t.employees.pin}
              maxLength={label === t.employees.pin ? 4 : undefined}
            />
          </View>
        ))}

        <TouchableOpacity
          style={{ backgroundColor: saving ? c.border : c.primary, borderRadius: 16, height: 56, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 8, marginTop: 8, shadowColor: c.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 8, elevation: 5 }}
          onPress={handleSave}
          disabled={saving}
        >
          <Ionicons name="save" size={20} color="#fff" />
          <Text style={{ color: "#fff", fontWeight: "800", fontSize: 17 }}>{saving ? "..." : t.employees.save}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
