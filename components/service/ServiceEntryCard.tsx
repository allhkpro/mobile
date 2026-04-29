import { Pressable, View, Text, StyleSheet } from "react-native";
import { Colors } from "../../constants/theme";

type Props = {
  icon: string;
  title: string;
  subtitle: string;
  onPress: () => void;
};

export function ServiceEntryCard({ icon, title, subtitle, onPress }: Props) {
  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View style={styles.left}>
        <Text style={styles.icon}>{icon}</Text>
      </View>
      <View style={styles.body}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>
      <Text style={styles.arrow}>→</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 14, padding: 16, marginVertical: 8,
  },
  left: { width: 48, alignItems: "center" },
  icon: { fontSize: 28 },
  body: { flex: 1, marginLeft: 12 },
  title: { color: "#fff", fontSize: 15, fontWeight: "600" },
  subtitle: { color: "rgba(255,255,255,0.5)", fontSize: 12, marginTop: 2 },
  arrow: { color: Colors.cyan, fontSize: 20 },
});
