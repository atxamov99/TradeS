import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { database, customersCollection, customerTxCollection } from "@/db";
import { useTheme } from "@/hooks/useTheme";
import { useT } from "@/hooks/useT";

export default function AddCustomerScreen() {
  const { c } = useTheme();
  const t = useT();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [debt, setDebt] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!name.trim()) { Alert.alert(t.common.error, t.customers.name); return; }
    setSaving(true);
    try {
      await database.write(async () => {
        const customer = await customersCollection.create((s) => {
          s.name = name.trim();
          s.phone = phone.trim() || null;
          s.debt = Number(debt) || 0;
          s.notes = notes.trim() || null;
        });
        if (Number(debt) > 0) {
          await customerTxCollection.create((tx) => {
            tx.customerId = customer.id;
            tx.customerName = customer.name;
            tx.amount = Number(debt);
            tx.type = "debt";
            tx.note = t.customers.initialDebt;
            tx.date = Date.now();
          });
        }
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
          <Text style={{ color: c.primary, fontWeight: "600" }}>{t.customers.cancel}</Text>
        </TouchableOpacity>
        <Text style={{ color: c.text, fontSize: 26, fontWeight: "800" }}>{t.customers.add}</Text>
      </View>

      <View style={{ paddingHorizontal: 16, gap: 14, paddingBottom: 40 }}>
        {[
          { label: t.customers.name, value: name, setter: setName, placeholder: t.customers.namePlaceholder, numeric: false },
          { label: t.customers.phone, value: phone, setter: setPhone, placeholder: t.customers.phonePlaceholder, numeric: false },
          { label: t.customers.initialDebtLabel, value: debt, setter: setDebt, placeholder: "0", numeric: true },
          { label: t.customers.notes, value: notes, setter: setNotes, placeholder: t.customers.notesPlaceholder, numeric: false },
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
            />
          </View>
        ))}

        <TouchableOpacity
          style={{ backgroundColor: saving ? c.border : c.primary, borderRadius: 16, height: 56, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 8, marginTop: 8, shadowColor: c.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 8, elevation: 5 }}
          onPress={handleSave}
          disabled={saving}
        >
          <Ionicons name="save" size={20} color="#fff" />
          <Text style={{ color: "#fff", fontWeight: "800", fontSize: 17 }}>{saving ? "..." : t.customers.save}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
