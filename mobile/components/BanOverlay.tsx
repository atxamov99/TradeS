import { useCallback, useEffect, useState } from "react";
import { AppState, Linking, Modal, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import { api, API_URL } from "@/services/api";
import { useAuthStore } from "@/store/authStore";
import { useUserStore } from "@/store/userStore";
import { useBanStore } from "@/store/banStore";
import { clearLocalData } from "@/services/syncEngine";
import { useTheme } from "@/hooks/useTheme";
import { useT } from "@/hooks/useT";

const CHECK_EVERY_MS = 20000;
const BANNED_CHECK_MS = 8000;

/**
 * Watches the signed-in account. While an admin keeps it blocked, a full-screen window that cannot be
 * dismissed covers the app: the only way out is Log out. Re-checks while the app is open, so a block is
 * noticed without restarting and an unblock removes the window by itself.
 */
export function BanOverlay() {
  const { c } = useTheme();
  const t = useT();
  const token = useAuthStore((s) => s.token);
  const banned = useBanStore((s) => s.banned);
  const setBanned = useBanStore((s) => s.setBanned);
  const [leaving, setLeaving] = useState(false);

  const check = useCallback(async () => {
    try {
      await api.get("/auth/me"); // 200 = not blocked (also clears the window after an unblock)
      if (useBanStore.getState().banned) setBanned(false);
    } catch {
      // 403 ACCOUNT_BLOCKED is turned into the window by the api interceptor; offline etc. is ignored
    }
  }, [setBanned]);

  useEffect(() => {
    if (!token || token === "demo-token") { setBanned(false); return; }
    check();
    const id = setInterval(check, banned ? BANNED_CHECK_MS : CHECK_EVERY_MS);
    const sub = AppState.addEventListener("change", (s) => { if (s === "active") check(); });
    return () => { clearInterval(id); sub.remove(); };
  }, [token, banned, check, setBanned]);

  async function leave() {
    setLeaving(true);
    try {
      const refreshToken = useAuthStore.getState().refreshToken;
      // a blocked account may still log out (the endpoint is public and only revokes the token we send)
      await axios.post(`${API_URL}/auth/logout`, { refreshToken }, { timeout: 8000 });
    } catch { /* ignore */ }
    await clearLocalData().catch(() => {});
    useUserStore.getState().clearUser();
    await useAuthStore.getState().clearToken();
    setBanned(false);
    setLeaving(false);
  }

  return (
    <Modal visible={banned && !!token} animationType="fade" statusBarTranslucent onRequestClose={() => { /* cannot be dismissed */ }}>
      <View style={{ flex: 1, backgroundColor: c.bg, alignItems: "center", justifyContent: "center", padding: 24 }}>
        <View style={{ width: "100%", maxWidth: 420, borderRadius: 24, borderWidth: 1, borderColor: c.danger, backgroundColor: c.bgCard, padding: 28, alignItems: "center" }}>
          <View style={{ width: 68, height: 68, borderRadius: 34, backgroundColor: "rgba(239,68,68,0.15)", alignItems: "center", justifyContent: "center", marginBottom: 18 }}>
            <Ionicons name="shield-half-outline" size={34} color={c.danger} />
          </View>
          <Text style={{ color: c.text, fontSize: 20, fontWeight: "800", textAlign: "center" }}>{t.ban.title}</Text>
          <Text style={{ color: c.textSub, fontSize: 14, lineHeight: 21, textAlign: "center", marginTop: 10 }}>{t.ban.text}</Text>
          <TouchableOpacity onPress={() => Linking.openURL("https://t.me/trades_uz_bot?start=support")} style={{ marginTop: 16, flexDirection: "row", alignItems: "center", gap: 6 }}>
            <Ionicons name="help-buoy-outline" size={16} color={c.primary} />
            <Text style={{ color: c.primary, fontWeight: "600" }}>{t.ban.support}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={leave} disabled={leaving} style={{ marginTop: 22, height: 50, alignSelf: "stretch", borderRadius: 14, backgroundColor: c.danger, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 8, opacity: leaving ? 0.6 : 1 }}>
            <Ionicons name="log-out-outline" size={20} color="#fff" />
            <Text style={{ color: "#fff", fontWeight: "800", fontSize: 15 }}>{t.ban.logout}</Text>
          </TouchableOpacity>
          <Text style={{ color: c.textMuted, fontSize: 12, marginTop: 12, textAlign: "center" }}>{t.ban.auto}</Text>
        </View>
      </View>
    </Modal>
  );
}
