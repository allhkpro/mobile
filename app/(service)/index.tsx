import { useCallback, useState } from "react";
import { ScrollView, View, Text, StyleSheet, RefreshControl, Pressable } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { ServiceTypeCard } from "../../components/service/ServiceTypeCard";
import { OrderListItem } from "../../components/service/OrderListItem";
import { listOrders, OrderListItem as OrderType } from "../../services/orders";
import { useOrderUpdates } from "../../hooks/useOrderUpdates";
import { useAuthStore } from "../../stores/auth";

const TYPES = [
  { key: "repair",  icon: "🔧", title: "报修",   subtitle: "设备坏了" },
  { key: "install", icon: "🔌", title: "安装",   subtitle: "新设备就位" },
  { key: "debug",   icon: "⚙",  title: "调试",   subtitle: "联动 / 场景" },
  { key: "consult", icon: "💬", title: "咨询",   subtitle: "选型建议"   },
] as const;

export default function ServiceHome() {
  const router = useRouter();
  const homeId = useAuthStore((s) => s.profile?.homes[0]?.id);
  const [orders, setOrders] = useState<OrderType[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!homeId) return;
    try {
      const r = await listOrders(homeId);
      setOrders(r.items);
    } finally {
      setRefreshing(false);
    }
  }, [homeId]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  useOrderUpdates(homeId, () => { load(); });

  const recent = orders.slice(0, 3);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ padding: 16 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor="#fff" />}
    >
      <Text style={styles.h1}>需要什么帮助？</Text>

      <View style={styles.grid}>
        {TYPES.map((t) => (
          <ServiceTypeCard
            key={t.key}
            icon={t.icon}
            title={t.title}
            subtitle={t.subtitle}
            onPress={() => router.push({ pathname: "/(service)/new", params: { type: t.key } })}
          />
        ))}
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.h2}>我的工单</Text>
          {orders.length > 3 && (
            <Pressable onPress={() => router.push("/(service)/?showAll=1")}>
              <Text style={styles.linkText}>全部 →</Text>
            </Pressable>
          )}
        </View>
        {recent.length === 0 ? (
          <Text style={styles.empty}>还没有工单，从上方选服务类型开始</Text>
        ) : (
          recent.map((o) => (
            <OrderListItem
              key={o.id}
              order={o}
              onPress={() => router.push(`/(service)/${o.id}`)}
            />
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0A0A0B" },
  h1: { color: "#fff", fontSize: 22, fontWeight: "700", marginBottom: 16 },
  grid: { flexDirection: "row", flexWrap: "wrap" },
  section: { marginTop: 24 },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  h2: { color: "#fff", fontSize: 16, fontWeight: "600" },
  linkText: { color: "#4ed4ff", fontSize: 13 },
  empty: { color: "rgba(255,255,255,0.4)", textAlign: "center", padding: 24 },
});
