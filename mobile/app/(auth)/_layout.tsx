import { Stack } from "expo-router";

export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
      <Stack.Screen name="verify" />
      <Stack.Screen name="verify-email" />
      <Stack.Screen name="pin" />
      <Stack.Screen name="forgot-password" />
    </Stack>
  );
}
