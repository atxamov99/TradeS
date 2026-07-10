import { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/hooks/useTheme";
import { useT } from "@/hooks/useT";

interface BarcodeScannerProps {
  onScanned: (barcode: string) => void;
  onClose: () => void;
}

export function BarcodeScanner({ onScanned, onClose }: BarcodeScannerProps) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const { c } = useTheme();
  const t = useT();

  if (!permission) return <View style={{ flex: 1, backgroundColor: c.bg }} />;

  if (!permission.granted) {
    return (
      <View style={{ flex: 1, backgroundColor: c.bg, alignItems: "center", justifyContent: "center", padding: 32 }}>
        <Ionicons name="camera" size={64} color={c.border} style={{ marginBottom: 20 }} />
        <Text style={{ color: c.text, fontSize: 18, fontWeight: "800", textAlign: "center", marginBottom: 8 }}>
          {t.scanner.permissionTitle}
        </Text>
        <Text style={{ color: c.textMuted, textAlign: "center", marginBottom: 24 }}>
          {t.scanner.permissionDesc}
        </Text>
        <TouchableOpacity
          onPress={requestPermission}
          style={{ backgroundColor: c.primary, borderRadius: 14, paddingHorizontal: 24, paddingVertical: 14 }}
        >
          <Text style={{ color: "#fff", fontWeight: "800", fontSize: 16 }}>{t.scanner.allow}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onClose} style={{ marginTop: 16 }}>
          <Text style={{ color: c.textMuted, fontSize: 15 }}>{t.scanner.cancel}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <CameraView
        style={StyleSheet.absoluteFillObject}
        facing="back"
        barcodeScannerSettings={{ barcodeTypes: ["ean13", "ean8", "qr", "code128", "code39", "upc_a", "upc_e"] }}
        onBarcodeScanned={scanned ? undefined : ({ data }) => {
          setScanned(true);
          onScanned(data);
        }}
      />
      <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)" }}>
        <View style={{ paddingTop: 56, paddingHorizontal: 20, flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <Text style={{ color: "#fff", fontSize: 18, fontWeight: "800" }}>{t.scanner.title}</Text>
          <TouchableOpacity onPress={onClose} style={{ width: 40, height: 40, backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 20, alignItems: "center", justifyContent: "center" }}>
            <Ionicons name="close" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <View style={{ width: 260, height: 160, borderRadius: 16, borderWidth: 2, borderColor: "#fff" }}>
            {[
              { top: -2, left: -2 },
              { top: -2, right: -2 },
              { bottom: -2, left: -2 },
              { bottom: -2, right: -2 },
            ].map((pos, i) => (
              <View key={i} style={[{ position: "absolute", width: 24, height: 24, borderColor: c.primary, borderWidth: 3 }, pos,
                i === 0 && { borderRightWidth: 0, borderBottomWidth: 0, borderTopLeftRadius: 8 },
                i === 1 && { borderLeftWidth: 0, borderBottomWidth: 0, borderTopRightRadius: 8 },
                i === 2 && { borderRightWidth: 0, borderTopWidth: 0, borderBottomLeftRadius: 8 },
                i === 3 && { borderLeftWidth: 0, borderTopWidth: 0, borderBottomRightRadius: 8 },
              ]} />
            ))}
          </View>
          <Text style={{ color: "rgba(255,255,255,0.7)", marginTop: 20, fontSize: 14 }}>
            {t.scanner.align}
          </Text>
        </View>

        {scanned && (
          <View style={{ padding: 20 }}>
            <TouchableOpacity
              onPress={() => setScanned(false)}
              style={{ backgroundColor: "#fff", borderRadius: 14, height: 52, alignItems: "center", justifyContent: "center" }}
            >
              <Text style={{ color: "#1B211A", fontWeight: "800", fontSize: 16 }}>{t.scanner.rescan}</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}
