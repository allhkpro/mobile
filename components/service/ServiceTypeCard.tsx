import { Pressable, Text, StyleSheet } from "react-native";

type Props = {
  icon: string;
  title: string;
  subtitle?: string;
  onPress: () => void;
};

export function ServiceTypeCard({ icon, title, subtitle, onPress }: Props) {
  return (
    <Pressable style={styles.card} onPress={onPress}>
      <Text style={styles.icon}>{icon}</Text>
      <Text style={styles.title}>{title}</Text>
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    aspectRatio: 1,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
    margin: 6,
  },
  icon: { fontSize: 32, marginBottom: 8 },
  title: { color: "#fff", fontSize: 14, fontWeight: "600" },
  subtitle: { color: "rgba(255,255,255,0.5)", fontSize: 11, marginTop: 4 },
});
