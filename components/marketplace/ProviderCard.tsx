import { Pressable, Text, StyleSheet } from "react-native";
import { Colors } from "../../constants/theme";

type Skill = {
  id: string;
  name: string;
  icon: string;
  category: string;
  provider_meta?: {
    key: string;
    auth_kind: string;
    connection_status: string | null;
    connection_id: string | null;
  };
};

export function ProviderCard({ item, onPress }: { item: Skill; onPress: () => void }) {
  const isConnected = item.provider_meta?.connection_status === "connected";
  return (
    <Pressable onPress={onPress} style={s.card}>
      <Text style={s.cardIcon}>{item.icon}</Text>
      <Text style={s.cardName} numberOfLines={1}>{item.name}</Text>
      <Text style={[s.cardCat, isConnected && { color: Colors.emerald }]}>
        {isConnected ? "已接入 ✓" : "接入设备"}
      </Text>
    </Pressable>
  );
}

const s = StyleSheet.create({
  card: {
    width: "48%", padding: 16, backgroundColor: Colors.card,
    borderRadius: 14, borderWidth: 1, borderColor: Colors.border,
    alignItems: "center",
  },
  cardIcon: { fontSize: 36, marginBottom: 8 },
  cardName: { color: Colors.t1, fontSize: 14, fontWeight: "700" },
  cardCat: { color: Colors.t3, fontSize: 11, marginTop: 4 },
});
