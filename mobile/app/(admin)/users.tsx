import { useMemo, useState } from "react";
import { View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Alert } from "@/utils/alert";
import { useTheme } from "@/hooks/useTheme";
import { useUserStore } from "@/store/userStore";
import { useAT } from "@/i18n/admin";
import { adminApi, errText } from "@/services/adminApi";
import { ACard, AScreen, Avatar, Btn, Chips, Empty, ErrorBox, Field, IconBtn, Loader, Picker, Pill, SearchBar, Sheet, useLoad } from "@/components/admin/ui";

type Kind = "USER" | "DIRECTOR" | "CASHIER" | "ADMIN";
const emptyForm = { name: "", email: "", phone: "", password: "" };

export default function AdminUsers() {
  const { c } = useTheme();
  const t = useAT();
  const me = useUserStore((s) => (s as any).user);
  const users = useLoad(() => adminApi.users(), []);
  const admins = useLoad(() => adminApi.admins(), []);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("all");

  const [roleFor, setRoleFor] = useState<any | null>(null);
  const [kind, setKind] = useState<Kind>("USER");
  const [shopId, setShopId] = useState("");
  const [shops, setShops] = useState<any[]>([]);
  const [formFor, setFormFor] = useState<"new" | any | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [busy, setBusy] = useState(false);

  const mainAdminId = (admins.data as any)?.mainAdminId;
  const iAmMain = !!me?.id && me.id === mainAdminId;

  const list = useMemo(() => {
    const all: any[] = ((users.data as any)?.users || []).filter((u: any) => u.role !== "ADMIN");
    const s = q.trim().toLowerCase();
    return all.filter((u) => {
      if (filter === "blocked" && !u.isBlocked) return false;
      if (filter === "active" && u.isBlocked) return false;
      return !s || [u.name, u.email, u.phone].join(" ").toLowerCase().includes(s);
    });
  }, [users.data, q, filter]);

  const kindLabel = (k: string) => (t as any)["kind" + k] || k;

  async function openRole(u: any) {
    setRoleFor(u);
    setKind((u.accountKind || "USER") as Kind);
    setShopId("");
    setShops(await adminApi.shops().catch(() => []));
  }
  async function saveRole() {
    if (!roleFor) return;
    if (kind === "CASHIER" && !shopId) return;
    setBusy(true);
    try {
      await adminApi.setKind(roleFor.id, kind === "CASHIER" ? { kind, shopId } : { kind });
      Alert.toast(t.roleSaved, "success");
      setRoleFor(null);
      users.reload();
      admins.reload();
    } catch (e: any) {
      Alert.alert(t.error, errText(e));
    } finally {
      setBusy(false);
    }
  }

  function openForm(u: any | "new") {
    setFormFor(u);
    setForm(u === "new" ? emptyForm : { name: u.name || "", email: u.email || "", phone: u.phone || "", password: "" });
  }
  async function saveForm() {
    const body: any = { name: form.name.trim() };
    if (form.email.trim()) body.email = form.email.trim().toLowerCase();
    if (form.phone.trim()) body.phone = form.phone.trim();
    if (form.password) body.password = form.password;
    if (!body.name) return;
    if (formFor === "new" && !body.email && !body.phone) { Alert.alert(t.error, t.contactNeeded); return; }
    setBusy(true);
    try {
      if (formFor === "new") await adminApi.createUser({ ...body, role: "USER" });
      else await adminApi.updateUser(formFor.id, { ...body, role: "USER" });
      Alert.toast(t.saved, "success");
      setFormFor(null);
      users.reload();
    } catch (e: any) {
      Alert.alert(t.error, errText(e));
    } finally {
      setBusy(false);
    }
  }

  async function toggleBlock(u: any) {
    try {
      if (u.isBlocked) await adminApi.unblockUser(u.id); else await adminApi.blockUser(u.id);
      users.reload();
    } catch (e: any) {
      Alert.alert(t.error, errText(e));
    }
  }
  function remove(u: any) {
    Alert.alert(t.delete, `${u.name}\n${t.confirmDelete}`, [
      { text: t.cancel, style: "cancel" },
      {
        text: t.delete, style: "destructive",
        onPress: async () => {
          try { await adminApi.removeUser(u.id); Alert.toast(t.deleted, "success"); users.reload(); }
          catch (e: any) { Alert.alert(t.error, errText(e)); }
        },
      },
    ]);
  }

  const kindOptions: { value: string; label: string }[] = [
    { value: "USER", label: t.kindUSER }, { value: "DIRECTOR", label: t.kindDIRECTOR }, { value: "CASHIER", label: t.kindCASHIER },
    ...(iAmMain ? [{ value: "ADMIN", label: t.kindADMIN }] : []),
  ];

  return (
    <AScreen
      title={t.usersTitle}
      sub={`${t.total}: ${list.length}`}
      onRefresh={() => { users.refresh(); admins.refresh(); }}
      refreshing={users.refreshing}
      right={<IconBtn name="add" hint={t.newUser} onPress={() => openForm("new")} color={c.primary} />}
    >
      <SearchBar value={q} onChangeText={setQ} placeholder={t.search} />
      <Chips value={filter} onChange={setFilter} options={[{ value: "all", label: t.tabAll }, { value: "active", label: t.active }, { value: "blocked", label: t.blocked }]} />

      {users.loading && !users.data ? <Loader /> : users.error ? <ErrorBox text={users.error} onRetry={users.reload} retryLabel={t.retry} /> : list.length === 0 ? <Empty text={t.empty} /> : (
        list.map((u) => {
          const k = u.accountKind || "USER";
          return (
            <ACard key={u.id}>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Avatar name={u.name} />
                <View style={{ flex: 1 }}>
                  <Text style={{ color: c.text, fontSize: 15, fontWeight: "800" }} numberOfLines={1}>{u.name}</Text>
                  <Text style={{ color: c.textMuted, fontSize: 12 }} numberOfLines={1}>{u.phone || u.email || "—"}</Text>
                </View>
                <Pill text={u.isBlocked ? t.blocked : t.active} tone={u.isBlocked ? "danger" : "ok"} />
              </View>
              <View style={{ flexDirection: "row", alignItems: "center", marginTop: 12, gap: 8 }}>
                <Pill text={kindLabel(k)} tone={k === "DIRECTOR" ? "ok" : k === "CASHIER" ? "info" : "muted"} onPress={() => openRole(u)} />
                {!!u.shopName && <Text style={{ color: c.textMuted, fontSize: 12, flex: 1 }} numberOfLines={1}>{u.shopName}</Text>}
                {!u.shopName && <View style={{ flex: 1 }} />}
                <IconBtn name="create-outline" hint={t.edit} onPress={() => openForm(u)} />
                <IconBtn name={u.isBlocked ? "lock-open-outline" : "ban-outline"} hint={u.isBlocked ? t.unblock : t.block} onPress={() => toggleBlock(u)} color={u.isBlocked ? c.primary : c.warn} />
                <IconBtn name="trash-outline" hint={t.delete} onPress={() => remove(u)} color={c.danger} />
              </View>
            </ACard>
          );
        })
      )}

      <Sheet
        visible={!!roleFor}
        title={t.changeRole}
        onClose={() => setRoleFor(null)}
        footer={<><View style={{ flex: 1 }}><Btn label={t.cancel} tone="ghost" onPress={() => setRoleFor(null)} /></View><View style={{ flex: 2 }}><Btn label={t.save} onPress={saveRole} disabled={busy || (kind === "CASHIER" && !shopId)} /></View></>}
      >
        {!!roleFor && <Text style={{ color: c.textSub, marginBottom: 12 }}>{roleFor.name}</Text>}
        <Picker label={t.role} value={kind} options={kindOptions} onChange={(v) => { setKind(v as Kind); setShopId(""); }} />
        <Text style={{ color: c.textMuted, fontSize: 12, marginBottom: 12 }}>{(t as any)["hint" + kind]}</Text>
        {kind === "CASHIER" && (
          shops.length === 0
            ? <Text style={{ color: c.danger, fontSize: 12 }}>{t.noShops}</Text>
            : <Picker label={t.pickShop} value={shopId} onChange={setShopId} options={shops.map((s) => ({ value: s.id, label: s.name, sub: s.ownerName }))} />
        )}
      </Sheet>

      <Sheet
        visible={formFor !== null}
        title={formFor === "new" ? t.newUser : t.editUser}
        onClose={() => setFormFor(null)}
        footer={<><View style={{ flex: 1 }}><Btn label={t.cancel} tone="ghost" onPress={() => setFormFor(null)} /></View><View style={{ flex: 2 }}><Btn label={formFor === "new" ? t.create : t.save} onPress={saveForm} disabled={busy || !form.name.trim()} /></View></>}
      >
        <Field label={t.name} value={form.name} onChangeText={(v) => setForm({ ...form, name: v })} autoCapitalize="words" />
        <Field label={t.email} value={form.email} onChangeText={(v) => setForm({ ...form, email: v })} keyboardType="email-address" />
        <Field label={t.phone} value={form.phone} onChangeText={(v) => setForm({ ...form, phone: v })} keyboardType="phone-pad" />
        <Field label={formFor === "new" ? t.password : t.passwordKeep} value={form.password} onChangeText={(v) => setForm({ ...form, password: v })} secureTextEntry />
      </Sheet>
    </AScreen>
  );
}
