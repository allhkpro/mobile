import { View, Text, ActivityIndicator, StyleSheet } from "react-native";
import { CurrencyText } from "./CurrencyText";

const METHOD_LABEL: Record<string, string> = {
  wechat: "微信支付", alipay: "支付宝", balance: "余额支付",
};

export function PaymentLoading({ amountCents, method }: { amountCents: number; method: string }) {
  return (
    <View style={styles.container}>
      <Text style={styles.icon}>⏳</Text>
      <Text style={styles.title}>正在支付，请稍候</Text>
      <CurrencyText cents={amountCents} style={styles.amount} />
      <Text style={styles.method}>{METHOD_LABEL[method] ?? method}</Text>
      <ActivityIndicator color="#4ed4ff" size="large" style={{ marginTop: 32 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0A0A0B", justifyContent: "center", alignItems: "center", padding: 24 },
  icon: { fontSize: 56, marginBottom: 24 },
  title: { color: "#fff", fontSize: 18, marginBottom: 32 },
  amount: { color: "#fff", fontSize: 36, fontWeight: "700" },
  method: { color: "rgba(255,255,255,0.5)", fontSize: 14, marginTop: 8 },
});
