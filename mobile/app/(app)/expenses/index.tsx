import { useCallback, useEffect, useState } from "react";
import { View, Text } from "react-native";
import { Alert } from "@/utils/alert";
import { api } from "@/services/api";
import { useLangStore } from "@/store/langStore";
import { useTheme } from "@/hooks/useTheme";
import { ACard, AScreen, Btn, Empty, Field, IconBtn, Loader, Picker } from "@/components/admin/ui";

// Expenses of the business director's shop (same as the website's Expenses page; the server allows the shop OWNER only).
const CATS = ["rent", "salary", "supplies", "utilities", "other"];
const L = {
  uz: { title: "Xarajatlar", total: "Jami xarajat", amount: "Summa", cat: "Turi", note: "Izoh", add: "Xarajat qo'shish", empty: "Hali xarajat yo'q", added: "Xarajat qo'shildi", deleted: "Xarajat o'chirildi", del: "O'chirish", err: "Xatolik", noShop: "Biznes do'koni topilmadi",
    rent: "Ijara", salary: "Ish haqi", supplies: "Xomashyo", utilities: "Kommunal", other: "Boshqa" },
  ru: { title: "Расходы", total: "Всего расходов", amount: "Сумма", cat: "Тип", note: "Заметка", add: "Добавить расход", empty: "Расходов пока нет", added: "Расход добавлен", deleted: "Расход удалён", del: "Удалить", err: "Ошибка", noShop: "Бизнес-магазин не найден",
    rent: "Аренда", salary: "Зарплата", supplies: "Закупки", utilities: "Коммуналка", other: "Другое" },
  en: { title: "Expenses", total: "Total expenses", amount: "Amount", cat: "Category", note: "Note", add: "Add expense", empty: "No expenses yet", added: "Expense added", deleted: "Expense deleted", del: "Delete", err: "Error", noShop: "Business shop not found",
    rent: "Rent", salary: "Salary", supplies: "Supplies", utilities: "Utilities", other: "Other" },
};

const fmt = (n: any) => Number(n || 0).toLocaleString("ru-RU").replace(/,/g, " ");
const msg = (e: any, f: string) => e?.response?.data?.message || e?.message || f;

export default function ExpensesScreen() {
  const { c } = useTheme();
  const lang = useLangStore((s) => s.lang);
  const t: any = (L as any)[lang] || L.uz;

  const [shopId, setShopId] = useState<string | null>(null);
  const [items, setItems] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ amount: "", category: "other", note: "" });

  const load = useCallback(async () => {
    try {
      let id = shopId;
      if (!id) {
        const res = await api.get("/shops");
        const shops = res.data?.data?.shops || res.data?.data || [];
        const owned = (Array.isArray(shops) ? shops : []).find((s: any) => s.myRole === "OWNER");
        id = owned?.id || null;
        setShopId(id);
      }
      if (!id) return;
      const r = await api.get(`/shops/${id}/expenses`);
      setItems(r.data?.data?.expenses || []);
      setTotal(r.data?.data?.total || 0);
    } catch (e: any) {
      Alert.alert(t.err, msg(e, t.err));
    } finally {
      setLoading(false);
    }
  }, [shopId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { load(); }, [load]);

  async function add() {
    const amount = Number(form.amount);
    if (!(amount > 0) || !shopId) return;
    setBusy(true);
    try {
      await api.post(`/shops/${shopId}/expenses`, { amount, category: form.category, note: form.note.trim() });
      Alert.toast(t.added, "success");
      setForm({ amount: "", category: "other", note: "" });
      await load();
    } catch (e: any) {
      Alert.alert(t.err, msg(e, t.err));
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    try {
      await api.delete(`/shops/${shopId}/expenses/${id}`);
      Alert.toast(t.deleted, "success");
      await load();
    } catch (e: any) {
      Alert.alert(t.err, msg(e, t.err));
    }
  }

  return (
    <AScreen title={t.title} sub={`${t.total}: ${fmt(total)}`} back onRefresh={load}>
      <ACard>
        <Field label={t.amount} value={form.amount} onChangeText={(v) => setForm({ ...form, amount: v })} keyboardType="numeric" />
        <Picker label={t.cat} value={form.category} onChange={(v) => setForm({ ...form, category: v })} options={CATS.map((k) => ({ value: k, label: t[k] }))} />
        <Field label={t.note} value={form.note} onChangeText={(v) => setForm({ ...form, note: v })} maxLength={500} autoCapitalize="sentences" />
        <Btn label={t.add} icon="add" onPress={add} disabled={busy || !shopId || !(Number(form.amount) > 0)} />
      </ACard>
      {loading ? <Loader /> : !shopId ? <Empty text={t.noShop} /> : items.length === 0 ? <Empty text={t.empty} /> : (
        items.map((x) => (
          <ACard key={x.id}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: c.text, fontWeight: "800" }}>{fmt(x.amount)} · {t[x.category] || x.category}</Text>
                <Text style={{ color: c.textMuted, fontSize: 12 }} numberOfLines={1}>{new Date(x.createdAt).toLocaleDateString()}{x.note ? " · " + x.note : ""}</Text>
              </View>
              <IconBtn name="trash-outline" hint={t.del} onPress={() => remove(x.id)} color={c.danger} />
            </View>
          </ACard>
        ))
      )}
    </AScreen>
  );
}
