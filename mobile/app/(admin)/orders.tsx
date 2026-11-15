import { useMemo, useState } from "react";
import { View, Text } from "react-native";
import { Alert } from "@/utils/alert";
import { useTheme } from "@/hooks/useTheme";
import { useAT } from "@/i18n/admin";
import { adminApi, errText } from "@/services/adminApi";
import { ACard, AScreen, Btn, Chips, Empty, ErrorBox, Loader, Picker, Pill, Sheet, money, useLoad } from "@/components/admin/ui";

const STATUSES = ["pending", "paid", "processing", "shipped", "delivered", "cancelled"];
const PAYMENTS = ["pending", "paid", "failed", "refunded"];

export default function AdminOrders() {
  const { c } = useTheme();
  const t = useAT();
  const orders = useLoad(() => adminApi.orders(), []);
  const [filter, setFilter] = useState("all");
  const [edit, setEdit] = useState<any | null>(null);
  const [st, setSt] = useState("pending");
  const [pay, setPay] = useState("pending");
  const [busy, setBusy] = useState(false);

  const list = useMemo(() => {
    const all: any[] = (orders.data as any)?.orders || [];
    return filter === "all" ? all : all.filter((o) => o.orderStatus === filter);
  }, [orders.data, filter]);

  const label = (k: string, prefix: "st_" | "pay_") => (t as any)[prefix + k] || k;
  const tone = (s: string) => (s === "delivered" || s === "paid" ? "ok" : s === "cancelled" || s === "failed" ? "danger" : s === "shipped" || s === "processing" ? "info" : "warn");

  function open(o: any) {
    setEdit(o);
    setSt(o.orderStatus || "pending");
    setPay(o.paymentStatus || "pending");
  }
  async function save() {
    if (!edit) return;
    setBusy(true);
    try {
      await adminApi.setOrder(edit.id, { orderStatus: st, paymentStatus: pay });
      Alert.toast(t.saved, "success");
      setEdit(null);
      orders.reload();
    } catch (e: any) {
      Alert.alert(t.error, errText(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <AScreen title={t.ordersTitle} sub={`${t.total}: ${list.length}`} onRefresh={orders.refresh} refreshing={orders.refreshing}>
      <Chips value={filter} onChange={setFilter} options={[{ value: "all", label: t.tabAll }, ...STATUSES.map((s) => ({ value: s, label: label(s, "st_") }))]} />
      {orders.loading && !orders.data ? <Loader /> : orders.error ? <ErrorBox text={orders.error} onRetry={orders.reload} retryLabel={t.retry} /> : list.length === 0 ? <Empty text={t.noOrders} /> : (
        list.map((o) => (
          <ACard key={o.id} onPress={() => open(o)}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: c.text, fontWeight: "800" }}>{o.orderNumber || o.id}</Text>
                <Text style={{ color: c.textMuted, fontSize: 12 }}>{o.user?.name || "—"} · {o.createdAt ? new Date(o.createdAt).toLocaleDateString() : ""}</Text>
              </View>
              <Text style={{ color: c.text, fontWeight: "800" }}>{money(o.totalPrice)} {t.currency}</Text>
            </View>
            <View style={{ flexDirection: "row", gap: 8, marginTop: 10 }}>
              <Pill text={label(o.orderStatus, "st_")} tone={tone(o.orderStatus) as any} />
              <Pill text={label(o.paymentStatus || "pending", "pay_")} tone={tone(o.paymentStatus || "pending") as any} />
            </View>
          </ACard>
        ))
      )}

      <Sheet
        visible={!!edit}
        title={edit?.orderNumber || t.ordersTitle}
        onClose={() => setEdit(null)}
        footer={<><View style={{ flex: 1 }}><Btn label={t.cancel} tone="ghost" onPress={() => setEdit(null)} /></View><View style={{ flex: 2 }}><Btn label={t.save} onPress={save} disabled={busy} /></View></>}
      >
        <Picker label={t.orderStatus} value={st} onChange={setSt} options={STATUSES.map((s) => ({ value: s, label: label(s, "st_") }))} />
        <Picker label={t.payment} value={pay} onChange={setPay} options={PAYMENTS.map((s) => ({ value: s, label: label(s, "pay_") }))} />
      </Sheet>
    </AScreen>
  );
}
