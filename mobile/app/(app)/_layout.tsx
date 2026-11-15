import { useEffect } from "react";
import { Redirect, Tabs } from "expo-router";
import { useRoleStore } from "@/store/roleStore";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useT } from "@/hooks/useT";
import { useLowStockCount } from "@/hooks/useProducts";
import { useTheme } from "@/hooks/useTheme";
import { registerForPushNotifications } from "@/services/notifications";

export default function AppLayout() {
  const t = useT();
  const lowStockCount = useLowStockCount();
  const { c } = useTheme();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    registerForPushNotifications().catch(() => {});
  }, []);

  const kind = useRoleStore((s) => s.kind);
  // a platform ADMIN works in the admin part of the app (same pages as the website admin panel)
  if (kind === "ADMIN") return <Redirect href={"/(admin)/dashboard" as any} />;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: c.primary,
        tabBarInactiveTintColor: c.textMuted,
        tabBarStyle: {
          backgroundColor: c.tabBar,
          borderTopColor: c.tabBorder,
          borderTopWidth: 1,
          elevation: 0,
          shadowOpacity: 0,
          height: 62 + insets.bottom,
          paddingBottom: 8 + insets.bottom,
          paddingTop: 4,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: "600" },
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t.nav.home,
          tabBarIcon: ({ color, size }) => <Ionicons name="home" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="sales"
        options={{
          title: t.nav.sales,
          tabBarIcon: ({ color, size }) => <Ionicons name="cart" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="products"
        options={{
          href: kind === "CASHIER" ? null : undefined, // a cashier only sells: the website has no Products page for them
          title: t.nav.products,
          tabBarIcon: ({ color, size }) => <Ionicons name="cube" size={size} color={color} />,
          tabBarBadge: lowStockCount > 0 ? lowStockCount : undefined,
        }}
      />
      <Tabs.Screen name="reports"    options={{ href: null }} />
      <Tabs.Screen name="expenses"   options={{ href: null }} />
      <Tabs.Screen name="customers"  options={{ href: null }} />
      <Tabs.Screen name="suppliers"  options={{ href: null }} />
      <Tabs.Screen
        name="settings"
        options={{
          title: t.nav.profile,
          tabBarIcon: ({ color, size }) => <Ionicons name="person-circle" size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
