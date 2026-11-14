import { useCallback, useEffect, useState } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { Alert } from "@/utils/alert";
import { api } from "@/services/api";
import { useRoleStore } from "@/store/roleStore";
import { useTheme } from "@/hooks/useTheme";
import { useT } from "@/hooks/useT";

/**
 * "You were invited to a shop": Accept / Decline. Nobody becomes an employee until they accept here
 * (or on the website). After accepting, the role is re-read from the server so the menu updates.
 */
export default function InviteCards() {
  const { c } = useTheme();
  const t = useT();
  const [invites, setInvites] = useState<any[]>([]);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await api.get("/shops/invites/mine");
      setInvites(res.data?.data?.invites || []);
    } catch {
      // offline / not signed in: simply show nothing
    }
  }, []);

  useEffect(() => { load(); }, [load]);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  async function answer(id: string, accept: boolean) {
    setBusy(id);
    try {
      await api.post(`/shops/invites/${id}/${accept ? "accept" : "decline"}`);
      Alert.toast(accept ? t.team.accepted : t.team.declined, "success");
      if (accept) {
        await useRoleStore.getState().refresh(async () => (await api.get("/auth/me")).data.data);
      }
    } catch (e: any) {
      Alert.alert("Xatolik", e?.response?.data?.message || t.team.invError);
    } finally {
      setBusy(null);
      await load();
    }
  }

  if (!invites.length) return null;

  return (
    <View style={{ marginHorizontal: 16, marginTop: 14, gap: 10 }}>
      {invites.map((inv) => (
        <View key={inv.id} style={{ padding: 14, borderRadius: 18, borderWidth: 1, borderColor: c.primary, backgroundColor: c.bgCard }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <Ionicons name="mail-unread-outline" size={22} color={c.primary} />
            <View style={{ flex: 1 }}>
              <Text style={{ color: c.text, fontSize: 14, fontWeight: "700" }}>
                {t.team.invText.replace("{shop}", inv.shop?.name || "")}
              </Text>
              <Text style={{ color: c.textMuted, fontSize: 12, marginTop: 2 }}>
                {t.team.invFrom}: {inv.invitedBy?.name || "—"}
              </Text>
            </View>
          </View>
          <View style={{ flexDirection: "row", gap: 10, marginTop: 12 }}>
            <TouchableOpacity
              onPress={() => answer(inv.id, true)}
              disabled={busy === inv.id}
              style={{ flex: 1, height: 42, borderRadius: 12, alignItems: "center", justifyContent: "center", backgroundColor: c.primary, opacity: busy === inv.id ? 0.5 : 1 }}
            >
              <Text style={{ color: "#fff", fontWeight: "800" }}>{t.team.accept}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => answer(inv.id, false)}
              disabled={busy === inv.id}
              style={{ flex: 1, height: 42, borderRadius: 12, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: c.border, opacity: busy === inv.id ? 0.5 : 1 }}
            >
              <Text style={{ color: c.textSub, fontWeight: "700" }}>{t.team.decline}</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}
    </View>
  );
}
