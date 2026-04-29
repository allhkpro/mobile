import { View, Text, StyleSheet } from "react-native";
import type { EngineerBrief } from "../../services/orders";

export function EngineerCard({ engineer }: { engineer: EngineerBrief }) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.avatar}>👨‍🔧</Text>
        <View style={styles.body}>
          <Text style={styles.name}>{engineer.name}</Text>
          <Text style={styles.title}>{engineer.title ?? "工程师"}</Text>
        </View>
        {engineer.rating != null && (
          <Text style={styles.rating}>⭐ {engineer.rating.toFixed(1)}</Text>
        )}
      </View>
      <Text style={styles.stats}>
        已完成 {engineer.completed_jobs} 单
      </Text>
      {engineer.skills.length > 0 && (
        <View style={styles.skills}>
          {engineer.skills.map((s) => (
            <View key={s} style={styles.skillChip}>
              <Text style={styles.skillText}>{s}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 12,
    padding: 14,
  },
  header: { flexDirection: "row", alignItems: "center" },
  avatar: { fontSize: 32, marginRight: 12 },
  body: { flex: 1 },
  name: { color: "#fff", fontSize: 16, fontWeight: "600" },
  title: { color: "rgba(255,255,255,0.5)", fontSize: 12, marginTop: 2 },
  rating: { color: "#D4AF37", fontSize: 14 },
  stats: { color: "rgba(255,255,255,0.5)", fontSize: 12, marginTop: 8 },
  skills: { flexDirection: "row", flexWrap: "wrap", marginTop: 8, gap: 6 },
  skillChip: { backgroundColor: "rgba(78,212,255,0.1)", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4 },
  skillText: { color: "#4ed4ff", fontSize: 11 },
});
