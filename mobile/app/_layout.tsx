import { useEffect, useState } from "react";
import { AppState, View } from "react-native";
import { Stack, router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useAuthStore } from "@/store/authStore";
import { useUserStore } from "@/store/userStore";
import { useLangStore } from "@/store/langStore";
import { useThemeStore } from "@/store/themeStore";
import { useSubscriptionStore } from "@/store/subscriptionStore";
import { useRoleStore } from "@/store/roleStore";
import { runSync } from "@/services/syncEngine";
import { api } from "@/services/api";
import { loadDeviceId } from "@/utils/deviceId";
import { AppAlertHost } from "@/components/AppAlertHost";
import "../global.css";

export default function RootLayout() {
  const { token, loadToken } = useAuthStore();
  const loadUser = useUserStore((s) => s.loadUser);
  const loadLang = useLangStore((s) => s.loadLang);
  const loadTheme = useThemeStore((s) => s.loadTheme);
  const loadSubscription = useSubscriptionStore((s) => s.load);
  const loadRole = useRoleStore((s) => s.load);
  const isDark = useThemeStore((s) => s.isDark);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // First paint faqat tez lokal o'qishlarga bog'lansin — tarmoq chaqiruvi (loadSubscription)
    // ni bu yerga qo'shsak, backend "cold start" bo'lsa 10s gacha qora ekran ko'rinadi.
    Promise.all([loadToken(), loadUser(), loadLang(), loadTheme(), loadRole(), loadDeviceId()])
      .then(() => setReady(true))
      .catch(() => setReady(true));
    // Obuna ma'lumoti tarmoq orqali keladi — fon rejimida yuklanadi, renderni bloklamaydi.
    loadSubscription().catch(() => {});
  }, []);

  useEffect(() => {
    if (!ready) return;
    if (token) {
      router.replace("/(app)");
    } else {
      router.replace("/(auth)/login");
    }
  }, [token, ready]);

  useEffect(() => {
    // Server-side role: no token -> forget the cached role; real token -> ask the server who we are.
    if (!token) {
      useRoleStore.getState().reset().catch(() => {});
    } else if (token !== "demo-token") {
      useRoleStore.getState().refresh(async () => (await api.get("/auth/me")).data.data).catch(() => {});
    }
  }, [token]);

  useEffect(() => {
    if (!token || token === "demo-token") return;
    runSync();
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") runSync();
    });
    return () => sub.remove();
  }, [token]);

  if (!ready) return <View style={{ flex: 1, backgroundColor: "#080D09" }} />;

  return (
    <>
      <StatusBar style={isDark ? "light" : "dark"} />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(app)" />
        <Stack.Screen name="(auth)" />
      </Stack>
      <AppAlertHost />
    </>
  );
}
