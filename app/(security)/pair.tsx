import { useState } from "react";
import {
  View,
  Text,
  Pressable,
  TextInput,
  ActivityIndicator,
  StyleSheet,
  Alert,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { useAuthStore } from "../../stores/auth";
import { useMDnsScan } from "../../hooks/useMDnsScan";
import {
  DiscoveredSite,
  registerSite,
  pushSetup,
  rotateSiteToken,
} from "../../services/sitePairing";
import { Colors } from "../../constants/theme";

const BACKEND_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL ?? "https://api.aiknx.com";

type Stage = "discover" | "enter-code" | "confirm";

export default function PairScreen() {
  const router = useRouter();
  const homeId = useAuthStore((s) => s.profile?.homes[0]?.id);
  const [stage, setStage] = useState<Stage>("discover");
  const [selected, setSelected] = useState<DiscoveredSite | null>(null);
  const [code, setCode] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const { sites, scanning } = useMDnsScan(stage === "discover");

  if (!homeId) {
    return (
      <View style={styles.center}>
        <Text style={styles.muted}>请先选择或创建一个家</Text>
      </View>
    );
  }

  if (stage === "discover") {
    return (
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.h1}>找到主机</Text>
        <Text style={styles.muted}>
          {scanning
            ? "🔍 正在搜索同一 WiFi 下的智瞳主机…"
            : sites.length === 0
            ? "未发现设备"
            : `发现 ${sites.length} 台设备`}
        </Text>
        {scanning && (
          <ActivityIndicator color="#D4AF37" style={{ marginVertical: 16 }} />
        )}
        {sites.map((s) => (
          <Pressable
            key={s.ip}
            style={styles.deviceCard}
            onPress={() => {
              setSelected(s);
              setStage("enter-code");
            }}
          >
            <Text style={styles.deviceName}>{s.device_id}</Text>
            <Text style={styles.deviceIp}>{s.ip}</Text>
          </Pressable>
        ))}
        {!scanning && sites.length === 0 && (
          <View style={styles.help}>
            <Text style={styles.helpTitle}>找不到主机？</Text>
            <Text style={styles.helpItem}>• 确认主机已通电（指示灯亮）</Text>
            <Text style={styles.helpItem}>
              • 确认手机和主机连同一 WiFi
            </Text>
            <Text style={styles.helpItem}>
              • 部分 5GHz 路由器开了「客户端隔离」会阻断 mDNS
            </Text>
          </View>
        )}
      </ScrollView>
    );
  }

  if (stage === "enter-code") {
    return (
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.h1}>{selected?.device_id}</Text>
        <Text style={styles.muted}>{selected?.ip}</Text>
        <Text style={[styles.muted, { marginTop: 24 }]}>
          请输入主机底部贴纸上的 6 位配对码
        </Text>
        <TextInput
          value={code}
          onChangeText={(v) => setCode(v.replace(/[^0-9]/g, "").slice(0, 6))}
          style={styles.codeInput}
          keyboardType="number-pad"
          placeholder="000000"
          placeholderTextColor="#444"
          maxLength={6}
          autoFocus
        />
        <Pressable
          style={[
            styles.btn,
            code.length === 6 ? styles.btnPrimary : styles.btnDisabled,
          ]}
          disabled={code.length !== 6 || submitting}
          onPress={async () => {
            if (!selected || !homeId) return;
            setSubmitting(true);
            setStage("confirm");
            try {
              let reg;
              try {
                reg = await registerSite(homeId, selected.device_id);
              } catch (e: any) {
                // If a site already exists for this home (409), the user is
                // retrying after a previous pushSetup failure. Rotate the
                // token instead — gets a fresh secret AND invalidates the
                // stale one we issued before.
                const status = e?.response?.status;
                if (status === 409) {
                  reg = await rotateSiteToken(homeId);
                } else {
                  throw e;
                }
              }
              await pushSetup({
                ip: selected.ip,
                port: selected.port,
                token: reg.token,
                backend_url: BACKEND_URL,
                home_id: homeId,
                pairing_code: code,
              });
              Alert.alert(
                "配对成功",
                "约 30 秒后即可在安防 tab 看到在线",
                [
                  {
                    text: "好",
                    onPress: () => router.replace("/(tabs)/security"),
                  },
                ],
              );
            } catch (e: any) {
              const msg = e?.message;
              if (msg === "BAD_CODE")
                Alert.alert("配对码错误", "请重新输入");
              else if (msg === "LOCKED")
                Alert.alert(
                  "主机已锁定",
                  "连续 5 次错误，请断电重启或联系客服",
                );
              else Alert.alert("配对失败", String(msg ?? e));
              setStage("enter-code");
              setCode("");
            } finally {
              setSubmitting(false);
            }
          }}
        >
          <Text style={styles.btnText}>{submitting ? "配对中…" : "配对"}</Text>
        </Pressable>
        <Pressable
          onPress={() => setStage("discover")}
          style={{ marginTop: 16 }}
        >
          <Text style={styles.muted}>← 返回设备列表</Text>
        </Pressable>
      </ScrollView>
    );
  }

  // stage === "confirm"
  return (
    <View style={styles.center}>
      <ActivityIndicator color="#D4AF37" />
      <Text style={[styles.muted, { marginTop: 16 }]}>正在配对…</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: Colors.background ?? "#030306", flexGrow: 1 },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.background ?? "#030306",
  },
  h1: { color: "#fff", fontSize: 24, fontWeight: "700", marginTop: 24, marginBottom: 8 },
  muted: { color: "rgba(255,255,255,0.5)", fontSize: 14 },
  deviceCard: {
    backgroundColor: "rgba(255,255,255,0.06)",
    padding: 16,
    borderRadius: 12,
    marginVertical: 6,
  },
  deviceName: { color: "#fff", fontSize: 16, fontWeight: "600" },
  deviceIp: { color: "rgba(255,255,255,0.4)", fontSize: 13, marginTop: 2 },
  help: {
    marginTop: 32,
    padding: 16,
    backgroundColor: "rgba(255,255,255,0.03)",
    borderRadius: 12,
  },
  helpTitle: { color: "#fff", fontSize: 14, fontWeight: "600", marginBottom: 8 },
  helpItem: { color: "rgba(255,255,255,0.5)", fontSize: 13, lineHeight: 20 },
  codeInput: {
    color: "#fff",
    fontSize: 32,
    fontWeight: "600",
    letterSpacing: 8,
    textAlign: "center",
    padding: 16,
    marginVertical: 16,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 12,
  },
  btn: { padding: 16, borderRadius: 12, alignItems: "center" },
  btnPrimary: { backgroundColor: Colors.cyan ?? "#0A84FF" },
  btnDisabled: { backgroundColor: "rgba(255,255,255,0.1)" },
  btnText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});
