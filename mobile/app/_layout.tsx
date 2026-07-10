import { useEffect, useState } from "react";
import { AppState, View } from "react-native";
import { Stack, router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useAuthStore } from "@/store/authStore";
import { useLangStore } from "@/store/langStore";
import { useThemeStore } from "@/store/themeStore";
import { useSubscriptionStore } from "@/store/subscriptionStore";
import { useRoleStore } from "@/store/roleStore";
import { runSync } from "@/services/syncEngine";
import "../global.css";

export default function RootLayout() {
  const { token, loadToken } = useAuthStore();
  const loadLang = useLangStore((s) => s.loadLang);
  const loadTheme = useThemeStore((s) => s.loadTheme);
  const loadSubscription = useSubscriptionStore((s) => s.load);
  const loadRole = useRoleStore((s) => s.load);
  const isDark = useThemeStore((s) => s.isDark);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    Promise.all([loadToken(), loadLang(), loadTheme(), loadSubscription(), loadRole()])
      .then(() => setReady(true))
      .catch(() => setReady(true));
  }, []);

  useEffect(() => {
    if (!ready) return;
    if (token) {
      router.replace("/(app)");
    } else {
      router.replace("/(auth)/");
    }
  }, [token, ready]);

  useEffect(() => {
    if (!token || token === "demo-token") return;
    runSync();
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") runSync();
    });
    return () => sub.remove();
  }, [token]);

  if (!ready) return <View style={{ flex: 1, backgroundColor: "#0C1410" }} />;

  return (
    <>
      <StatusBar style={isDark ? "light" : "dark"} />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(app)" />
        <Stack.Screen name="(auth)" />
      </Stack>
    </>
  );
}
