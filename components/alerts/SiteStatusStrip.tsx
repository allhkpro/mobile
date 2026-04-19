import { View, Text, StyleSheet } from "react-native";
import { Colors } from "../../constants/theme";

interface Props {
  online: boolean;
  storageFreePercent: number | null;
  currentModel: string | null;
}

export default function SiteStatusStrip({ online, storageFreePercent, currentModel }: Props) {
  const dotColor = online ? "#34C759" : "#8E8E93";
  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <View style={[styles.dot, { backgroundColor: dotColor }]} />
        <Text style={styles.text}>{online ? "站点在线" : "站点离线"}</Text>
        {storageFreePercent != null && (
          <Text style={styles.text}>  ·  存储 {storageFreePercent}%</Text>
        )}
        {currentModel && <Text style={styles.text}>  ·  {currentModel}</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 16, paddingVertical: 8, backgroundColor: "rgba(255,255,255,0.03)" },
  row: { flexDirection: "row", alignItems: "center" },
  dot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
  text: { color: Colors.textSecondary ?? "#8E8E93", fontSize: 13 },
});
