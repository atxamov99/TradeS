import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";

export const mmkv = {
  getString: async (key: string): Promise<string | null> => {
    return await AsyncStorage.getItem(key);
  },
  setString: async (key: string, value: string): Promise<void> => {
    await AsyncStorage.setItem(key, value);
  },
  delete: async (key: string): Promise<void> => {
    await AsyncStorage.removeItem(key);
  },
  getBoolean: async (key: string): Promise<boolean> => {
    const val = await AsyncStorage.getItem(key);
    return val === "true";
  },
  setBoolean: async (key: string, value: boolean): Promise<void> => {
    await AsyncStorage.setItem(key, value ? "true" : "false");
  },
};

// Shifrlangan saqlash (iOS Keychain / Android Keystore) — faqat sezgir
// ma'lumotlar uchun: JWT access/refresh token va shunga o'xshash credential'lar.
// Oddiy sozlamalar (til, tema, user profili) uchun yuqoridagi `mmkv` yetarli.
export const secureStorage = {
  getString: async (key: string): Promise<string | null> => {
    return await SecureStore.getItemAsync(key);
  },
  setString: async (key: string, value: string): Promise<void> => {
    await SecureStore.setItemAsync(key, value);
  },
  delete: async (key: string): Promise<void> => {
    await SecureStore.deleteItemAsync(key);
  },
};
