import { useCallback, useState } from "react";
import { ScrollView, View, Text, Pressable, StyleSheet, RefreshControl } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { listSkills, listInstallations, Skill } from "../../services/marketplace";
import { listConnections } from "../../services/providers";
import { useAuthStore } from "../../stores/auth";
import { Colors } from "../../constants/theme";
import { ProviderCard } from "../../components/marketplace/ProviderCard";

const CATEGORIES = ["全部", "晚安", "早起", "节能", "氛围", "安防"];

const KIND_TABS = [
  { key: "all" as const, label: "全部" },
  { key: "skill" as const, label: "场景包" },
  { key: "provider" as const, label: "接设备" },
];

export default function MarketplaceHome() {
  const router = useRouter();
  const homeId = useAuthStore((s) => s.profile?.homes[0]?.id);
  const [kind, setKind] = useState<"all" | "skill" | "provider">("all");
  const [category, setCategory] = useState<string>("全部");
  const [skills, setSkills] = useState<Skill[]>([]);
  const [installedCount, setInstalledCount] = useState(0);
  const [connectedCount, setConnectedCount] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const [list, installed, conns] = await Promise.all([
        listSkills({
          kind,
          category: kind === "provider" || category === "全部" ? undefined : category,
          home_id: homeId,
        }),
        homeId ? listInstallations(homeId) : Promise.resolve([]),
        homeId ? listConnections(homeId) : Promise.resolve([]),
      ]);
      setSkills(list);
      setInstalledCount(installed.length);
      setConnectedCount(conns.length);
    } finally {
      setRefreshing(false);
    }
  }, [kind, category, homeId]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: Colors.bg }}
      contentContainerStyle={{ padding: 16 }}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => { setRefreshing(true); load(); }}
          tintColor={Colors.t2}
        />
      }
    >
      {/* Top: connected + installed chips */}
      <View style={{ flexDirection: "row", marginBottom: 12, gap: 8 }}>
        <View style={{ flex: 1 }} />
        <Pressable
          style={s.installedChip}
          onPress={() => router.push("/(marketplace)/connections")}
        >
          <Text style={s.installedChipText}>已接 {connectedCount}</Text>
        </Pressable>
        <Pressable
          style={s.installedChip}
          onPress={() => router.push("/(marketplace)/installed")}
        >
          <Text style={s.installedChipText}>已装 {installedCount}</Text>
        </Pressable>
      </View>

      {/* AI generate CTA */}
      <Pressable onPress={() => router.push("/(marketplace)/generate")}>
        <LinearGradient
          colors={[Colors.purple + "30", Colors.purple + "10"]}
          style={s.cta}
        >
          <Text style={s.ctaIcon}>✨</Text>
          <View style={{ flex: 1 }}>
            <Text style={s.ctaTitle}>自己描述创建一个</Text>
            <Text style={s.ctaSub}>告诉 AI 你想要什么</Text>
          </View>
          <Text style={s.ctaChevron}>›</Text>
        </LinearGradient>
      </Pressable>

      {/* Kind chips (first row) */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
        {KIND_TABS.map((k) => (
          <Pressable key={k.key} onPress={() => setKind(k.key)}
                     style={[s.chip, kind === k.key && s.chipActive]}>
            <Text style={[s.chipText, kind === k.key && s.chipTextActive]}>{k.label}</Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Category chips (only for skill kinds; hide on provider chip selected) */}
      {kind !== "provider" && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false}
                    style={{ marginVertical: 14 }}>
          {CATEGORIES.map((c) => (
            <Pressable key={c} onPress={() => setCategory(c)}
                       style={[s.chip, category === c && s.chipActive]}>
              <Text style={[s.chipText, category === c && s.chipTextActive]}>{c}</Text>
            </Pressable>
          ))}
        </ScrollView>
      )}

      {/* Grid: 2-column */}
      <View style={s.grid}>
        {skills.map((sk) => (
          sk.kind === "provider"
            ? <ProviderCard
                key={sk.id} item={sk}
                onPress={() => {
                  if (sk.provider_meta?.key === "knx") {
                    router.push("/(marketplace)/pair-knx-gateway" as any);
                  } else {
                    router.push(`/(marketplace)/providers/${sk.provider_meta?.key}` as any);
                  }
                }}
              />
            : <Pressable key={sk.id} style={s.card}
                         onPress={() => router.push(`/(marketplace)/${sk.id}`)}>
                <Text style={s.cardIcon}>{sk.icon}</Text>
                <Text style={s.cardName} numberOfLines={1}>{sk.name}</Text>
                <Text style={s.cardCat}>{sk.category}</Text>
              </Pressable>
        ))}
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  installedChip: { paddingHorizontal: 12, paddingVertical: 6, backgroundColor: Colors.card,
    borderRadius: 12, borderWidth: 1, borderColor: Colors.border },
  installedChipText: { color: Colors.t2, fontSize: 12 },
  cta: { flexDirection: "row", alignItems: "center", padding: 16, borderRadius: 16, gap: 12 },
  ctaIcon: { fontSize: 28 },
  ctaTitle: { color: Colors.t1, fontSize: 15, fontWeight: "700" },
  ctaSub: { color: Colors.t3, fontSize: 12, marginTop: 2 },
  ctaChevron: { color: Colors.t3, fontSize: 18 },
  chip: { paddingHorizontal: 14, paddingVertical: 6, marginRight: 8,
    backgroundColor: Colors.card, borderRadius: 14, borderWidth: 1, borderColor: Colors.border },
  chipActive: { backgroundColor: Colors.purple + "22", borderColor: Colors.purple + "55" },
  chipText: { color: Colors.t2, fontSize: 12 },
  chipTextActive: { color: Colors.purple, fontWeight: "600" },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  card: { width: "48%", padding: 16, backgroundColor: Colors.card,
    borderRadius: 14, borderWidth: 1, borderColor: Colors.border, alignItems: "center" },
  cardIcon: { fontSize: 36, marginBottom: 8 },
  cardName: { color: Colors.t1, fontSize: 14, fontWeight: "700" },
  cardCat: { color: Colors.t3, fontSize: 11, marginTop: 4 },
});
