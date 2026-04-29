import { useEffect, useState } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { CurrencyText } from "./CurrencyText";

const METHOD_LABEL: Record<string, string> = {
  wechat: "微信支付", alipay: "支付宝", balance: "余额支付",
};

type Props = {
  amountCents: number;
  method: string;
  onDismiss: () => void;
};

export function PaymentSuccess({ amountCents, method, onDismiss }: Props) {
  const [seconds, setSeconds] = useState(3);

  useEffect(() => {
    const tid = setInterval(() => setSeconds((s) => s - 1), 1000);
    return () => clearInterval(tid);
  }, []);

  useEffect(() => {
    if (seconds <= 0) onDismiss();
  }, [seconds, onDismiss]);

  return (
    <View style={styles.container}>
      <Text style={styles.icon}>✓</Text>
      <Text style={styles.title}>支付成功</Text>
      <CurrencyText cents={amountCents} style={styles.amount} />
      <Text style={styles.method}>{METHOD_LABEL[method] ?? method}</Text>
      <Text style={styles.countdown}>{seconds} 秒后自动返回...</Text>
      <Pressable style={styles.btn} onPress={onDismiss}>
        <Text style={styles.btnText}>立即返回</Text>
      </Pressable>
      <Text style={styles.mockNote}>🧪 v1 演示版本，未实际扣款</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0A0A0B", justifyContent: "center", alignItems: "center", padding: 24 },
  icon: { fontSize: 64, marginBottom: 16, color: "#50c878" },
  title: { color: "#50c878", fontSize: 24, fontWeight: "700", marginBottom: 24 },
  amount: { color: "#fff", fontSize: 36, fontWeight: "700" },
  method: { color: "rgba(255,255,255,0.5)", fontSize: 14, marginTop: 8 },
  countdown: { color: "rgba(255,255,255,0.5)", fontSize: 12, marginTop: 32 },
  btn: { backgroundColor: "rgba(255,255,255,0.1)", paddingHorizontal: 32, paddingVertical: 12, borderRadius: 8, marginTop: 12 },
  btnText: { color: "#fff", fontSize: 14 },
  mockNote: { color: "#D4AF37", fontSize: 11, textAlign: "center", marginTop: 24, fontStyle: "italic" },
});
