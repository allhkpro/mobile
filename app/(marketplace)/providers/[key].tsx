import { useEffect, useState } from "react";
import {
  ScrollView,
  View,
  Text,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Linking,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  listRegistered,
  startConnect,
  completeConnect,
  listConnections,
  disconnect,
  syncConnection,
  RegisteredProvider,
  ProviderConnection,
} from "../../../services/providers";
import { useAuthStore } from "../../../stores/auth";
import { Colors } from "../../../constants/theme";

type Stage = "intro" | "auth" | "discovering" | "done";

export default function ConnectionWizard() {
  const router = useRouter();
  const { key, oauth_code } = useLocalSearchParams<{
    key: string;
    oauth_code?: string;
  }>();
  const homeId = useAuthStore((s) => s.profile?.homes[0]?.id);

  const [provider, setProvider] = useState<RegisteredProvider | null>(null);
  const [existing, setExisting] = useState<ProviderConnection | null>(null);
  const [stage, setStage] = useState<Stage>("intro");
  const [busy, setBusy] = useState(false);
  const [deviceCount, setDeviceCount] = useState(0);

  useEffect(() => {
    if (!key || !homeId) return;
    (async () => {
      const [registered, conns] = await Promise.all([
        listRegistered(),
        listConnections(homeId),
      ]);
      setProvider(registered.find((p) => p.key === key) ?? null);
      setExisting(conns.find((c) => c.provider === key) ?? null);
    })();
  }, [key, homeId]);

  // OAuth callback: code arrives via deep link → push back to this screen with ?oauth_code=...
  useEffect(() => {
    if (!oauth_code || !homeId || !key) return;
    completeConnect(homeId, key, { oauth_code })
      .then((conn) => {
        setExisting(conn);
        setDeviceCount(conn.device_count);
        setStage("done");
      })
      .catch((e: any) => {
        Alert.alert("连接失败", e?.response?.data?.detail ?? "请重试");
        setStage("intro");
      });
  }, [oauth_code, homeId, key]);

  if (!provider) {
    return (
      <View style={s.center}>
        <ActivityIndicator color={Colors.t2} />
      </View>
    );
  }

  const onConnect = async () => {
    if (!homeId) return;
    setBusy(true);
    try {
      const result = await startConnect(homeId, key);
      if (result.auth_url) {
        // OAuth: open browser; deep link callback will resume
        setStage("auth");
        await Linking.openURL(result.auth_url);
      } else if (result.immediate_connection_id) {
        // Virtual: trigger sync to import devices, then jump to done
        setStage("discovering");
        const syncResult = await syncConnection(result.immediate_connection_id);
        // Re-fetch connection to read fresh device_count + status
        const conns = await listConnections(homeId);
        const conn = conns.find((c) => c.provider === key);
        setExisting(conn ?? null);
        setDeviceCount(syncResult.device_count);
        setStage("done");
      } else if (result.challenge) {
        // LAN: show challenge prompt — v1 stub: just alert, real impl in v2
        Alert.alert("LAN 配对", JSON.stringify(result.challenge));
        setStage("intro");
      }
    } catch (e: any) {
      Alert.alert("接入失败", e?.response?.data?.detail ?? "请稍后再试");
      setStage("intro");
    } finally {
      setBusy(false);
    }
  };

  const onDisconnect = async () => {
    if (!existing) return;
    Alert.alert("断开此连接？", "关联设备会一并删除", [
      { text: "取消", style: "cancel" },
      {
        text: "断开",
        style: "destructive",
        onPress: async () => {
          setBusy(true);
          try {
            await disconnect(existing.id);
            setExisting(null);
            router.back();
          } catch (e: any) {
            Alert.alert("断开失败", e?.response?.data?.detail ?? "请重试");
          } finally {
            setBusy(false);
          }
        },
      },
    ]);
  };

  if (stage === "discovering") {
    return (
      <View style={s.center}>
        <ActivityIndicator color={Colors.purple} size="large" />
        <Text style={s.loadingText}>正在导入设备...</Text>
      </View>
    );
  }

  if (stage === "done") {
    return (
      <View style={s.center}>
        <Text style={s.bigIcon}>✓</Text>
        <Text style={s.name}>接入成功</Text>
        <Text style={s.desc}>导入了 {deviceCount} 个设备</Text>
        <Pressable
          style={[s.btnPrimary, { marginTop: 32 }]}
          onPress={() => router.replace("/(tabs)/" as any)}
        >
          <Text style={s.btnPrimaryText}>去看设备</Text>
        </Pressable>
      </View>
    );
  }

  if (stage === "auth") {
    return (
      <View style={s.center}>
        <ActivityIndicator color={Colors.purple} size="large" />
        <Text style={s.loadingText}>等待浏览器授权...</Text>
        <Pressable
          style={[s.btnSecondary, { marginTop: 16 }]}
          onPress={() => setStage("intro")}
        >
          <Text style={s.btnSecondaryText}>取消</Text>
        </Pressable>
      </View>
    );
  }

  // stage === "intro"
  const isConnected = existing?.status === "connected";
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: Colors.bg }}
      contentContainerStyle={{ padding: 24, alignItems: "center" }}
    >
      <Text style={s.bigIcon}>{provider.icon}</Text>
      <Text style={s.name}>{provider.name}</Text>
      <Text style={s.desc}>
        {isConnected
          ? `已接入 · ${existing?.device_count ?? 0} 个设备`
          : "接入后该品牌设备会出现在你家的房间里，跟其他设备一起控制"}
      </Text>

      {isConnected ? (
        <Pressable
          style={[s.btnSecondary, { marginTop: 32 }]}
          onPress={onDisconnect}
          disabled={busy}
        >
          {busy ? (
            <ActivityIndicator color={Colors.rose} />
          ) : (
            <Text style={[s.btnSecondaryText, { color: Colors.rose }]}>
              断开连接
            </Text>
          )}
        </Pressable>
      ) : (
        <Pressable
          style={[s.btnPrimary, { marginTop: 32 }]}
          onPress={onConnect}
          disabled={busy}
        >
          {busy ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={s.btnPrimaryText}>开始接入</Text>
          )}
        </Pressable>
      )}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.bg,
    gap: 16,
    padding: 24,
  },
  loadingText: { color: Colors.t2, fontSize: 14, marginTop: 16 },
  bigIcon: { fontSize: 64, textAlign: "center", marginVertical: 16 },
  name: {
    color: Colors.t1,
    fontSize: 22,
    fontWeight: "700",
    textAlign: "center",
  },
  desc: {
    color: Colors.t2,
    fontSize: 13,
    textAlign: "center",
    marginTop: 8,
    lineHeight: 20,
  },
  btnPrimary: {
    paddingVertical: 14,
    paddingHorizontal: 32,
    backgroundColor: Colors.purple,
    borderRadius: 12,
    alignItems: "center",
  },
  btnPrimaryText: { color: "#fff", fontSize: 15, fontWeight: "700" },
  btnSecondary: {
    paddingVertical: 14,
    paddingHorizontal: 32,
    backgroundColor: "transparent",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
  },
  btnSecondaryText: { color: Colors.t2, fontSize: 15 },
});
