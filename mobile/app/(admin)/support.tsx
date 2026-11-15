import { useMemo, useState } from "react";
import { View, Text } from "react-native";
import { Alert } from "@/utils/alert";
import { useTheme } from "@/hooks/useTheme";
import { useAT } from "@/i18n/admin";
import { adminApi, errText } from "@/services/adminApi";
import { ACard, AScreen, Btn, Chips, Empty, ErrorBox, Field, IconBtn, Loader, Pill, useLoad } from "@/components/admin/ui";

export default function AdminSupport() {
  const { c } = useTheme();
  const t = useAT();
  const items = useLoad(() => adminApi.support(), []);
  const [tab, setTab] = useState("all");
  const [texts, setTexts] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState<string | null>(null);

  const list = useMemo(() => {
    const all: any[] = (items.data as any)?.items || [];
    return tab === "all" ? all : all.filter((s) => s.status === tab);
  }, [items.data, tab]);

  async function send(s: any) {
    const text = (texts[s.id] || "").trim();
    if (!text) return;
    setBusyId(s.id);
    try {
      await adminApi.reply(s.id, text);
      Alert.toast(t.sent, "success");
      setTexts((x) => ({ ...x, [s.id]: "" }));
      items.reload();
    } catch (e: any) {
      Alert.alert(t.error, errText(e));
    } finally {
      setBusyId(null);
    }
  }

  function remove(s: any) {
    Alert.alert(t.delete, t.confirmDelete, [
      { text: t.cancel, style: "cancel" },
      {
        text: t.delete, style: "destructive",
        onPress: async () => {
          try { await adminApi.removeSupport(s.id); Alert.toast(t.deleted, "success"); items.reload(); }
          catch (e: any) { Alert.alert(t.error, errText(e)); }
        },
      },
    ]);
  }

  return (
    <AScreen title={t.supportTitle} sub={`${t.total}: ${list.length}`} onRefresh={items.refresh} refreshing={items.refreshing}>
      <Chips value={tab} onChange={setTab} options={[{ value: "all", label: t.tabAll }, { value: "open", label: t.tabOpen }, { value: "answered", label: t.tabAnswered }]} />
      {items.loading && !items.data ? <Loader /> : items.error ? <ErrorBox text={items.error} onRetry={items.reload} retryLabel={t.retry} /> : list.length === 0 ? <Empty text={t.empty} /> : (
        list.map((s) => (
          <ACard key={s.id}>
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8, gap: 8 }}>
              <Text style={{ color: c.text, fontWeight: "800" }} numberOfLines={1}>{s.name}</Text>
              <Text style={{ color: c.textMuted, fontSize: 12, flex: 1 }} numberOfLines={1}>{s.contact}</Text>
              <IconBtn name="trash-outline" hint={t.delete} onPress={() => remove(s)} color={c.danger} />
            </View>
            <View style={{ flexDirection: "row", gap: 8, marginBottom: 10 }}>
              <Pill text={s.source === "bot" ? t.srcBot : t.srcApp} tone="muted" />
              <Pill text={s.status === "answered" ? t.replied : t.open} tone={s.status === "answered" ? "ok" : "warn"} />
            </View>
            <Text style={{ color: c.text, fontSize: 15, lineHeight: 21 }}>{s.message}</Text>
            <Text style={{ color: c.textMuted, fontSize: 11, marginTop: 6 }}>{s.createdAt ? new Date(s.createdAt).toLocaleString() : ""}</Text>
            {!!s.adminReply && (
              <View style={{ marginTop: 10, padding: 10, borderRadius: 12, backgroundColor: c.bgMuted }}>
                <Text style={{ color: c.textSub, fontSize: 13 }}>{s.adminReply}</Text>
              </View>
            )}
            {s.status !== "answered" && (
              <View style={{ marginTop: 12 }}>
                <Field value={texts[s.id] || ""} onChangeText={(v) => setTexts((x) => ({ ...x, [s.id]: v }))} placeholder={t.reply} autoCapitalize="sentences" />
                <Btn label={t.send} icon="send" onPress={() => send(s)} disabled={busyId === s.id || !(texts[s.id] || "").trim()} small />
              </View>
            )}
          </ACard>
        ))
      )}
    </AScreen>
  );
}
