import { View, Text, StyleSheet } from "react-native";
import type { OrderDetail } from "../../services/orders";

const STEPS = [
  { key: "created",     label: "已下单"   },
  { key: "accepted",    label: "已接单"   },
  { key: "quoted",      label: "已报价"   },
  { key: "paid",        label: "已支付"   },
  { key: "completed",   label: "已完成"   },
] as const;

export function OrderStatusTimeline({ order }: { order: OrderDetail }) {
  // Compute which step we're at (0-4)
  let activeStep = 0;
  if (order.engineer) activeStep = 1;
  if (order.payment_status === "quoted" || order.payment_status === "partially_paid")
    activeStep = 2;
  if (order.payment_status === "paid") activeStep = 3;
  if (order.status === "completed") activeStep = 4;

  if (order.status === "cancelled") {
    return <Text style={styles.cancelled}>● 工单已取消</Text>;
  }

  return (
    <View style={styles.col}>
      {STEPS.map((s, i) => {
        const reached = i <= activeStep;
        return (
          <View key={s.key} style={styles.row}>
            <View style={[styles.dot, reached ? styles.dotOn : styles.dotOff]} />
            <Text style={[styles.label, reached ? styles.labelOn : styles.labelOff]}>
              {s.label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  col: { gap: 12 },
  row: { flexDirection: "row", alignItems: "center" },
  dot: { width: 12, height: 12, borderRadius: 6, marginRight: 12 },
  dotOn:  { backgroundColor: "#50c878" },
  dotOff: { backgroundColor: "rgba(255,255,255,0.2)" },
  label: { fontSize: 14 },
  labelOn:  { color: "#fff" },
  labelOff: { color: "rgba(255,255,255,0.4)" },
  cancelled: { color: "#d43a3a", fontSize: 14 },
});
