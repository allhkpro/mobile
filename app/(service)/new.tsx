import { useState } from "react";
import { ScrollView, View, Text, TextInput, Pressable, Alert, StyleSheet, ActivityIndicator } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { createOrder, OrderType } from "../../services/orders";
import { useAuthStore } from "../../stores/auth";

const TYPE_OPTIONS: { key: OrderType; label: string }[] = [
  { key: "repair",  label: "维修" },
  { key: "install", label: "安装" },
  { key: "debug",   label: "调试" },
  { key: "consult", label: "咨询" },
];

export default function NewOrder() {
  const router = useRouter();
  const params = useLocalSearchParams<{ type?: OrderType; context_alert_id?: string }>();
  const homeId = useAuthStore((s) => s.profile?.homes[0]?.id);
  const homeAddress = useAuthStore((s) => s.profile?.homes[0] as any)?.address ?? "(未设置)";

  const [type, setType] = useState<OrderType>(params.type ?? "repair");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit() {
    if (!homeId) return Alert.alert("没有可用的家庭信息");
    if (description.trim().length < 5) return Alert.alert("请简单描述问题（至少 5 字）");
    setSubmitting(true);
    try {
      const order = await createOrder({
        home_id: homeId,
        type,
        description: description.trim(),
        context_alert_id: params.context_alert_id,
      });
      router.replace(`/(service)/${order.id}`);
    } catch (e: any) {
      Alert.alert("提交失败", e?.response?.data?.detail ?? String(e));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16 }}>
      <Text style={styles.label}>服务类型</Text>
      <View style={styles.chips}>
        {TYPE_OPTIONS.map((opt) => (
          <Pressable
            key={opt.key}
            style={[styles.chip, type === opt.key && styles.chipActive]}
            onPress={() => setType(opt.key)}
          >
            <Text style={[styles.chipText, type === opt.key && styles.chipTextActive]}>
              {opt.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.label}>问题描述 *</Text>
      <TextInput
        style={styles.textarea}
        placeholder="客厅吊灯一路灯坏了，开关有反应但灯不亮"
        placeholderTextColor="rgba(255,255,255,0.3)"
        multiline
        maxLength={300}
        value={description}
        onChangeText={setDescription}
      />
      <Text style={styles.hint}>{description.length}/300</Text>

      <Text style={styles.label}>地址</Text>
      <View style={styles.addressBox}>
        <Text style={styles.addressText}>📍 {homeAddress}</Text>
      </View>

      <Pressable
        style={[styles.btn, submitting && styles.btnDisabled]}
        onPress={onSubmit}
        disabled={submitting}
      >
        {submitting
          ? <ActivityIndicator color="#000" />
          : <Text style={styles.btnText}>提交报修</Text>}
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0A0A0B" },
  label: { color: "rgba(255,255,255,0.6)", fontSize: 13, marginTop: 16, marginBottom: 8 },
  chips: { flexDirection: "row", gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.06)" },
  chipActive: { backgroundColor: "#4ed4ff" },
  chipText: { color: "#fff", fontSize: 13 },
  chipTextActive: { color: "#000", fontWeight: "600" },
  textarea: {
    backgroundColor: "rgba(255,255,255,0.04)",
    color: "#fff", padding: 14, borderRadius: 10, fontSize: 14,
    minHeight: 100, textAlignVertical: "top",
  },
  hint: { color: "rgba(255,255,255,0.4)", fontSize: 11, textAlign: "right", marginTop: 4 },
  addressBox: { backgroundColor: "rgba(255,255,255,0.04)", padding: 14, borderRadius: 10 },
  addressText: { color: "#fff", fontSize: 14 },
  btn: { backgroundColor: "#4ed4ff", padding: 16, borderRadius: 10, alignItems: "center", marginTop: 32 },
  btnDisabled: { opacity: 0.5 },
  btnText: { color: "#000", fontSize: 16, fontWeight: "700" },
});
