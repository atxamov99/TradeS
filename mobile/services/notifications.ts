import { Platform } from "react-native";
import Constants from "expo-constants";

export async function registerForPushNotifications(): Promise<void> {
  if (Platform.OS === "web") return;
  // expo-notifications push tokens don't work in Expo Go since SDK 53
  if (Constants.appOwnership === "expo") return;
  try {
    const Notifications = require("expo-notifications");
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== "granted") return;
    const token = await Notifications.getExpoPushTokenAsync();
    const { api } = require("./api");
    await api.post("/user/push-token", { token: token.data });
  } catch {
    // silent fail
  }
}
