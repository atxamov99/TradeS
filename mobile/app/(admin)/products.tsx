import { useMemo, useState } from "react";
import { View, Text } from "react-native";
import { Alert } from "@/utils/alert";
import { useTheme } from "@/hooks/useTheme";
import { useAT } from "@/i18n/admin";
import { adminApi, errText } from "@/services/adminApi";
import { ACard, AScreen, Btn, Chips, Empty, ErrorBox, Field, IconBtn, Loader, Pill, SearchBar, Sheet, money, useLoad } from "@/components/admin/ui";

const emptyForm = { name: "", category: "", buyPrice: "", sellPrice: "", stock: "" };

export default function AdminProducts() {
  const { c } = useTheme();
  const t = useAT();
  const products = useLoad(() => adminApi.products(), []);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("all");
  const [formFor, setFormFor] = useState<"new" | any | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [busy, setBusy] = useState(false);

  const list = useMemo(() => {
    const all: any[] = (products.data as any)?.products || [];
    const s = q.trim().toLowerCase();
    return all.filter((p) => {
      if (filter === "active" && p.isActive === false) return false;
      if (filter === "inactive" && p.isActive !== false) return false;
      return !s || [p.name, p.category, p.barcode].join(" ").toLowerCase().includes(s);
    });
  }, [products.data, q, filter]);

  function open(p: any | "new") {
    setFormFor(p);
    setForm(p === "new" ? emptyForm : {
      name: p.name || "", category: p.category || "", buyPrice: String(p.buyPrice ?? ""), sellPrice: String(p.sellPrice ?? p.price ?? ""), stock: String(p.stock ?? ""),
    });
  }

  async function save() {
    const sell = Number(form.sellPrice);
    const body: any = { name: form.name.trim(), category: form.category.trim().toLowerCase(), buyPrice: Number(form.buyPrice) || 0, sellPrice: sell, price: sell, stock: Number(form.stock) || 0 };
    if (!body.name || !(sell >= 0) || form.sellPrice === "") return;
    setBusy(true);
    try {
      if (formFor === "new") await adminApi.createProduct(body); else await adminApi.updateProduct(formFor.id, body);
      Alert.toast(t.saved, "success");
      setFormFor(null);
      products.reload();
    } catch (e: any) {
      Alert.alert(t.error, errText(e));
    } finally {
      setBusy(false);
    }
  }

  async function toggle(p: any) {
    try { await adminApi.updateProduct(p.id, { isActive: p.isActive === false }); products.reload(); }
    catch (e: any) { Alert.alert(t.error, errText(e)); }
  }

  function remove(p: any) {
    Alert.alert(t.delete, `${p.name}\n${t.confirmDelete}`, [
      { text: t.cancel, style: "cancel" },
      {
        text: t.delete, style: "destructive",
        onPress: async () => {
          try { await adminApi.removeProduct(p.id); Alert.toast(t.deleted, "success"); products.reload(); }
          catch (e: any) { Alert.alert(t.error, errText(e)); }
        },
      },
    ]);
  }

  return (
    <AScreen
      title={t.productsTitle}
      sub={`${t.total}: ${list.length}`}
      back
      onRefresh={products.refresh}
      refreshing={products.refreshing}
      right={<IconBtn name="add" hint={t.newProduct} onPress={() => open("new")} color={c.primary} />}
    >
      <SearchBar value={q} onChangeText={setQ} placeholder={t.search} />
      <Chips value={filter} onChange={setFilter} options={[{ value: "all", label: t.tabAll }, { value: "active", label: t.active }, { value: "inactive", label: t.inactive }]} />
      {products.loading && !products.data ? <Loader /> : products.error ? <ErrorBox text={products.error} onRetry={products.reload} retryLabel={t.retry} /> : list.length === 0 ? <Empty text={t.empty} /> : (
        list.map((p) => {
          const off = p.isActive === false;
          return (
            <ACard key={p.id}>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: c.text, fontSize: 15, fontWeight: "800" }} numberOfLines={1}>{p.name}</Text>
                  <Text style={{ color: c.textMuted, fontSize: 12 }}>{p.category || "—"} · {t.stock}: {money(p.stock)}</Text>
                </View>
                <Text style={{ color: c.text, fontWeight: "800" }}>{money(p.sellPrice ?? p.price)} {t.currency}</Text>
              </View>
              <View style={{ flexDirection: "row", alignItems: "center", marginTop: 12, gap: 8 }}>
                <Pill text={off ? t.inactive : t.active} tone={off ? "muted" : "ok"} />
                <View style={{ flex: 1 }} />
                <IconBtn name="create-outline" hint={t.edit} onPress={() => open(p)} />
                <IconBtn name={off ? "eye-outline" : "eye-off-outline"} hint={off ? t.activate : t.deactivate} onPress={() => toggle(p)} />
                <IconBtn name="trash-outline" hint={t.delete} onPress={() => remove(p)} color={c.danger} />
              </View>
            </ACard>
          );
        })
      )}

      <Sheet
        visible={formFor !== null}
        title={formFor === "new" ? t.newProduct : t.editProduct}
        onClose={() => setFormFor(null)}
        footer={<><View style={{ flex: 1 }}><Btn label={t.cancel} tone="ghost" onPress={() => setFormFor(null)} /></View><View style={{ flex: 2 }}><Btn label={t.save} onPress={save} disabled={busy || !form.name.trim() || form.sellPrice === ""} /></View></>}
      >
        <Field label={t.name} value={form.name} onChangeText={(v) => setForm({ ...form, name: v })} autoCapitalize="sentences" />
        <Field label={t.category} value={form.category} onChangeText={(v) => setForm({ ...form, category: v })} />
        <Field label={t.buyPrice} value={form.buyPrice} onChangeText={(v) => setForm({ ...form, buyPrice: v })} keyboardType="numeric" />
        <Field label={t.sellPrice} value={form.sellPrice} onChangeText={(v) => setForm({ ...form, sellPrice: v })} keyboardType="numeric" />
        <Field label={t.stock} value={form.stock} onChangeText={(v) => setForm({ ...form, stock: v })} keyboardType="numeric" />
      </Sheet>
    </AScreen>
  );
}
