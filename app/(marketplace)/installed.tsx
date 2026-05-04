import { useCallback, useState } from "react";
import { ScrollView, View, Text, Pressable, StyleSheet } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { listInstallations, Installation } from "../../services/marketplace";
import { useAuthStore } from "../../stores/auth";
import { Colors } from "../../constants/theme";

export default function InstalledList() {
  const router = useRouter();
  const homeId = useAuthStore((s) => s.profile?.homes[0]?.id);
  const [items, setItems] = useState<Installation[]>([]);

  useFocusEffect(useCallback(() => {
    if (homeId) listInstallations(homeId).then(setItems);
  }, [homeId]));

  return (
    <ScrollView style={{ flex: 1, backgroundColor: Colors.bg }}
                contentContainerStyle={{ padding: 16 }}>
      {items.length === 0 ? (
        <Text style={s.empty}>还没装任何 AI 应用</Text>
      ) : (
        items.map((i) => (
          <Pressable key={i.id} style={s.row}
                     onPress={() => router.push(`/(marketplace)/${i.skill.id}?installed=1`)}>
            <Text style={s.icon}>{i.skill.icon}</Text>
            <View style={{ flex: 1 }}>
              <Text style={s.name}>{i.skill.name}</Text>
              <Text style={s.cat}>{i.skill.category} · 已装</Text>
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
  row: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14,
    backgroundColor: Colors.card, borderRadius: 12, borderWidth: 1,
    borderColor: Colors.border, marginBottom: 8 },
  icon: { fontSize: 28 },
  name: { color: Colors.t1, fontSize: 14, fontWeight: "700" },
  cat: { color: Colors.t3, fontSize: 11, marginTop: 2 },
  chev: { color: Colors.t3, fontSize: 18 },
});
