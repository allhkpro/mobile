import { useState } from "react";
import {
  ScrollView, View, Text, Pressable, TextInput, StyleSheet, ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { useMDnsScan } from "../../hooks/useMDnsScan";
import { registerGateway } from "../../services/gateway";
import { useAuthStore } from "../../stores/auth";
import { Colors } from "../../constants/theme";
import type { DiscoveredSite } from "../../services/sitePairing";

type Stage = "scan" | "enter-code" | "pairing" | "done" | "error";

export default function PairKnxGateway() {
  const router = useRouter();
  const homeId = useAuthStore((s) => s.profile?.homes[0]?.id);
  const [stage, setStage] = useState<Stage>("scan");
  const [selected, setSelected] = useState<DiscoveredSite | null>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);

  const { sites, scanning, rescan } = useMDnsScan(
    "_aiknx-gateway._tcp.local.",
    stage === "scan",
  );

  const onSelect = (gw: DiscoveredSite) => {
    setSelected(gw);
    setStage("enter-code");
  };

  const onSubmit = async () => {
    if (!homeId || !selected || code.length !== 6) return;
    setStage("pairing");
    setError(null);
    try {
      // 1. Backend creates Gateway + ProviderConnection (status=connecting)
      const reg = await registerGateway(homeId, selected.device_id);

      // 2. Mobile relays to gateway with sticker code
      const setupResp = await fetch(`http://${selected.ip}:${selected.port}/setup-pair`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sticker_code: code,
          gateway_id: reg.gateway_id,
          register_token: reg.register_token,
          ws_url: reg.ws_url,
          home_id: homeId,
        }),
      });
      const setup = await setupResp.json().catch(() => ({}));
      if (!setupResp.ok || !setup.success) {
        throw new Error(setup.error_message || `网关返回 ${setupResp.status}`);
      }

      setStage("done");
    } catch (e: any) {
      setError(e?.message ?? "配对失败");
      setStage("error");
    }
  };

  if (!homeId) {
    return (
      <View style={s.center}>
        <Text style={s.desc}>请先选择或创建一个家</Text>
      </View>
    );
  }

  if (stage === "scan") {
    return (
      <ScrollView style={s.bg} contentContainerStyle={{ padding: 20 }}>
        <Text style={s.title}>正在搜索 KNX 网关</Text>
        {scanning && <ActivityIndicator color={Colors.purple} style={{ marginVertical: 20 }} />}
        {sites.map((gw, i) => (
          <Pressable key={`${gw.ip}-${i}`} style={s.gwCard} onPress={() => onSelect(gw)}>
            <Text style={s.gwName}>{gw.device_id}</Text>
            <Text style={s.gwSub}>{gw.ip}:{gw.port}</Text>
          </Pressable>
        ))}
        {!scanning && sites.length === 0 && (
          <Text style={s.hint}>没找到网关 — 确认网关跟手机在同一 WiFi 网络</Text>
        )}
        <Pressable style={s.btnSec} onPress={rescan}>
          <Text style={s.btnSecText}>重新扫描</Text>
        </Pressable>
      </ScrollView>
    );
  }

  if (stage === "enter-code") {
    return (
      <View style={[s.bg, { padding: 20 }]}>
        <Text style={s.title}>配对码</Text>
        <Text style={s.desc}>请输入「{selected!.device_id}」上的 6 位贴纸码</Text>
        <TextInput
          style={s.codeInput}
          value={code}
          onChangeText={(v) => setCode(v.replace(/[^0-9]/g, "").slice(0, 6))}
          keyboardType="number-pad"
          maxLength={6}
          placeholder="000000"
          placeholderTextColor={Colors.t3}
          autoFocus
        />
        <Pressable
          style={[s.btnPrim, code.length !== 6 && { opacity: 0.4 }]}
          onPress={onSubmit}
          disabled={code.length !== 6}
        >
          <Text style={s.btnPrimText}>确定</Text>
        </Pressable>
      </View>
    );
  }

  if (stage === "pairing") {
    return (
      <View style={s.center}>
        <ActivityIndicator color={Colors.purple} size="large" />
        <Text style={s.loadingText}>正在配对...</Text>
      </View>
    );
  }

  if (stage === "done") {
    return (
      <View style={s.center}>
        <Text style={s.bigIcon}>✓</Text>
        <Text style={s.title}>网关已配对</Text>
        <Text style={s.desc}>设备列表会在工程师配置完成后出现在智家 tab</Text>
        <Pressable style={[s.btnPrim, { marginTop: 32 }]}
                   onPress={() => router.replace("/(tabs)/" as any)}>
          <Text style={s.btnPrimText}>去看智家</Text>
        </Pressable>
      </View>
    );
  }

  // error
  return (
    <View style={s.center}>
      <Text style={[s.title, { color: Colors.rose }]}>配对失败</Text>
      <Text style={s.desc}>{error}</Text>
      <Pressable style={[s.btnSec, { marginTop: 16 }]}
                 onPress={() => { setError(null); setCode(""); setStage("enter-code"); }}>
        <Text style={s.btnSecText}>重新输入</Text>
      </Pressable>
      <Pressable style={[s.btnSec, { marginTop: 8 }]} onPress={() => setStage("scan")}>
        <Text style={s.btnSecText}>重新扫描</Text>
      </Pressable>
    </View>
  );
}

const s = StyleSheet.create({
  bg: { flex: 1, backgroundColor: Colors.bg },
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: Colors.bg, gap: 16, padding: 24 },
  title: { color: Colors.t1, fontSize: 22, fontWeight: "700", textAlign: "center" },
  desc: { color: Colors.t2, fontSize: 13, textAlign: "center", marginTop: 8, lineHeight: 20 },
  hint: { color: Colors.t3, fontSize: 13, textAlign: "center", marginTop: 16 },
  bigIcon: { fontSize: 64, textAlign: "center", color: Colors.emerald, marginVertical: 16 },
  loadingText: { color: Colors.t2, fontSize: 14, marginTop: 16 },
  gwCard: { backgroundColor: Colors.card, borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: Colors.border },
  gwName: { color: Colors.t1, fontSize: 15, fontWeight: "700" },
  gwSub: { color: Colors.t3, fontSize: 12, marginTop: 4 },
  codeInput: {
    color: Colors.t1, fontSize: 28, fontWeight: "700",
    backgroundColor: Colors.card, borderRadius: 12,
    padding: 16, marginVertical: 24, textAlign: "center",
    letterSpacing: 8, borderWidth: 1, borderColor: Colors.border,
  },
  btnPrim: { paddingVertical: 14, paddingHorizontal: 32, backgroundColor: Colors.purple,
    borderRadius: 12, alignItems: "center" },
  btnPrimText: { color: "#fff", fontSize: 15, fontWeight: "700" },
  btnSec: { paddingVertical: 14, paddingHorizontal: 32, backgroundColor: "transparent",
    borderRadius: 12, borderWidth: 1, borderColor: Colors.border, alignItems: "center", marginTop: 16 },
  btnSecText: { color: Colors.t2, fontSize: 15 },
});
