import { useCallback, useState } from "react";
import { ScrollView, View, Text, Pressable, RefreshControl, ActivityIndicator, Alert, StyleSheet } from "react-native";
import { useLocalSearchParams, useFocusEffect, useRouter } from "expo-router";
import { getOrder, cancelOrder, OrderDetail } from "../../services/orders";
import { OrderStatusTimeline } from "../../components/service/OrderStatusTimeline";
import { EngineerCard } from "../../components/service/EngineerCard";
import { CurrencyText } from "../../components/service/CurrencyText";
import { PaymentStatusBadge } from "../../components/service/PaymentStatusBadge";
import { useOrderUpdates } from "../../hooks/useOrderUpdates";

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    try {
      setOrder(await getOrder(id));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [id]);

  useFocusEffect(useCallback(() => { load(); }, [load]));
  useOrderUpdates(order?.home_id, () => load());

  if (loading && !order) return <View style={styles.center}><ActivityIndicator color="#fff" /></View>;
  if (!order) return <View style={styles.center}><Text style={{ color: "#fff" }}>加载失败</Text></View>;

  const canPay = order.payment_status === "quoted" || order.payment_status === "partially_paid";
  const canCancel = order.status === "pending" && order.payments.every(p => p.status !== "paid");

  async function onCancel() {
    Alert.alert("确认取消", "取消后无法恢复。继续？", [
      { text: "返回", style: "cancel" },
      {
        text: "确认取消",
        style: "destructive",
        onPress: async () => {
          try {
            await cancelOrder(id!);
            load();
          } catch (e: any) {
            Alert.alert("取消失败", e?.response?.data?.detail ?? String(e));
          }
        },
      },
    ]);
  }

  const TYPE_LABEL: Record<string, string> = {
    repair: "维修", install: "安装", debug: "调试", consult: "咨询",
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ padding: 16, gap: 16 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor="#fff" />}
    >
      <View style={styles.section}>
        <Text style={styles.title}>{TYPE_LABEL[order.type] ?? order.type}</Text>
        <Text style={styles.desc}>{order.description}</Text>
        <View style={{ marginTop: 8 }}><PaymentStatusBadge status={order.payment_status} /></View>
      </View>

      <View style={styles.section}>
        <Text style={styles.h2}>状态</Text>
        <OrderStatusTimeline order={order} />
      </View>

      {order.engineer && (
        <View style={styles.section}>
          <Text style={styles.h2}>服务师傅</Text>
          <EngineerCard engineer={order.engineer} />
        </View>
      )}

      {order.quoted_amount != null && (
        <View style={styles.section}>
          <Text style={styles.h2}>报价</Text>
          <CurrencyText cents={order.quoted_amount} style={styles.bigAmount} />
        </View>
      )}

      {canPay && (
        <Pressable style={styles.payBtn} onPress={() => router.push(`/(service)/pay/${id}`)}>
          <Text style={styles.payBtnText}>
            支付 <CurrencyText cents={order.quoted_amount ?? 0} prefix="¥" />
          </Text>
        </Pressable>
      )}

      {order.payments.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.h2}>收款记录</Text>
          {order.payments.map((p) => (
            <View key={p.id} style={styles.payment}>
              <CurrencyText cents={p.amount_cents} style={styles.paymentAmount} />
              <Text style={styles.paymentMeta}>
                {p.method} · {p.status === "paid" ? "已支付" : "待支付"}{p.paid_at ? ` · ${new Date(p.paid_at).toLocaleString("zh-CN")}` : ""}
              </Text>
              <Text style={styles.mockBadge}>🧪 mock 演示，未实际扣款</Text>
            </View>
          ))}
        </View>
      )}

      {canCancel && (
        <Pressable style={styles.cancelBtn} onPress={onCancel}>
          <Text style={styles.cancelText}>取消订单</Text>
        </Pressable>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0A0A0B" },
  center: { flex: 1, backgroundColor: "#0A0A0B", justifyContent: "center", alignItems: "center" },
  section: { backgroundColor: "rgba(255,255,255,0.04)", borderRadius: 12, padding: 14 },
  title: { color: "#fff", fontSize: 20, fontWeight: "700" },
  desc: { color: "rgba(255,255,255,0.7)", fontSize: 14, marginTop: 8 },
  h2: { color: "#fff", fontSize: 14, fontWeight: "600", marginBottom: 12 },
  bigAmount: { color: "#D4AF37", fontSize: 28, fontWeight: "700" },
  payBtn: { backgroundColor: "#4ed4ff", padding: 18, borderRadius: 12, alignItems: "center" },
  payBtnText: { color: "#000", fontSize: 16, fontWeight: "700" },
  payment: { borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.06)", paddingTop: 8, marginTop: 8 },
  paymentAmount: { color: "#fff", fontSize: 18, fontWeight: "600" },
  paymentMeta: { color: "rgba(255,255,255,0.5)", fontSize: 12, marginTop: 4 },
  mockBadge: { color: "#D4AF37", fontSize: 11, marginTop: 4, fontStyle: "italic" },
  cancelBtn: { padding: 14, borderRadius: 10, borderWidth: 1, borderColor: "rgba(212,58,58,0.5)", alignItems: "center" },
  cancelText: { color: "#d43a3a", fontSize: 14 },
});
