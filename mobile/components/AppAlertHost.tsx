import { Modal, Pressable, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAlertStore, type AlertKind } from "@/utils/alert";
import { useTheme } from "@/hooks/useTheme";

const ICON: Record<AlertKind, React.ComponentProps<typeof Ionicons>["name"]> = {
  info: "information-circle",
  error: "close-circle",
  success: "checkmark-circle",
  warning: "warning",
};

/** Renders the in-app dialog (one at a time, queued) and small toasts. Mounted once in the root layout. */
export function AppAlertHost() {
  const { c } = useTheme();
  const current = useAlertStore((s) => s.queue[0]);
  const shift = useAlertStore((s) => s.shift);
  const toasts = useAlertStore((s) => s.toasts);
  const dropToast = useAlertStore((s) => s.dropToast);

  const tone = (k: AlertKind) => (k === "error" ? c.danger : k === "warning" ? c.warn : k === "success" ? c.success : c.primary);

  const press = (fn?: () => void) => {
    shift();
    fn?.();
  };

  return (
    <>
      <Modal visible={!!current} transparent animationType="fade" statusBarTranslucent onRequestClose={() => press(current?.buttons.find((b) => b.style === "cancel")?.onPress)}>
        <Pressable
          style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.55)", alignItems: "center", justifyContent: "center", padding: 24 }}
          onPress={() => { if (current && current.buttons.length === 1) press(current.buttons[0].onPress); }}
        >
          {current && (
            <Pressable
              onPress={() => {}}
              style={{ width: "100%", maxWidth: 380, backgroundColor: c.bgCard, borderRadius: 24, borderWidth: 1, borderColor: c.border, padding: 22 }}
            >
              <View style={{ width: 52, height: 52, borderRadius: 18, alignItems: "center", justifyContent: "center", marginBottom: 14, backgroundColor: tone(current.kind) + "22" }}>
                <Ionicons name={ICON[current.kind]} size={28} color={tone(current.kind)} />
              </View>
              <Text style={{ fontSize: 19, fontWeight: "800", color: c.text }}>{current.title}</Text>
              {!!current.message && (
                <Text style={{ fontSize: 14, lineHeight: 21, marginTop: 6, color: c.textSub }}>{current.message}</Text>
              )}
              <View style={{ flexDirection: current.buttons.length > 2 ? "column" : "row", gap: 10, marginTop: 20 }}>
                {current.buttons.map((b, i) => {
                  const destructive = b.style === "destructive";
                  const cancel = b.style === "cancel";
                  const primary = !destructive && !cancel;
                  return (
                    <TouchableOpacity
                      key={i}
                      activeOpacity={0.85}
                      onPress={() => press(b.onPress)}
                      style={{
                        flex: current.buttons.length > 2 ? undefined : 1,
                        height: 46,
                        borderRadius: 14,
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor: primary ? c.primary : destructive ? c.danger + "1F" : c.bgMuted,
                        borderWidth: destructive ? 1 : 0,
                        borderColor: c.danger + "55",
                      }}
                    >
                      <Text style={{ fontSize: 15, fontWeight: "800", color: primary ? "#fff" : destructive ? c.danger : c.text }}>{b.text || "OK"}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </Pressable>
          )}
        </Pressable>
      </Modal>

      {/* toasts */}
      <View pointerEvents="box-none" style={{ position: "absolute", left: 0, right: 0, top: 54, paddingHorizontal: 16, gap: 8 }}>
        {toasts.map((t) => (
          <TouchableOpacity
            key={t.id}
            activeOpacity={0.9}
            onPress={() => dropToast(t.id)}
            style={{ flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: c.bgCard, borderRadius: 16, borderWidth: 1, borderColor: c.border, padding: 12 }}
          >
            <Ionicons name={ICON[t.kind]} size={22} color={tone(t.kind)} />
            <Text style={{ flex: 1, fontSize: 14, fontWeight: "600", color: c.text }}>{t.text}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </>
  );
}
