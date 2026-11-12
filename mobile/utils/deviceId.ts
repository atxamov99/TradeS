import * as Crypto from "expo-crypto";
import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "trades-device-id";

let cachedId: string | null = null;

// Persisted per-install id so the backend can recognize "this phone logged in
// before" — same purpose as web's utils/deviceId.js (active-devices list +
// new-device login confirmation). Loaded once at startup (app/_layout.tsx)
// and cached in memory so the axios interceptor can read it synchronously.
export async function loadDeviceId(): Promise<string> {
  let id = await AsyncStorage.getItem(STORAGE_KEY);
  if (!id) {
    id = Crypto.randomUUID();
    await AsyncStorage.setItem(STORAGE_KEY, id);
  }
  cachedId = id;
  return id;
}

export function getDeviceId(): string | null {
  return cachedId;
}
