import { ReactNode, useCallback, useEffect, useRef, useState } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, TextInput, Modal, ActivityIndicator, RefreshControl,
  KeyboardAvoidingView, Platform, TextInputProps, ViewStyle,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useTheme } from "@/hooks/useTheme";

// Small building blocks shared by every screen of the admin part of the app.

export function useLoad<T>(fn: () => Promise<T>, deps: any[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const alive = useRef(true);
  useEffect(() => () => { alive.current = false; }, []);

  const run = useCallback(async (soft = false) => {
    if (soft) setRefreshing(true); else setLoading(true);
    try {
      const r = await fn();
      if (alive.current) { setData(r); setError(null); }
    } catch (e: any) {
      if (alive.current) setError(e?.response?.data?.message || e?.message || "Error");
    } finally {
      if (alive.current) { setLoading(false); setRefreshing(false); }
    }
  }, deps); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { run(false); }, [run]);
  return { data, loading, refreshing, error, reload: () => run(false), refresh: () => run(true), setData };
}

export const money = (n: any) => Number(n || 0).toLocaleString("ru-RU").replace(/,/g, " ");

export function AScreen({
  title, sub, back, right, children, onRefresh, refreshing, scroll = true, bottom,
}: {
  title: string; sub?: string; back?: boolean; right?: ReactNode; children: ReactNode;
  onRefresh?: () => void; refreshing?: boolean; scroll?: boolean; bottom?: ReactNode;
}) {
  const { c } = useTheme();
  const header = (
    <View style={{ paddingHorizontal: 20, paddingTop: 54, paddingBottom: 12, flexDirection: "row", alignItems: "center" }}>
      {back && (
        <TouchableOpacity onPress={() => (router.canGoBack() ? router.back() : router.replace("/(admin)/more" as any))} style={{ marginRight: 10 }} hitSlop={10}>
          <Ionicons name="chevron-back" size={24} color={c.primary} />
        </TouchableOpacity>
      )}
      <View style={{ flex: 1 }}>
        <Text style={{ color: c.text, fontSize: 26, fontWeight: "800" }}>{title}</Text>
        {!!sub && <Text style={{ color: c.textMuted, fontSize: 12, marginTop: 2 }}>{sub}</Text>}
      </View>
      {right}
    </View>
  );
  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      {header}
      {scroll ? (
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 110 }}
          keyboardShouldPersistTaps="handled"
          refreshControl={onRefresh ? <RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} tintColor={c.primary} /> : undefined}
        >
          {children}
        </ScrollView>
      ) : (
        <View style={{ flex: 1 }}>{children}</View>
      )}
      {bottom}
    </View>
  );
}

export function ACard({ children, onPress, style }: { children: ReactNode; onPress?: () => void; style?: ViewStyle }) {
  const { c } = useTheme();
  const base: ViewStyle = { backgroundColor: c.bgCard, borderRadius: 18, borderWidth: 1, borderColor: c.border, padding: 14, marginBottom: 10 };
  if (onPress) return <TouchableOpacity activeOpacity={0.8} onPress={onPress} style={[base, style]}>{children}</TouchableOpacity>;
  return <View style={[base, style]}>{children}</View>;
}

export function Pill({ text, tone = "muted", onPress }: { text: string; tone?: "ok" | "warn" | "danger" | "info" | "muted"; onPress?: () => void }) {
  const { c } = useTheme();
  const map = {
    ok: { bg: "rgba(34,197,94,0.15)", fg: c.primary },
    warn: { bg: "rgba(245,158,11,0.16)", fg: c.warn },
    danger: { bg: "rgba(239,68,68,0.15)", fg: c.danger },
    info: { bg: "rgba(56,189,248,0.16)", fg: "#38BDF8" },
    muted: { bg: c.bgMuted, fg: c.textSub },
  }[tone];
  const body = (
    <View style={{ backgroundColor: map.bg, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3, flexDirection: "row", alignItems: "center", gap: 3, alignSelf: "flex-start" }}>
      <Text style={{ color: map.fg, fontSize: 11, fontWeight: "800" }} numberOfLines={1}>{text}</Text>
      {onPress && <Ionicons name="chevron-down" size={12} color={map.fg} />}
    </View>
  );
  return onPress ? <TouchableOpacity onPress={onPress} hitSlop={6}>{body}</TouchableOpacity> : body;
}

export function Btn({ label, onPress, tone = "primary", small, disabled, icon }: {
  label: string; onPress: () => void; tone?: "primary" | "danger" | "ghost"; small?: boolean; disabled?: boolean; icon?: keyof typeof Ionicons.glyphMap;
}) {
  const { c } = useTheme();
  const bg = tone === "primary" ? c.primary : tone === "danger" ? c.danger : "transparent";
  const fg = tone === "ghost" ? c.textSub : "#fff";
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.8}
      style={{
        height: small ? 36 : 48, paddingHorizontal: small ? 14 : 18, borderRadius: small ? 10 : 14, backgroundColor: bg,
        borderWidth: tone === "ghost" ? 1 : 0, borderColor: c.border, alignItems: "center", justifyContent: "center",
        flexDirection: "row", gap: 6, opacity: disabled ? 0.5 : 1,
      }}
    >
      {icon && <Ionicons name={icon} size={small ? 15 : 18} color={fg} />}
      <Text style={{ color: fg, fontWeight: "800", fontSize: small ? 12 : 15 }}>{label}</Text>
    </TouchableOpacity>
  );
}

export function IconBtn({ name, onPress, color, hint }: { name: keyof typeof Ionicons.glyphMap; onPress: () => void; color?: string; hint?: string }) {
  const { c } = useTheme();
  return (
    <TouchableOpacity onPress={onPress} hitSlop={8} accessibilityLabel={hint} style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: c.bgMuted, alignItems: "center", justifyContent: "center" }}>
      <Ionicons name={name} size={18} color={color || c.textSub} />
    </TouchableOpacity>
  );
}

export function Field({ label, ...props }: { label?: string } & TextInputProps) {
  const { c } = useTheme();
  return (
    <View style={{ marginBottom: 12 }}>
      {!!label && <Text style={{ color: c.textSub, fontSize: 12, fontWeight: "700", marginBottom: 6 }}>{label}</Text>}
      <TextInput
        placeholderTextColor={c.textMuted}
        autoCapitalize="none"
        {...props}
        style={[{ height: props.multiline ? 110 : 48, borderRadius: 14, borderWidth: 1, borderColor: c.border, backgroundColor: c.bgMuted, paddingHorizontal: 14, paddingTop: props.multiline ? 12 : 0, fontSize: 15, color: c.text, textAlignVertical: props.multiline ? "top" : "center" }, props.style as any]}
      />
    </View>
  );
}

// Bottom sheet window (used for forms, confirmations and pickers).
export function Sheet({ visible, title, onClose, children, footer }: { visible: boolean; title: string; onClose: () => void; children: ReactNode; footer?: ReactNode }) {
  const { c } = useTheme();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.55)" }}>
        <TouchableOpacity activeOpacity={1} onPress={onClose} style={{ flex: 1 }} />
        <View style={{ backgroundColor: c.bgCard, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: "86%", padding: 20, paddingBottom: 28 }}>
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 14 }}>
            <Text style={{ flex: 1, color: c.text, fontSize: 18, fontWeight: "800" }}>{title}</Text>
            <TouchableOpacity onPress={onClose} hitSlop={10}><Ionicons name="close" size={24} color={c.textSub} /></TouchableOpacity>
          </View>
          <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>{children}</ScrollView>
          {footer && <View style={{ flexDirection: "row", gap: 10, marginTop: 14 }}>{footer}</View>}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// A styled replacement for a dropdown: a field that opens a list in a sheet.
export function Picker({ label, value, options, onChange, placeholder }: {
  label?: string; value: string; options: { value: string; label: string; sub?: string }[]; onChange: (v: string) => void; placeholder?: string;
}) {
  const { c } = useTheme();
  const [open, setOpen] = useState(false);
  const cur = options.find((o) => o.value === value);
  return (
    <View style={{ marginBottom: 12 }}>
      {!!label && <Text style={{ color: c.textSub, fontSize: 12, fontWeight: "700", marginBottom: 6 }}>{label}</Text>}
      <TouchableOpacity onPress={() => setOpen(true)} style={{ height: 48, borderRadius: 14, borderWidth: 1, borderColor: c.border, backgroundColor: c.bgMuted, paddingHorizontal: 14, flexDirection: "row", alignItems: "center" }}>
        <Text style={{ flex: 1, color: cur ? c.text : c.textMuted, fontSize: 15 }} numberOfLines={1}>{cur ? cur.label : placeholder || ""}</Text>
        <Ionicons name="chevron-down" size={18} color={c.textMuted} />
      </TouchableOpacity>
      <Sheet visible={open} title={label || ""} onClose={() => setOpen(false)}>
        {options.map((o) => {
          const sel = o.value === value;
          return (
            <TouchableOpacity key={o.value} onPress={() => { onChange(o.value); setOpen(false); }} style={{ paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: c.border, flexDirection: "row", alignItems: "center" }}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: sel ? c.primary : c.text, fontSize: 15, fontWeight: sel ? "800" : "600" }}>{o.label}</Text>
                {!!o.sub && <Text style={{ color: c.textMuted, fontSize: 12, marginTop: 2 }}>{o.sub}</Text>}
              </View>
              {sel && <Ionicons name="checkmark" size={20} color={c.primary} />}
            </TouchableOpacity>
          );
        })}
      </Sheet>
    </View>
  );
}

export function Chips({ options, value, onChange }: { options: { value: string; label: string }[]; value: string; onChange: (v: string) => void }) {
  const { c } = useTheme();
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }} contentContainerStyle={{ gap: 8 }}>
      {options.map((o) => {
        const on = o.value === value;
        return (
          <TouchableOpacity key={o.value} onPress={() => onChange(o.value)} style={{ paddingHorizontal: 14, height: 36, borderRadius: 999, alignItems: "center", justifyContent: "center", backgroundColor: on ? c.primary : c.bgMuted, borderWidth: 1, borderColor: on ? c.primary : c.border }}>
            <Text style={{ color: on ? "#fff" : c.textSub, fontWeight: "700", fontSize: 13 }}>{o.label}</Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

export function Avatar({ name, tone }: { name: string; tone?: string }) {
  const { c } = useTheme();
  return (
    <View style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: tone || c.bgMuted, alignItems: "center", justifyContent: "center", marginRight: 12 }}>
      <Text style={{ color: c.primary, fontWeight: "800" }}>{(name || "?").slice(0, 2).toUpperCase()}</Text>
    </View>
  );
}

export function Empty({ text }: { text: string }) {
  const { c } = useTheme();
  return <Text style={{ color: c.textMuted, textAlign: "center", paddingVertical: 36 }}>{text}</Text>;
}

export function Loader() {
  const { c } = useTheme();
  return <ActivityIndicator color={c.primary} style={{ marginTop: 40 }} />;
}

export function ErrorBox({ text, onRetry, retryLabel }: { text: string; onRetry: () => void; retryLabel: string }) {
  const { c } = useTheme();
  return (
    <ACard>
      <Text style={{ color: c.danger, marginBottom: 10 }}>{text}</Text>
      <Btn label={retryLabel} onPress={onRetry} small tone="ghost" />
    </ACard>
  );
}

export function SearchBar({ value, onChangeText, placeholder }: { value: string; onChangeText: (v: string) => void; placeholder: string }) {
  const { c } = useTheme();
  return (
    <View style={{ flexDirection: "row", alignItems: "center", height: 46, borderRadius: 14, borderWidth: 1, borderColor: c.border, backgroundColor: c.bgCard, paddingHorizontal: 12, marginBottom: 12 }}>
      <Ionicons name="search" size={18} color={c.textMuted} />
      <TextInput value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor={c.textMuted} autoCapitalize="none" style={{ flex: 1, marginLeft: 8, color: c.text, fontSize: 15 }} />
    </View>
  );
}
