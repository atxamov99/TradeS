import { useState } from "react";
import { View, Text } from "react-native";
import { Alert } from "@/utils/alert";
import { useTheme } from "@/hooks/useTheme";
import { useUserStore } from "@/store/userStore";
import { useAT } from "@/i18n/admin";
import { adminApi, errText } from "@/services/adminApi";
import { ACard, AScreen, Avatar, Btn, Empty, ErrorBox, Field, IconBtn, Loader, Picker, Pill, Sheet, useLoad } from "@/components/admin/ui";

const emptyForm = { name: "", email: "", phone: "", password: "" };

export default function AdminAdmins() {
  const { c } = useTheme();
  const t = useAT();
  const me = useUserStore((s) => (s as any).user);
  const admins = useLoad(() => adminApi.admins(), []);
  const list: any[] = (admins.data as any)?.users || [];
  const mainAdminId = (admins.data as any)?.mainAdminId;
  const iAmMain = !!me?.id && me.id === mainAdminId;

  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [roleFor, setRoleFor] = useState<any | null>(null);
  const [kind, setKind] = useState("USER");
  const [shopId, setShopId] = useState("");
  const [shops, setShops] = useState<any[]>([]);
  const [busy, setBusy] = useState(false);

  async function create() {
    const body: any = { name: form.name.trim(), password: form.password, role: "ADMIN" };
    if (form.email.trim()) body.email = form.email.trim().toLowerCase();
    if (form.phone.trim()) body.phone = form.phone.trim();
    if (!body.name || !body.password) return;
    if (!body.email && !body.phone) { Alert.alert(t.error, t.contactNeeded); return; }
    setBusy(true);
    try {
      await adminApi.createUser(body);
      Alert.toast(t.saved, "success");
      setCreating(false);
      setForm(emptyForm);
      admins.reload();
    } catch (e: any) {
      Alert.alert(t.error, errText(e));
    } finally {
      setBusy(false);
    }
  }

  async function toggle(a: any) {
    try { await adminApi.toggleAdmin(a.id); admins.reload(); } catch (e: any) { Alert.alert(t.error, errText(e)); }
  }

  function revoke(a: any) {
    Alert.alert(t.revoke, `${a.name}\n${t.revokeHint}`, [
      { text: t.cancel, style: "cancel" },
      {
        text: t.revoke, style: "destructive",
        onPress: async () => {
          try { await adminApi.setKind(a.id, { kind: "USER" }); Alert.toast(t.roleSaved, "success"); admins.reload(); }
          catch (e: any) { Alert.alert(t.error, errText(e)); }
        },
      },
    ]);
  }

  async function openRole(a: any) {
    setRoleFor(a);
    setKind("ADMIN");
    setShopId("");
    setShops(await adminApi.shops().catch(() => []));
  }
  async function saveRole() {
    if (!roleFor || (kind === "CASHIER" && !shopId)) return;
    setBusy(true);
    try {
      await adminApi.setKind(roleFor.id, kind === "CASHIER" ? { kind, shopId } : { kind });
      Alert.toast(t.roleSaved, "success");
      setRoleFor(null);
      admins.reload();
    } catch (e: any) {
      Alert.alert(t.error, errText(e));
    } finally {
      setBusy(false);
    }
  }

  const kindOptions = [
    { value: "USER", label: t.kindUSER }, { value: "DIRECTOR", label: t.kindDIRECTOR }, { value: "CASHIER", label: t.kindCASHIER }, { value: "ADMIN", label: t.kindADMIN },
  ];

  return (
    <AScreen
      title={t.adminsTitle}
      sub={iAmMain ? undefined : t.onlyMain}
      back
      onRefresh={admins.refresh}
      refreshing={admins.refreshing}
      right={iAmMain ? <IconBtn name="person-add-outline" hint={t.newAdmin} color={c.primary} onPress={() => setCreating(true)} /> : undefined}
    >
      {admins.loading && !admins.data ? <Loader /> : admins.error ? <ErrorBox text={admins.error} onRetry={admins.reload} retryLabel={t.retry} /> : list.length === 0 ? <Empty text={t.empty} /> : (
        list.map((a) => {
          const isMain = a.id === mainAdminId;
          const isMe = a.id === me?.id;
          return (
            <ACard key={a.id}>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Avatar name={a.name} />
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                    <Text style={{ color: c.text, fontSize: 15, fontWeight: "800" }} numberOfLines={1}>{a.name}</Text>
                    {isMain && <Pill text={t.mainAdmin} tone="ok" />}
                    {isMe && <Pill text={t.you} tone="muted" />}
                  </View>
                  <Text style={{ color: c.textMuted, fontSize: 12 }} numberOfLines={1}>{a.phone || a.email || "—"}</Text>
                </View>
                <Pill text={a.isBlocked ? t.blocked : t.active} tone={a.isBlocked ? "danger" : "ok"} />
              </View>
              <View style={{ flexDirection: "row", alignItems: "center", marginTop: 12, gap: 8 }}>
                {isMain || !iAmMain ? (
                  <Text style={{ color: c.textMuted, fontSize: 12 }}>{isMain ? t.protectedAdmin : "—"}</Text>
                ) : (
                  <>
                    <Pill text={t.kindADMIN} tone="info" onPress={() => openRole(a)} />
                    <View style={{ flex: 1 }} />
                    <IconBtn name={a.isBlocked ? "lock-open-outline" : "ban-outline"} hint={a.isBlocked ? t.unblock : t.block} onPress={() => toggle(a)} color={a.isBlocked ? c.primary : c.warn} />
                    <IconBtn name="person-remove-outline" hint={t.revoke} onPress={() => revoke(a)} color={c.danger} />
                  </>
                )}
              </View>
            </ACard>
          );
        })
      )}

      <Sheet
        visible={creating}
        title={t.newAdmin}
        onClose={() => setCreating(false)}
        footer={<><View style={{ flex: 1 }}><Btn label={t.cancel} tone="ghost" onPress={() => setCreating(false)} /></View><View style={{ flex: 2 }}><Btn label={t.create} onPress={create} disabled={busy || !form.name.trim() || !form.password} /></View></>}
      >
        <Field label={t.name} value={form.name} onChangeText={(v) => setForm({ ...form, name: v })} autoCapitalize="words" />
        <Field label={t.email} value={form.email} onChangeText={(v) => setForm({ ...form, email: v })} keyboardType="email-address" />
        <Field label={t.phone} value={form.phone} onChangeText={(v) => setForm({ ...form, phone: v })} keyboardType="phone-pad" />
        <Field label={t.password} value={form.password} onChangeText={(v) => setForm({ ...form, password: v })} secureTextEntry />
      </Sheet>

      <Sheet
        visible={!!roleFor}
        title={t.changeRole}
        onClose={() => setRoleFor(null)}
        footer={<><View style={{ flex: 1 }}><Btn label={t.cancel} tone="ghost" onPress={() => setRoleFor(null)} /></View><View style={{ flex: 2 }}><Btn label={t.save} onPress={saveRole} disabled={busy || (kind === "CASHIER" && !shopId)} /></View></>}
      >
        {!!roleFor && <Text style={{ color: c.textSub, marginBottom: 12 }}>{roleFor.name}</Text>}
        <Picker label={t.role} value={kind} options={kindOptions} onChange={(v) => { setKind(v); setShopId(""); }} />
        <Text style={{ color: c.textMuted, fontSize: 12, marginBottom: 12 }}>{(t as any)["hint" + kind]}</Text>
        {kind === "CASHIER" && (
          shops.length === 0
            ? <Text style={{ color: c.danger, fontSize: 12 }}>{t.noShops}</Text>
            : <Picker label={t.pickShop} value={shopId} onChange={setShopId} options={shops.map((s) => ({ value: s.id, label: s.name, sub: s.ownerName }))} />
        )}
      </Sheet>
    </AScreen>
  );
}
