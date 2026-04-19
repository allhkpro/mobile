import { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, Modal, StyleSheet, Alert as RNAlert,
} from "react-native";
import { Colors } from "../../constants/theme";
import { LabelType, AlertType, LabelPayload } from "../../services/alerts";

const CORRECTED_CLASSES: { label: string; value: AlertType }[] = [
  { label: "🔥 火灾", value: "fire" },
  { label: "💨 烟雾", value: "smoke" },
  { label: "🫁 跌倒", value: "fall" },
  { label: "👤 陌生人", value: "stranger" },
];

interface Props {
  visible: boolean;
  labelType: LabelType | null;
  currentAlertType: AlertType;
  onSubmit: (payload: LabelPayload) => Promise<void>;
  onClose: () => void;
}

export default function LabelModal({ visible, labelType, currentAlertType, onSubmit, onClose }: Props) {
  const [note, setNote] = useState("");
  const [corrected, setCorrected] = useState<AlertType | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    if (!labelType) return;
    if (labelType === "wrong_class" && !corrected) {
      RNAlert.alert("请选择正确的类别");
      return;
    }
    setSubmitting(true);
    try {
      await onSubmit({
        label_type: labelType,
        corrected_class: labelType === "wrong_class" ? corrected ?? undefined : undefined,
        note: note.trim() || undefined,
      });
      setNote("");
      setCorrected(null);
      onClose();
    } catch (e) {
      RNAlert.alert("提交失败", String(e));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>提交标注</Text>

          {labelType === "wrong_class" && (
            <>
              <Text style={styles.section}>正确类别</Text>
              <View style={styles.row}>
                {CORRECTED_CLASSES.filter((c) => c.value !== currentAlertType).map((c) => (
                  <TouchableOpacity
                    key={c.value}
                    style={[styles.chip, corrected === c.value && styles.chipActive]}
                    onPress={() => setCorrected(c.value)}
                  >
                    <Text style={styles.chipText}>{c.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}

          <Text style={styles.section}>备注（可选）</Text>
          <TextInput
            style={styles.input}
            value={note}
            onChangeText={setNote}
            multiline
            maxLength={500}
            placeholder="补充说明"
            placeholderTextColor="#666"
          />

          <View style={styles.actions}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose} disabled={submitting}>
              <Text style={styles.cancelText}>取消</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={submitting}>
              <Text style={styles.submitText}>{submitting ? "提交中..." : "提交"}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.7)", justifyContent: "flex-end" },
  card: { backgroundColor: "#1c1c1e", padding: 20, borderTopLeftRadius: 16, borderTopRightRadius: 16 },
  title: { color: "#fff", fontSize: 18, fontWeight: "600", marginBottom: 16 },
  section: { color: Colors.textSecondary ?? "#8E8E93", fontSize: 13, marginTop: 10, marginBottom: 6 },
  row: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.06)" },
  chipActive: { backgroundColor: Colors.cyan ?? "#0A84FF" },
  chipText: { color: "#fff", fontSize: 13 },
  input: {
    backgroundColor: "rgba(255,255,255,0.06)",
    color: "#fff",
    padding: 12,
    borderRadius: 8,
    minHeight: 70,
    textAlignVertical: "top",
  },
  actions: { flexDirection: "row", gap: 12, marginTop: 20 },
  cancelBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.08)", alignItems: "center" },
  submitBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: Colors.cyan ?? "#0A84FF", alignItems: "center" },
  cancelText: { color: "#fff", fontSize: 15 },
  submitText: { color: "#fff", fontSize: 15, fontWeight: "600" },
});
