import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from "react-native";
import { Colors } from "../../constants/theme";
import { AlertType } from "../../services/alerts";

const FILTERS: { label: string; value: AlertType | undefined }[] = [
  { label: "全部", value: undefined },
  { label: "🔥 火灾", value: "fire" },
  { label: "💨 烟雾", value: "smoke" },
  { label: "🫁 跌倒", value: "fall" },
  { label: "👤 陌生人", value: "stranger" },
];

interface Props {
  active: AlertType | undefined;
  onChange: (value: AlertType | undefined) => void;
}

export default function AlertFilterBar({ active, onChange }: Props) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.container}>
      {FILTERS.map((f) => {
        const isActive = active === f.value;
        return (
          <TouchableOpacity
            key={f.value ?? "all"}
            onPress={() => onChange(f.value)}
            style={[styles.chip, isActive && styles.chipActive]}
          >
            <Text style={[styles.label, isActive && styles.labelActive]}>{f.label}</Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 12, paddingVertical: 10, gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.06)",
    marginHorizontal: 4,
  },
  chipActive: { backgroundColor: Colors.cyan ?? "#0A84FF" },
  label: { color: Colors.textSecondary ?? "#8E8E93", fontSize: 13 },
  labelActive: { color: "#fff", fontWeight: "600" },
});
