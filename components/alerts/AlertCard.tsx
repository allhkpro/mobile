import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Image } from "expo-image";
import { Colors } from "../../constants/theme";
import { AlertListItem } from "../../services/alerts";

const TYPE_EMOJI: Record<string, string> = {
  fire: "🔥",
  smoke: "💨",
  fall: "🫁",
  stranger: "👤",
};

const TYPE_NAME_CN: Record<string, string> = {
  fire: "火灾",
  smoke: "烟雾",
  fall: "跌倒",
  stranger: "陌生人",
};

const SEVERITY_COLOR: Record<string, string> = {
  critical: "#FF3B30",
  warning: "#FF9500",
  info: "#8E8E93",
};

function relativeTime(iso: string): string {
  const delta = (Date.now() - new Date(iso).getTime()) / 1000;
  if (delta < 60) return "刚刚";
  if (delta < 3600) return `${Math.floor(delta / 60)} 分钟前`;
  if (delta < 86400) return `${Math.floor(delta / 3600)} 小时前`;
  return new Date(iso).toLocaleString("zh-CN", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

interface Props {
  item: AlertListItem;
  onPress: () => void;
}

export default function AlertCard({ item, onPress }: Props) {
  return (
    <TouchableOpacity onPress={onPress} style={styles.container}>
      <View style={styles.thumb}>
        {item.frame_thumbnail_url ? (
          <Image source={{ uri: item.frame_thumbnail_url }} style={styles.thumbImage} contentFit="cover" />
        ) : (
          <View style={styles.thumbPlaceholder}>
            <Text style={styles.thumbPlaceholderText}>无缩略图</Text>
          </View>
        )}
      </View>
      <View style={styles.body}>
        <View style={styles.row}>
          <Text style={styles.typeText}>
            {TYPE_EMOJI[item.alert_type]} {TYPE_NAME_CN[item.alert_type]}
          </Text>
          <View style={[styles.severityDot, { backgroundColor: SEVERITY_COLOR[item.severity] }]} />
          <Text style={[styles.severityText, { color: SEVERITY_COLOR[item.severity] }]}>
            {item.severity}
          </Text>
        </View>
        <Text style={styles.meta}>{item.camera_name} · {relativeTime(item.triggered_at)}</Text>
        {item.label_type ? (
          <Text style={styles.labelTag}>✓ 已标注</Text>
        ) : (
          <Text style={styles.unlabelTag}>待标注</Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    padding: 12,
    backgroundColor: "rgba(255,255,255,0.04)",
    marginHorizontal: 12,
    marginVertical: 4,
    borderRadius: 12,
  },
  thumb: { width: 80, height: 80, borderRadius: 8, overflow: "hidden", backgroundColor: "#1c1c1e" },
  thumbImage: { width: "100%", height: "100%" },
  thumbPlaceholder: { flex: 1, alignItems: "center", justifyContent: "center" },
  thumbPlaceholderText: { color: "#555", fontSize: 11 },
  body: { flex: 1, marginLeft: 12, justifyContent: "center" },
  row: { flexDirection: "row", alignItems: "center", marginBottom: 4 },
  typeText: { color: Colors.t1, fontSize: 15, fontWeight: "600", marginRight: 8 },
  severityDot: { width: 6, height: 6, borderRadius: 3, marginRight: 4 },
  severityText: { fontSize: 12 },
  meta: { color: Colors.textSecondary ?? "#8E8E93", fontSize: 13, marginBottom: 4 },
  labelTag: { color: "#34C759", fontSize: 11 },
  unlabelTag: { color: "#FF9500", fontSize: 11 },
});
