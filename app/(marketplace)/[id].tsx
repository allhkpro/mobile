import { useEffect, useState } from "react";
import { ScrollView, View, Text, Pressable, StyleSheet, ActivityIndicator, Alert } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  getSkill,
  installSkill,
  listInstallations,
  uninstallSkill,
  SkillDetail,
} from "../../services/marketplace";
import { useAuthStore } from "../../stores/auth";
import { Colors } from "../../constants/theme";

const TYPE_LABEL: Record<string, string> = {
  light: "灯", blind: "窗帘", window: "窗户", aircon: "空调",
};

export default function SkillDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const homeId = useAuthStore((s) => s.profile?.homes[0]?.id);
  const [skill, setSkill] = useState<SkillDetail | null>(null);
  const [installationId, setInstallationId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!id || !homeId) return;
    Promise.all([
      getSkill(id, homeId),
      listInstallations(homeId),
    ]).then(([sk, installs]) => {
      setSkill(sk);
      const found = installs.find((i) => i.skill.id === id);
      setInstallationId(found?.id ?? null);
    }).catch(() => {
      // Silent fail to empty state — fix in v2 with toast
    });
  }, [id, homeId]);

  if (!skill) {
    return <View style={s.center}><ActivityIndicator color={Colors.t2} /></View>;
  }

  const isInstalled = !!installationId;
  const requiredDevices: string[] = (skill.scene_template?.actions ?? [])
    .map((a: any) => `${a.device_match?.room ?? ""} ${TYPE_LABEL[a.device_match?.type] ?? a.device_match?.type ?? ""}`);
  const actionsDescr: string[] = (skill.scene_template?.actions ?? [])
    .map((a: any) => describeAction(a));

  const onInstall = async () => {
    if (!homeId) return;
    setBusy(true);
    try {
      await installSkill(homeId, skill.id);
      router.replace("/(marketplace)/installed");
    } catch (e: any) {
      Alert.alert("安装失败", e?.response?.data?.detail ?? "请稍后再试");
    } finally {
      setBusy(false);
    }
  };

  const onUninstall = async () => {
    if (!installationId) return;
    Alert.alert("卸载这个技能？", "对应的场景也会被删除", [
      { text: "取消", style: "cancel" },
      {
        text: "卸载",
        style: "destructive",
        onPress: async () => {
          setBusy(true);
          try {
            await uninstallSkill(installationId);
            router.back();
          } catch (e: any) {
            Alert.alert("卸载失败", e?.response?.data?.detail ?? "请稍后再试");
          } finally {
            setBusy(false);
          }
        },
      },
    ]);
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: Colors.bg }}
      contentContainerStyle={{ padding: 16 }}
    >
      <Text style={s.bigIcon}>{skill.icon}</Text>
      <Text style={s.name}>{skill.name}</Text>
      <Text style={s.desc}>{skill.description}</Text>
      {skill.source === "ai_generated" && (
        <Text style={s.privateBadge}>· 你创建 · 仅自己可见</Text>
      )}

      <Text style={s.sectionTitle}>包含</Text>
      {actionsDescr.map((line, i) => (
        <Text key={i} style={s.sectionItem}>• {line}</Text>
      ))}
      <Text style={s.sectionItem}>• 跟 AI 助手对话也能触发</Text>

      <Text style={s.sectionTitle}>需要</Text>
      {requiredDevices.length === 0 ? (
        <Text style={s.sectionItem}>无设备依赖</Text>
      ) : (
        requiredDevices.map((d, i) => (
          <Text key={i} style={s.sectionItem}>• {d}</Text>
        ))
      )}

      <Pressable
        style={[s.btn, isInstalled ? s.btnUninstall : s.btnInstall, busy && { opacity: 0.5 }]}
        onPress={isInstalled ? onUninstall : onInstall}
        disabled={busy}
      >
        {busy ? (
          <ActivityIndicator color={isInstalled ? Colors.rose : "#fff"} />
        ) : (
          <Text style={[s.btnText, isInstalled && { color: Colors.rose }]}>
            {isInstalled ? "卸载" : "装这个技能"}
          </Text>
        )}
      </Pressable>
    </ScrollView>
  );
}

function describeAction(a: any): string {
  const room = a.device_match?.room ?? "";
  const type = TYPE_LABEL[a.device_match?.type] ?? a.device_match?.type ?? "";
  const ts = a.target_state ?? {};
  if (ts.on === false) return `${room}${type}关闭`;
  if (typeof ts.brightness === "number") return `${room}${type}调至 ${ts.brightness}%`;
  if (typeof ts.position === "number") return `${room}${type}打开到 ${ts.position}%`;
  if (ts.on === true) return `${room}${type}开启`;
  return `${room}${type}`;
}

const s = StyleSheet.create({
  center: {
    flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: Colors.bg,
  },
  bigIcon: { fontSize: 64, textAlign: "center", marginVertical: 16 },
  name: { color: Colors.t1, fontSize: 22, fontWeight: "700", textAlign: "center" },
  desc: { color: Colors.t2, fontSize: 13, textAlign: "center", marginTop: 8, lineHeight: 20 },
  privateBadge: { color: Colors.t3, fontSize: 11, textAlign: "center", marginTop: 4 },
  sectionTitle: { color: Colors.t1, fontSize: 14, fontWeight: "700", marginTop: 24, marginBottom: 8 },
  sectionItem: { color: Colors.t2, fontSize: 13, lineHeight: 22 },
  btn: { paddingVertical: 16, borderRadius: 14, marginTop: 32, alignItems: "center" },
  btnInstall: { backgroundColor: Colors.purple },
  btnUninstall: { backgroundColor: "transparent", borderWidth: 1, borderColor: Colors.rose },
  btnText: { color: "#fff", fontSize: 15, fontWeight: "700" },
});
