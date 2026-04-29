import { View, Text, StyleSheet } from "react-native";

const META: Record<string, { label: string; bg: string; fg: string }> = {
  not_quoted:     { label: "未报价",   bg: "#333",     fg: "#bbb"     },
  quoted:         { label: "待支付",   bg: "#3a2f0d",  fg: "#D4AF37"  },
  partially_paid: { label: "部分支付", bg: "#2a3a0d",  fg: "#8fd43a"  },
  paid:           { label: "已支付",   bg: "#0d3a2a",  fg: "#3ad4a0"  },
  cancelled:      { label: "已取消",   bg: "#3a0d0d",  fg: "#d43a3a"  },
};

export function PaymentStatusBadge({ status }: { status: string }) {
  const m = META[status] ?? { label: status, bg: "#333", fg: "#bbb" };
  return (
    <View style={[styles.pill, { backgroundColor: m.bg }]}>
      <Text style={[styles.text, { color: m.fg }]}>{m.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4, alignSelf: "flex-start" },
  text: { fontSize: 11, fontWeight: "600" },
});
