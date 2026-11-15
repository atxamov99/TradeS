import { Redirect, Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/hooks/useTheme";
import { useRoleStore } from "@/store/roleStore";
import { useAT } from "@/i18n/admin";

// The ADMIN part of the app: the same pages as the website's admin panel. Five tabs; the rest live under "More".
export default function AdminLayout() {
  const { c } = useTheme();
  const t = useAT();
  const insets = useSafeAreaInsets();
  const kind = useRoleStore((s) => s.kind);

  // only a platform ADMIN belongs here
  if (kind !== "ADMIN") return <Redirect href="/(app)" />;

  const hidden = { href: null } as const;
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: c.primary,
        tabBarInactiveTintColor: c.textMuted,
        tabBarStyle: {
          backgroundColor: c.tabBar, borderTopColor: c.tabBorder, borderTopWidth: 1, elevation: 0, shadowOpacity: 0,
          height: 62 + insets.bottom, paddingBottom: 8 + insets.bottom, paddingTop: 4,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: "600" },
        headerShown: false,
      }}
    >
      <Tabs.Screen name="dashboard" options={{ title: t.tabDash, tabBarIcon: ({ color, size }) => <Ionicons name="speedometer" size={size} color={color} /> }} />
      <Tabs.Screen name="users" options={{ title: t.tabUsers, tabBarIcon: ({ color, size }) => <Ionicons name="people" size={size} color={color} /> }} />
      <Tabs.Screen name="orders" options={{ title: t.tabOrders, tabBarIcon: ({ color, size }) => <Ionicons name="cart" size={size} color={color} /> }} />
      <Tabs.Screen name="support" options={{ title: t.tabSupport, tabBarIcon: ({ color, size }) => <Ionicons name="chatbubbles" size={size} color={color} /> }} />
      <Tabs.Screen name="more" options={{ title: t.tabMore, tabBarIcon: ({ color, size }) => <Ionicons name="apps" size={size} color={color} /> }} />
      <Tabs.Screen name="products" options={hidden} />
      <Tabs.Screen name="reports" options={hidden} />
      <Tabs.Screen name="admins" options={hidden} />
      <Tabs.Screen name="content" options={hidden} />
      <Tabs.Screen name="notifications" options={hidden} />
      <Tabs.Screen name="settings" options={hidden} />
    </Tabs>
  );
}
