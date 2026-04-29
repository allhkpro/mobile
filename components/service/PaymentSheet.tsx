import { useState } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { CurrencyText } from "./CurrencyText";

type Method = "wechat" | "alipay" | "balance";

const OPTIONS: { key: Method; label: string; icon: string }[] = [
  { key: "wechat",  label: "微信支付", icon: "💚" },
  { key: "alipay",  label: "支付宝",   icon: "💙" },
  { key: "balance", label: "余额支付", icon: "💰" },
];

type Props = {
  amountCents: number;
  onPay: (method: Method) => void;
  onCancel: () => void;
  busy: boolean;
};

export function PaymentSheet({ amountCents, onPay, onCancel, busy }: Props) {
  const [selected, setSelected] = useState<Method>("wechat");

  return (
    <View style={styles.sheet}>
      <Pressable onPress={onCancel} style={styles.close}>
        <Text style={styles.closeText}>✕</Text>
      </Pressable>

      <Text style={styles.label}>待支付金额</Text>
      <CurrencyText cents={amountCents} style={styles.amount} />

      <Text style={styles.section}>选择支付方式</Text>
      {OPTIONS.map((opt) => (
        <Pressable
          key={opt.key}
          style={styles.option}
          onPress={() => setSelected(opt.key)}
        >
          <Text style={styles.optIcon}>{opt.icon}</Text>
          <Text style={styles.optLabel}>{opt.label}</Text>
          <View style={[styles.radio, selected === opt.key && styles.radioActive]} />
        </Pressable>
      ))}

      <Pressable
        style={[styles.payBtn, busy && styles.payBtnDisabled]}
        onPress={() => !busy && onPay(selected)}
        disabled={busy}
      >
        <Text style={styles.payBtnText}>立即支付</Text>
      </Pressable>

      <Text style={styles.mockNote}>🧪 v1 演示版本，未实际扣款</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  sheet: { flex: 1, backgroundColor: "#0A0A0B", padding: 24 },
  close: { alignSelf: "flex-end", padding: 8 },
  closeText: { color: "#fff", fontSize: 24 },
  label: { color: "rgba(255,255,255,0.5)", fontSize: 14, textAlign: "center", marginTop: 12 },
  amount: { color: "#fff", fontSize: 42, fontWeight: "700", textAlign: "center", marginTop: 8 },
  section: { color: "rgba(255,255,255,0.5)", fontSize: 14, marginTop: 32, marginBottom: 12 },
  option: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.04)",
    padding: 16, borderRadius: 10, marginBottom: 8,
  },
  optIcon: { fontSize: 22, marginRight: 12 },
  optLabel: { color: "#fff", fontSize: 16, flex: 1 },
  radio: { width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: "rgba(255,255,255,0.2)" },
  radioActive: { backgroundColor: "#4ed4ff", borderColor: "#4ed4ff" },
  payBtn: { backgroundColor: "#4ed4ff", padding: 16, borderRadius: 10, alignItems: "center", marginTop: 24 },
  payBtnDisabled: { opacity: 0.5 },
  payBtnText: { color: "#000", fontSize: 16, fontWeight: "700" },
  mockNote: { color: "#D4AF37", fontSize: 11, textAlign: "center", marginTop: 12, fontStyle: "italic" },
});
