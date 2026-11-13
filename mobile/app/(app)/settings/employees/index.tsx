import { useCallback, useEffect, useState } from "react";
import { View, Text, FlatList, TouchableOpacity, TextInput, ActivityIndicator } from "react-native";
import { Alert } from "@/utils/alert";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { api } from "@/services/api";
import { useUserStore } from "@/store/userStore";
import { useTheme } from "@/hooks/useTheme";
import { useT } from "@/hooks/useT";

type Member = { userId?: string; role: string; user?: { id: string; name?: string; phone?: string; email?: string } };

/**
 * Employees = shop members on the SERVER (same as the website's Employees page): the owner adds an already
 * registered person as a cashier by phone/email, and can remove them. Replaces the old local-only list.
 */
export default function EmployeesScreen() {
  const { c } = useTheme();
  const t = useT();
  const me = useUserStore((s) => (s as any).user);

  const [loading, setLoading] = useState(true);
  const [shop, setShop] = useState<{ id: string; name: string } | null>(null);
  const [personal, setPersonal] = useState(false);
  const [members, setMembers] = useState<Member[]>([]);
  const [identifier, setIdentifier] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/shops");
      const shops = res.data?.data?.shops || res.data?.data || [];
      const owned = (Array.isArray(shops) ? shops : []).find((s: any) => s.myRole === "OWNER");
      setShop(owned ? { id: owned.id, name: owned.name } : null);
      setPersonal(false);
      if (owned) {
        try {
          const m = await api.get(`/shops/${owned.id}/members`);
          setMembers(m.data?.data?.members || m.data?.data || []);
        } catch (e: any) {
          if (e?.response?.status === 409) setPersonal(true); // personal (solo) shop: no employees until upgraded
          else throw e;
        }
      }
    } catch (e: any) {
      Alert.alert("Xatolik", e?.response?.data?.message || t.team.loadError);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function add() {
    const value = identifier.trim();
    if (!value || !shop) return;
    const phoneLike = /^[+\d][\d\s]{6,}$/.test(value);
    setBusy(true);
    try {
      await api.post(`/shops/${shop.id}/members`, phoneLike ? { phone: value } : { email: value.toLowerCase() });
      Alert.toast(t.team.added, "success");
      setIdentifier("");
      await load();
    } catch (e: any) {
      const st = e?.response?.status;
      Alert.alert("Xatolik", st === 404 ? t.team.notRegistered : st === 409 ? t.team.already : e?.response?.data?.message || t.team.addError);
    } finally {
      setBusy(false);
    }
  }

  function remove(m: Member) {
    const uid = m.user?.id || m.userId;
    if (!shop || !uid) return;
    Alert.alert(t.team.remove, t.team.confirmRemove, [
      { text: t.team.cancel, style: "cancel" },
      {
        text: t.team.remove, style: "destructive",
        onPress: async () => {
          try {
            await api.delete(`/shops/${shop.id}/members/${uid}`);
            Alert.toast(t.team.removed, "success");
            await load();
          } catch (e: any) {
            Alert.alert("Xatolik", e?.response?.data?.message || t.team.addError);
          }
        },
      },
    ]);
  }

  const header = (
    <View style={{ backgroundColor: c.bg, paddingHorizontal: 20, paddingTop: 56, paddingBottom: 12 }}>
      <TouchableOpacity onPress={() => router.back()} style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
        <Ionicons name="chevron-back" size={20} color={c.primary} />
        <Text style={{ color: c.primary, fontWeight: "600" }}>{t.common.back}</Text>
      </TouchableOpacity>
      <Text style={{ color: c.text, fontSize: 28, fontWeight: "800" }}>{t.team.title}{shop ? ` — ${shop.name}` : ""}</Text>
    </View>
  );

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: c.bg }}>
        {header}
        <ActivityIndicator color={c.primary} style={{ marginTop: 40 }} />
      </View>
    );
  }

  if (!shop || personal) {
    return (
      <View style={{ flex: 1, backgroundColor: c.bg }}>
        {header}
        <View style={{ margin: 20, padding: 18, borderRadius: 18, borderWidth: 1, borderColor: c.border, backgroundColor: c.bgCard, flexDirection: "row", gap: 12 }}>
          <Ionicons name="storefront-outline" size={22} color={c.textMuted} />
          <Text style={{ flex: 1, fontSize: 14, lineHeight: 21, color: c.textSub }}>{personal ? t.team.personal : t.team.noShop}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <FlatList
        data={members}
        keyExtractor={(m) => String(m.user?.id || m.userId)}
        ListHeaderComponent={
          <View>
            {header}
            <Text style={{ paddingHorizontal: 20, fontSize: 13, lineHeight: 19, color: c.textMuted }}>{t.team.sub}</Text>
            <View style={{ flexDirection: "row", gap: 8, paddingHorizontal: 20, marginTop: 14, marginBottom: 12 }}>
              <TextInput
                value={identifier}
                onChangeText={setIdentifier}
                placeholder={t.team.ph}
                placeholderTextColor={c.textMuted}
                autoCapitalize="none"
                autoCorrect={false}
                style={{ flex: 1, height: 48, borderRadius: 14, borderWidth: 1, borderColor: c.border, backgroundColor: c.bgCard, paddingHorizontal: 14, fontSize: 15, color: c.text }}
              />
              <TouchableOpacity
                onPress={add}
                disabled={busy || !identifier.trim()}
                style={{ height: 48, paddingHorizontal: 18, borderRadius: 14, alignItems: "center", justifyContent: "center", backgroundColor: c.primary, opacity: busy || !identifier.trim() ? 0.5 : 1 }}
              >
                {busy ? <ActivityIndicator color="#fff" /> : <Text style={{ color: "#fff", fontWeight: "800" }}>{t.team.add}</Text>}
              </TouchableOpacity>
            </View>
          </View>
        }
        contentContainerStyle={{ paddingBottom: 100 }}
        ListEmptyComponent={<Text style={{ textAlign: "center", color: c.textMuted, paddingTop: 30 }}>{t.team.empty}</Text>}
        renderItem={({ item }) => {
          const uid = item.user?.id || item.userId;
          const isOwner = item.role === "OWNER";
          return (
            <View style={{ marginHorizontal: 20, marginBottom: 10, padding: 14, borderRadius: 18, borderWidth: 1, borderColor: c.border, backgroundColor: c.bgCard, flexDirection: "row", alignItems: "center" }}>
              <View style={{ width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center", marginRight: 12, backgroundColor: c.bgMuted }}>
                <Ionicons name={isOwner ? "shield-checkmark" : "person"} size={21} color={isOwner ? c.primary : c.textSub} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: c.text, fontSize: 16, fontWeight: "700" }}>{item.user?.name || "—"}</Text>
                <Text style={{ color: c.textMuted, fontSize: 13, marginTop: 2 }}>{item.user?.phone || item.user?.email || "—"}</Text>
              </View>
              <Text style={{ color: isOwner ? c.primary : c.textSub, fontSize: 12, fontWeight: "800", marginRight: 8 }}>{isOwner ? t.team.owner : t.team.cashier}</Text>
              {!isOwner && uid !== (me as any)?.id && (
                <TouchableOpacity onPress={() => remove(item)} hitSlop={10}>
                  <Ionicons name="trash-outline" size={20} color={c.danger} />
                </TouchableOpacity>
              )}
            </View>
          );
        }}
      />
    </View>
  );
}
