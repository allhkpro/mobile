import { useCallback, useState } from "react";
import { ScrollView, View, Text, Pressable, StyleSheet } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import {
  listConnections,
  ProviderConnection,
} from "../../services/providers";
import { useAuthStore } from "../../stores/auth";
import { Colors } from "../../constants/theme";

export default function ConnectionsList() {
  const router = useRouter();
  const homeId = useAuthStore((s) => s.profile?.homes[0]?.id);
  const [items, setItems] = useState<ProviderConnection[]>([]);

  useFocusEffect(
    useCallback(() => {
      if (homeId) listConnections(homeId).then(setItems);
    }, [homeId]),
  );

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: Colors.bg }}
      contentContainerStyle={{ padding: 16 }}
    >
      {items.length === 0 ? (
        <Text style={s.empty}>还没接入任何品牌设备</Text>
      ) : (
        items.map((c) => (
          <Pressable
            key={c.id}
            style={s.row}
            onPress={() =>
              router.push(`/(marketplace)/providers/${c.provider}` as any)
            }
          >
            <View style={{ flex: 1 }}>
              <Text style={s.name}>{c.provider}</Text>
              <Text style={s.cat}>
                {c.device_count} 个设备 · {c.status}
              </Text>
            </View>
            <Text style={s.chev}>›</Text>
          </Pressable>
        ))
      )}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  empty: { color: Colors.t3, textAlign: "center", padding: 40 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    backgroundColor: Colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 8,
  },
  name: { color: Colors.t1, fontSize: 14, fontWeight: "700" },
  cat: { color: Colors.t3, fontSize: 11, marginTop: 2 },
  chev: { color: Colors.t3, fontSize: 18 },
});
