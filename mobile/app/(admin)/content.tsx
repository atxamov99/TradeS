import { useMemo, useState } from "react";
import { View, Text } from "react-native";
import { Alert } from "@/utils/alert";
import { useTheme } from "@/hooks/useTheme";
import { useAT } from "@/i18n/admin";
import { adminApi, errText } from "@/services/adminApi";
import { ACard, AScreen, Btn, Chips, Empty, ErrorBox, Field, IconBtn, Loader, Picker, Pill, Sheet, useLoad } from "@/components/admin/ui";

const TYPES = ["landing_page", "knowledge_base", "media_asset"];
const STATUSES = ["draft", "published", "archived"];
const empty = { name: "", type: "landing_page", status: "draft", owner: "", body: "" };

export default function AdminContent() {
  const { c } = useTheme();
  const t = useAT();
  const items = useLoad(() => adminApi.content(), []);
  const [filter, setFilter] = useState("all");
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState(empty);
  const [statusFor, setStatusFor] = useState<any | null>(null);
  const [newStatus, setNewStatus] = useState("draft");
  const [busy, setBusy] = useState(false);

  const list = useMemo(() => {
    const all: any[] = (items.data as any)?.content || [];
    return filter === "all" ? all : all.filter((x) => x.status === filter);
  }, [items.data, filter]);

  const stLabel = (s: string) => (s === "published" ? t.published : s === "archived" ? t.archived : t.draft);
  const tone = (s: string) => (s === "published" ? "ok" : s === "archived" ? "muted" : "warn");

  async function create() {
    if (!form.name.trim()) return;
    setBusy(true);
    try {
      await adminApi.createContent({ ...form, name: form.name.trim() });
      Alert.toast(t.saved, "success");
      setCreating(false);
      setForm(empty);
      items.reload();
    } catch (e: any) {
      Alert.alert(t.error, errText(e));
    } finally {
      setBusy(false);
    }
  }

  async function saveStatus() {
    if (!statusFor) return;
    setBusy(true);
    try {
      await adminApi.setContentStatus(statusFor.id, newStatus);
      Alert.toast(t.saved, "success");
      setStatusFor(null);
      items.reload();
    } catch (e: any) {
      Alert.alert(t.error, errText(e));
    } finally {
      setBusy(false);
    }
  }

  function remove(x: any) {
    Alert.alert(t.delete, `${x.name}\n${t.confirmDelete}`, [
      { text: t.cancel, style: "cancel" },
      {
        text: t.delete, style: "destructive",
        onPress: async () => {
          try { await adminApi.removeContent(x.id); Alert.toast(t.deleted, "success"); items.reload(); }
          catch (e: any) { Alert.alert(t.error, errText(e)); }
        },
      },
    ]);
  }

  return (
    <AScreen
      title={t.contentTitle}
      sub={`${t.total}: ${list.length}`}
      back
      onRefresh={items.refresh}
      refreshing={items.refreshing}
      right={<IconBtn name="add" hint={t.newContent} onPress={() => { setForm(empty); setCreating(true); }} color={c.primary} />}
    >
      <Chips value={filter} onChange={setFilter} options={[{ value: "all", label: t.tabAll }, ...STATUSES.map((s) => ({ value: s, label: stLabel(s) }))]} />
      {items.loading && !items.data ? <Loader /> : items.error ? <ErrorBox text={items.error} onRetry={items.reload} retryLabel={t.retry} /> : list.length === 0 ? <Empty text={t.empty} /> : (
        list.map((x) => (
          <ACard key={x.id}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: c.text, fontSize: 15, fontWeight: "800" }} numberOfLines={1}>{x.name}</Text>
                <Text style={{ color: c.textMuted, fontSize: 12 }}>{x.type} · {x.owner || "—"}</Text>
              </View>
              <IconBtn name="trash-outline" hint={t.delete} onPress={() => remove(x)} color={c.danger} />
            </View>
            <View style={{ marginTop: 10 }}>
              <Pill text={stLabel(x.status)} tone={tone(x.status) as any} onPress={() => { setStatusFor(x); setNewStatus(x.status || "draft"); }} />
            </View>
            {!!x.body && <Text style={{ color: c.textSub, marginTop: 10, fontSize: 13 }} numberOfLines={3}>{x.body}</Text>}
          </ACard>
        ))
      )}

      <Sheet
        visible={creating}
        title={t.newContent}
        onClose={() => setCreating(false)}
        footer={<><View style={{ flex: 1 }}><Btn label={t.cancel} tone="ghost" onPress={() => setCreating(false)} /></View><View style={{ flex: 2 }}><Btn label={t.create} onPress={create} disabled={busy || !form.name.trim()} /></View></>}
      >
        <Field label={t.name} value={form.name} onChangeText={(v) => setForm({ ...form, name: v })} autoCapitalize="sentences" />
        <Picker label={t.contentType} value={form.type} onChange={(v) => setForm({ ...form, type: v })} options={TYPES.map((x) => ({ value: x, label: x }))} />
        <Picker label={t.contentStatus} value={form.status} onChange={(v) => setForm({ ...form, status: v })} options={STATUSES.map((x) => ({ value: x, label: stLabel(x) }))} />
        <Field label={t.owner} value={form.owner} onChangeText={(v) => setForm({ ...form, owner: v })} autoCapitalize="words" />
        <Field label={t.body} value={form.body} onChangeText={(v) => setForm({ ...form, body: v })} multiline autoCapitalize="sentences" />
      </Sheet>

      <Sheet
        visible={!!statusFor}
        title={t.contentStatus}
        onClose={() => setStatusFor(null)}
        footer={<><View style={{ flex: 1 }}><Btn label={t.cancel} tone="ghost" onPress={() => setStatusFor(null)} /></View><View style={{ flex: 2 }}><Btn label={t.save} onPress={saveStatus} disabled={busy} /></View></>}
      >
        {!!statusFor && <Text style={{ color: c.textSub, marginBottom: 12 }}>{statusFor.name}</Text>}
        <Picker label={t.contentStatus} value={newStatus} onChange={setNewStatus} options={STATUSES.map((x) => ({ value: x, label: stLabel(x) }))} />
      </Sheet>
    </AScreen>
  );
}
