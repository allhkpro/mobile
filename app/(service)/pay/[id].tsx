import { useState, useEffect } from "react";
import { Alert, ActivityIndicator, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { PaymentSheet } from "../../../components/service/PaymentSheet";
import { PaymentLoading } from "../../../components/service/PaymentLoading";
import { PaymentSuccess } from "../../../components/service/PaymentSuccess";
import { getOrder, payOrder, PayMethod } from "../../../services/orders";

type Stage = "sheet" | "loading" | "success";

export default function PayScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [stage, setStage] = useState<Stage>("sheet");
  const [amountCents, setAmountCents] = useState<number | null>(null);
  const [method, setMethod] = useState<PayMethod>("wechat");
  const [busy, setBusy] = useState(false);

  // Load remaining-balance amount on mount
  useEffect(() => {
    if (!id) return;
    getOrder(id).then((o) => {
      // For v1: total quoted - already paid
      const paidSum = o.payments.filter(p => p.status === "paid").reduce((acc, p) => acc + p.amount_cents, 0);
      setAmountCents((o.quoted_amount ?? 0) - paidSum);
    }).catch(() => router.back());
  }, [id]);

  async function onPay(m: PayMethod) {
    if (!id || busy) return;
    setMethod(m);
    setBusy(true);
    setStage("loading");
    const startedAt = Date.now();
    try {
      await payOrder(id, m);
      // Pad to 1.5s minimum for cosmetic effect
      const elapsed = Date.now() - startedAt;
      if (elapsed < 1500) await new Promise(r => setTimeout(r, 1500 - elapsed));
      setStage("success");
    } catch (e: any) {
      setStage("sheet");
      Alert.alert("支付失败", e?.response?.data?.detail ?? String(e));
    } finally {
      setBusy(false);
    }
  }

  if (amountCents == null) {
    return <View style={{ flex: 1, backgroundColor: "#0A0A0B", justifyContent: "center" }}>
      <ActivityIndicator color="#fff" />
    </View>;
  }

  if (stage === "sheet") {
    return (
      <PaymentSheet
        amountCents={amountCents}
        onPay={onPay}
        onCancel={() => router.back()}
        busy={busy}
      />
    );
  }

  if (stage === "loading") {
    return <PaymentLoading amountCents={amountCents} method={method} />;
  }

  return (
    <PaymentSuccess
      amountCents={amountCents}
      method={method}
      onDismiss={() => router.replace(`/(service)/${id}`)}
    />
  );
}
