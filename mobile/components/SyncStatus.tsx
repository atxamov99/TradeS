import { View, Text } from "react-native";
import { useSyncStore } from "@/store/syncStore";

export function SyncStatus() {
  const { isSyncing, pendingCount, lastError } = useSyncStore();
  if (!isSyncing && pendingCount === 0 && !lastError) return null;

  if (!isSyncing && lastError) {
    return (
      <View style={{ backgroundColor: "rgba(239,68,68,0.25)", borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5 }}>
        <Text style={{ color: "#FCA5A5", fontSize: 11, fontWeight: "700" }} numberOfLines={1}>
          {`⚠ Sinxronlanmadi${pendingCount > 0 ? ` (${pendingCount})` : ""}`}
        </Text>
      </View>
    );
  }

  return (
    <View style={{ backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5 }}>
      <Text style={{ color: "#fff", fontSize: 11, fontWeight: "700" }}>
        {isSyncing ? "⟳ Sync" : `⏳ ${pendingCount}`}
      </Text>
    </View>
  );
}
