import AsyncStorage from "@react-native-async-storage/async-storage";

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
