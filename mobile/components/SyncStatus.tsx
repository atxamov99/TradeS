import { View, Text } from "react-native";
import { useSyncStore } from "@/store/syncStore";

export function SyncStatus() {
  const { isSyncing, pendingCount } = useSyncStore();
  if (!isSyncing && pendingCount === 0) return null;
  return (
    <View style={{ backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5 }}>
      <Text style={{ color: "#fff", fontSize: 11, fontWeight: "700" }}>
        {isSyncing ? "⟳ Sync" : `⏳ ${pendingCount}`}
      </Text>
    </View>
  );
}
