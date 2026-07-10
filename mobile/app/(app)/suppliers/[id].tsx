import { useState } from "react";
import { View, Text, FlatList, TouchableOpacity, TextInput, Alert, Modal } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { database, suppliersCollection, supplierTxCollection } from "@/db";
import { useSupplier, useSupplierTransactions } from "@/hooks/useSuppliers";
import { useTheme } from "@/hooks/useTheme";
import { useT } from "@/hooks/useT";

export default function SupplierDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { c } = useTheme();
  const t = useT();
  const supplier = useSupplier(id);
  const transactions = useSupplierTransactions(id);

  const [modalType, setModalType] = useState<"debt" | "payment" | null>(null);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  if (!supplier) return (
    <View style={{ flex: 1, backgroundColor: c.bg, alignItems: "center", justifyContent: "center" }}>
      <Ionicons name="hourglass" size={32} color={c.border} />
    </View>
  );

  async function handleTransaction() {
    if (!modalType || !amount || Number(amount) <= 0) return;
    setSaving(true);
    try {
      const delta = modalType === "debt" ? Number(amount) : -Number(amount);
      await database.write(async () => {
        await supplierTxCollection.create((tx) => {
          tx.supplierId = supplier.id;
          tx.supplierName = supplier.name;
          tx.amount = Number(amount);
          tx.type = modalType;
          tx.note = note.trim() || null;
          tx.date = Date.now();
        });
        await supplier.update((s) => {
          s.debt = Math.max(0, s.debt + delta);
        });
      });
      setModalType(null);
      setAmount("");
      setNote("");
    } catch {
      Alert.alert(t.common.error, t.common.saveError);
    } finally {
      setSaving(false);
    }
  }

  function handleDelete() {
    Alert.alert(t.suppliers.delete, `${supplier.name} ${t.suppliers.deleteConfirm}`, [
      { text: t.suppliers.cancel, style: "cancel" },
      {
        text: t.suppliers.delete, style: "destructive",
        onPress: async () => {
          await database.write(async () => { await supplier.destroyPermanently(); });
          router.back();
        },
      },
    ]);
  }

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <View style={{ backgroundColor: c.primary, paddingHorizontal: 20, paddingTop: 56, paddingBottom: 28, borderBottomLeftRadius: 28, borderBottomRightRadius: 28 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <TouchableOpacity onPress={() => router.back()} style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
            <Ionicons name="chevron-back" size={20} color="rgba(255,255,255,0.8)" />
            <Text style={{ color: "rgba(255,255,255,0.8)", fontWeight: "600" }}>{t.suppliers.back}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleDelete}>
            <Ionicons name="trash" size={20} color="rgba(255,255,255,0.7)" />
          </TouchableOpacity>
        </View>
        <Text style={{ color: "#fff", fontSize: 26, fontWeight: "800" }}>{supplier.name}</Text>
        {supplier.phone && <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 14, marginTop: 4 }}>{supplier.phone}</Text>}
        <View style={{ marginTop: 16, backgroundColor: "rgba(255,255,255,0.18)", borderRadius: 16, padding: 16 }}>
          <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 12, fontWeight: "600" }}>{t.suppliers.totalDebt.toUpperCase()}</Text>
          <Text style={{ color: "#fff", fontSize: 32, fontWeight: "800", marginTop: 4 }}>{supplier.debt.toLocaleString()} so'm</Text>
        </View>
      </View>

      <View style={{ flexDirection: "row", gap: 12, paddingHorizontal: 20, marginTop: 16, marginBottom: 8 }}>
        <TouchableOpacity
          onPress={() => setModalType("debt")}
          style={{ flex: 1, backgroundColor: "#FEF3C7", borderRadius: 14, padding: 14, alignItems: "center", flexDirection: "row", justifyContent: "center", gap: 6, borderWidth: 1, borderColor: "#FDE68A" }}
        >
          <Ionicons name="add-circle" size={18} color={c.warn} />
          <Text style={{ color: c.warn, fontWeight: "700" }}>{t.suppliers.addDebt}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setModalType("payment")}
          style={{ flex: 1, backgroundColor: c.bgMuted, borderRadius: 14, padding: 14, alignItems: "center", flexDirection: "row", justifyContent: "center", gap: 6, borderWidth: 1, borderColor: c.border }}
        >
          <Ionicons name="remove-circle" size={18} color={c.primary} />
          <Text style={{ color: c.primary, fontWeight: "700" }}>{t.suppliers.payment}</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={transactions}
        keyExtractor={(tx) => tx.id}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
        ListHeaderComponent={
          <Text style={{ color: c.textMuted, fontSize: 11, fontWeight: "700", letterSpacing: 1.5, marginBottom: 8, marginTop: 4 }}>{t.suppliers.history.toUpperCase()}</Text>
        }
        ListEmptyComponent={
          <View style={{ alignItems: "center", paddingVertical: 32 }}>
            <Ionicons name="document-text" size={36} color={c.border} style={{ marginBottom: 8 }} />
            <Text style={{ color: c.textMuted }}>{t.suppliers.noTransactions}</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={{ backgroundColor: c.bgCard, borderRadius: 14, padding: 14, marginBottom: 8, flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderWidth: 1, borderColor: c.border }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10, flex: 1 }}>
              <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: item.type === "debt" ? "#FEF3C7" : c.bgMuted, alignItems: "center", justifyContent: "center" }}>
                <Ionicons name={item.type === "debt" ? "arrow-up" : "arrow-down"} size={16} color={item.type === "debt" ? c.warn : c.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: c.text, fontWeight: "700", fontSize: 14 }}>{item.type === "debt" ? t.suppliers.debt : t.suppliers.payment}</Text>
                {item.note && <Text style={{ color: c.textMuted, fontSize: 12 }}>{item.note}</Text>}
                <Text style={{ color: c.textMuted, fontSize: 11, marginTop: 2 }}>{new Date(item.date).toLocaleDateString()}</Text>
              </View>
            </View>
            <Text style={{ color: item.type === "debt" ? c.warn : c.primary, fontWeight: "800", fontSize: 15 }}>
              {item.type === "debt" ? "+" : "-"}{item.amount.toLocaleString()} so'm
            </Text>
          </View>
        )}
      />

      <Modal visible={!!modalType} transparent animationType="slide">
        <View style={{ flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.5)" }}>
          <View style={{ backgroundColor: c.bgCard, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 }}>
            <Text style={{ color: c.text, fontSize: 18, fontWeight: "800", marginBottom: 16 }}>
              {modalType === "debt" ? t.suppliers.addDebt : t.suppliers.addPayment}
            </Text>
            <TextInput
              style={{ backgroundColor: c.bgMuted, borderRadius: 14, paddingHorizontal: 14, height: 56, fontSize: 24, fontWeight: "800", color: c.text, marginBottom: 12, borderWidth: 1, borderColor: c.border, textAlign: "center" }}
              placeholder="0"
              placeholderTextColor={c.textMuted}
              keyboardType="numeric"
              value={amount}
              onChangeText={setAmount}
              autoFocus
            />
            <TextInput
              style={{ backgroundColor: c.bgMuted, borderRadius: 14, paddingHorizontal: 14, height: 46, fontSize: 14, color: c.text, marginBottom: 16, borderWidth: 1, borderColor: c.border }}
              placeholder={t.suppliers.commentPlaceholder}
              placeholderTextColor={c.textMuted}
              value={note}
              onChangeText={setNote}
            />
            <View style={{ flexDirection: "row", gap: 10 }}>
              <TouchableOpacity onPress={() => { setModalType(null); setAmount(""); setNote(""); }} style={{ flex: 1, height: 50, borderRadius: 14, backgroundColor: c.bgMuted, alignItems: "center", justifyContent: "center" }}>
                <Text style={{ color: c.textSub, fontWeight: "700" }}>{t.suppliers.cancel}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleTransaction} disabled={saving} style={{ flex: 2, height: 50, borderRadius: 14, backgroundColor: modalType === "debt" ? c.warn : c.primary, alignItems: "center", justifyContent: "center" }}>
                <Text style={{ color: "#fff", fontWeight: "800" }}>{saving ? "..." : t.suppliers.save}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
