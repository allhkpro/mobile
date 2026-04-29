import { Pressable, View, Text, StyleSheet } from "react-native";
import { CurrencyText } from "./CurrencyText";
import { PaymentStatusBadge } from "./PaymentStatusBadge";
import type { OrderListItem as OrderListItemType } from "../../services/orders";

const TYPE_LABEL: Record<string, string> = {
  repair: "维修", install: "安装", debug: "调试", consult: "咨询",
};

const STATUS_COLOR: Record<string, string> = {
  pending: "#f5a623",
  in_progress: "#4a90e2",
  completed: "#50c878",
  cancelled: "#888",
};

export function OrderListItem({ order, onPress }: { order: OrderListItemType; onPress: () => void }) {
  return (
    <Pressable style={styles.row} onPress={onPress}>
      <View style={[styles.dot, { backgroundColor: STATUS_COLOR[order.status] ?? "#888" }]} />
      <View style={{ flex: 1 }}>
        <Text style={styles.title} numberOfLines={1}>
          {TYPE_LABEL[order.type] ?? order.type} · {order.description}
        </Text>
        <View style={styles.meta}>
          {order.quoted_amount != null ? (
            <CurrencyText cents={order.quoted_amount} style={styles.amount} />
          ) : (
            <Text style={styles.unquoted}>未报价</Text>
          )}
          <View style={{ marginLeft: 8 }}>
            <PaymentStatusBadge status={order.payment_status} />
          </View>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.04)",
    padding: 14, borderRadius: 10, marginBottom: 8, gap: 12,
  },
  dot: { width: 8, height: 8, borderRadius: 4 },
  title: { color: "#fff", fontSize: 14, marginBottom: 6 },
  meta: { flexDirection: "row", alignItems: "center" },
  amount: { color: "#D4AF37", fontSize: 13, fontWeight: "600" },
  unquoted: { color: "rgba(255,255,255,0.5)", fontSize: 13 },
});
