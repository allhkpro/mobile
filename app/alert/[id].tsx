import { useEffect, useState } from "react";
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator, Alert as RNAlert } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { Image } from "expo-image";
import { AlertDetail, getAlert, LabelType, LabelPayload } from "../../services/alerts";
import { useAlertsStore } from "../../stores/alerts";
import LabelModal from "../../components/alerts/LabelModal";
import VideoClip from "../../components/alerts/VideoClip";
import { Colors } from "../../constants/theme";

const TYPE_EMOJI: Record<string, string> = { fire: "🔥", smoke: "💨", fall: "🫁", stranger: "👤" };
const TYPE_NAME: Record<string, string> = { fire: "火灾", smoke: "烟雾", fall: "跌倒", stranger: "陌生人" };

export default function AlertDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [alert, setAlert] = useState<AlertDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [modalType, setModalType] = useState<LabelType | null>(null);
  const applyLabel = useAlertsStore((s) => s.applyLabel);

  useEffect(() => {
    if (!id) return;
    getAlert(id).then((a) => { setAlert(a); setLoading(false); })
      .catch((e) => { RNAlert.alert("加载失败", String(e)); setLoading(false); });
  }, [id]);

  async function handleLabel(payload: LabelPayload) {
    if (!id) return;
    await applyLabel(id, payload);
    // also refresh local alert
    const fresh = await getAlert(id);
    setAlert(fresh);
  }

  if (loading) {
    return <View style={styles.center}><ActivityIndicator color="#fff" /></View>;
  }
  if (!alert) {
    return <View style={styles.center}><Text style={styles.err}>未找到</Text></View>;
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
          <Text style={styles.closeText}>✕</Text>
        </TouchableOpacity>
      </View>

      {alert.frame_url ? (
        <Image source={{ uri: alert.frame_url }} style={styles.hero} contentFit="cover" />
      ) : (
        <View style={[styles.hero, styles.heroPlaceholder]}><Text style={styles.placeholderText}>无缩略图</Text></View>
      )}

      {alert.clip_url && <VideoClip url={alert.clip_url} />}

      <View style={styles.metaBlock}>
        <Text style={styles.title}>
          {TYPE_EMOJI[alert.alert_type]} {TYPE_NAME[alert.alert_type]} · {alert.severity} · {new Date(alert.triggered_at).toLocaleString("zh-CN")}
        </Text>
        <Text style={styles.sub}>{alert.camera_name} · 模型 {alert.vlm_model_version}</Text>
      </View>

      <View style={styles.verdictBlock}>
        <Text style={styles.sectionTitle}>VLM 判决</Text>
        <View style={styles.jsonBox}>
          <Text style={styles.jsonText}>{JSON.stringify(alert.verdict, null, 2)}</Text>
        </View>
      </View>

      <View style={styles.labelBlock}>
        <Text style={styles.sectionTitle}>标注</Text>
        {alert.label_type && (
          <Text style={styles.existingLabel}>
            当前标注: {alert.label_type}{alert.corrected_class ? ` → ${alert.corrected_class}` : ""}
            {alert.label_note ? ` · ${alert.label_note}` : ""}
          </Text>
        )}
        <View style={styles.btnRow}>
          <TouchableOpacity style={[styles.btn, styles.btnCorrect]} onPress={() => setModalType("correct")}>
            <Text style={styles.btnText}>✓ 识别正确</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.btn, styles.btnFalse]} onPress={() => setModalType("false_positive")}>
            <Text style={styles.btnText}>✗ 误报</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.btnRow}>
          <TouchableOpacity style={[styles.btn, styles.btnMiss]} onPress={() => setModalType("miss_reported")}>
            <Text style={styles.btnText}>+ 漏报</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.btn, styles.btnWrong]} onPress={() => setModalType("wrong_class")}>
            <Text style={styles.btnText}>⟲ 分类错误</Text>
          </TouchableOpacity>
        </View>
      </View>

      <LabelModal
        visible={modalType !== null}
        labelType={modalType}
        currentAlertType={alert.alert_type}
        onSubmit={async (p) => { await handleLabel(p); }}
        onClose={() => setModalType(null)}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background ?? "#000" },
  header: { padding: 12, alignItems: "flex-start" },
  closeBtn: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.08)" },
  closeText: { color: "#fff", fontSize: 18 },
  hero: { width: "100%", aspectRatio: 16 / 9, backgroundColor: "#111" },
  heroPlaceholder: { alignItems: "center", justifyContent: "center" },
  placeholderText: { color: "#555" },
  metaBlock: { padding: 16 },
  title: { color: "#fff", fontSize: 16, fontWeight: "600" },
  sub: { color: Colors.textSecondary ?? "#8E8E93", fontSize: 13, marginTop: 4 },
  verdictBlock: { padding: 16 },
  sectionTitle: { color: Colors.textSecondary ?? "#8E8E93", fontSize: 13, marginBottom: 8 },
  jsonBox: { backgroundColor: "rgba(255,255,255,0.04)", padding: 12, borderRadius: 8 },
  jsonText: { color: "#ddd", fontSize: 12, fontFamily: "Menlo" },
  labelBlock: { padding: 16 },
  existingLabel: { color: "#34C759", fontSize: 13, marginBottom: 12 },
  btnRow: { flexDirection: "row", gap: 10, marginBottom: 10 },
  btn: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: "center" },
  btnCorrect: { backgroundColor: "rgba(52,199,89,0.2)" },
  btnFalse: { backgroundColor: "rgba(255,59,48,0.2)" },
  btnMiss: { backgroundColor: "rgba(255,149,0,0.2)" },
  btnWrong: { backgroundColor: "rgba(10,132,255,0.2)" },
  btnText: { color: "#fff", fontSize: 14 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  err: { color: "#FF3B30", fontSize: 14 },
});
