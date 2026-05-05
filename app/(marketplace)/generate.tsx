import { useState } from "react";
import { ScrollView, View, Text, TextInput, Pressable, StyleSheet, ActivityIndicator, Alert } from "react-native";
import { useRouter } from "expo-router";
import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
} from "expo-speech-recognition";
import { aiGenerateSkill, getSkill, installSkill, SkillDetail } from "../../services/marketplace";
import { useAuthStore } from "../../stores/auth";
import { Colors } from "../../constants/theme";

type Stage = "input" | "loading" | "preview";

const PLACEHOLDERS = [
  "早上 7 点拉开窗帘，让阳光叫醒我",
  "看电影时把客厅灯调暗",
  "晚上 11 点后开静音模式",
];

export default function GenerateWizard() {
  const router = useRouter();
  const homeId = useAuthStore((s) => s.profile?.homes[0]?.id);
  const [stage, setStage] = useState<Stage>("input");
  const [prompt, setPrompt] = useState("");
  const [draft, setDraft] = useState<SkillDetail | null>(null);
  const [installing, setInstalling] = useState(false);
  const [recording, setRecording] = useState(false);

  useSpeechRecognitionEvent("result", (event) => {
    const transcript = event.results?.[0]?.transcript ?? "";
    if (transcript) {
      setPrompt((p) => (p ? `${p} ${transcript}` : transcript));
    }
  });

  useSpeechRecognitionEvent("end", () => {
    setRecording(false);
  });

  const startRec = async () => {
    const perm = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("权限被拒", "请到设置开启麦克风 + 语音识别权限");
      return;
    }
    setRecording(true);
    ExpoSpeechRecognitionModule.start({
      lang: "zh-CN",
      continuous: false,
      interimResults: false,
    });
  };

  const stopRec = () => {
    ExpoSpeechRecognitionModule.stop();
  };

  const onGenerate = async () => {
    if (!homeId || prompt.length < 2) return;
    setStage("loading");
    try {
      const skill = await aiGenerateSkill(homeId, prompt);
      const detail = await getSkill(skill.id, homeId);
      setDraft(detail);
      setStage("preview");
    } catch (e: any) {
      Alert.alert("生成失败", e?.response?.data?.detail ?? "AI 没整明白，换个说法再试？");
      setStage("input");
    }
  };

  const onInstall = async () => {
    if (!draft || !homeId) return;
    setInstalling(true);
    try {
      await installSkill(homeId, draft.id);
      router.replace("/(marketplace)/installed");
    } catch (e: any) {
      Alert.alert("安装失败", e?.response?.data?.detail ?? "请稍后再试");
    } finally {
      setInstalling(false);
    }
  };

  if (stage === "loading") {
    return (
      <View style={s.center}>
        <ActivityIndicator color={Colors.purple} size="large" />
        <Text style={s.loadingText}>AI 正在创造...</Text>
      </View>
    );
  }

  if (stage === "preview" && draft) {
    return (
      <ScrollView style={{ flex: 1, backgroundColor: Colors.bg }}
                  contentContainerStyle={{ padding: 16 }}>
        <Text style={s.bigIcon}>{draft.icon}</Text>
        <Text style={s.name}>{draft.name}</Text>
        <Text style={s.desc}>{draft.description}</Text>
        <View style={{ flexDirection: "row", gap: 8, marginTop: 32 }}>
          <Pressable style={[s.btnSecondary, { flex: 1 }]}
                     onPress={() => setStage("input")}>
            <Text style={s.btnSecondaryText}>重新生成</Text>
          </Pressable>
          <Pressable style={[s.btnPrimary, { flex: 1 }]}
                     onPress={onInstall} disabled={installing}>
            {installing ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={s.btnPrimaryText}>装这个</Text>
            )}
          </Pressable>
        </View>
      </ScrollView>
    );
  }

  // stage === "input"
  return (
    <ScrollView style={{ flex: 1, backgroundColor: Colors.bg }}
                contentContainerStyle={{ padding: 16 }}>
      <Text style={s.title}>你想让你家自动做什么？</Text>
      <Text style={s.hint}>例如：</Text>
      {PLACEHOLDERS.map((p) => (
        <Text key={p} style={s.example}>· {p}</Text>
      ))}
      <View style={{ position: "relative" }}>
        <TextInput
          style={s.input}
          multiline
          placeholder="用一两句话描述..."
          placeholderTextColor={Colors.t3}
          value={prompt}
          onChangeText={setPrompt}
        />
        <Pressable
          style={s.micBtn}
          onPressIn={startRec}
          onPressOut={stopRec}
        >
          <Text style={{ fontSize: 24 }}>{recording ? "🔴" : "🎙️"}</Text>
        </Pressable>
      </View>
      <Pressable
        style={[s.btnPrimary, prompt.length < 2 && { opacity: 0.4 }]}
        onPress={onGenerate}
        disabled={prompt.length < 2}
      >
        <Text style={s.btnPrimaryText}>生成</Text>
      </Pressable>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  center: {
    flex: 1, alignItems: "center", justifyContent: "center",
    backgroundColor: Colors.bg, gap: 16,
  },
  loadingText: { color: Colors.t2, fontSize: 14 },
  title: { color: Colors.t1, fontSize: 18, fontWeight: "700", marginBottom: 8 },
  hint: { color: Colors.t3, fontSize: 12, marginTop: 12 },
  example: { color: Colors.t3, fontSize: 13, marginVertical: 2 },
  input: {
    color: Colors.t1, fontSize: 14, marginTop: 16, padding: 14,
    backgroundColor: Colors.card, borderRadius: 12, borderWidth: 1,
    borderColor: Colors.border, minHeight: 100,
  },
  btnPrimary: {
    paddingVertical: 14, backgroundColor: Colors.purple,
    borderRadius: 12, alignItems: "center", marginTop: 16,
  },
  btnPrimaryText: { color: "#fff", fontSize: 15, fontWeight: "700" },
  btnSecondary: {
    paddingVertical: 14, backgroundColor: "transparent",
    borderRadius: 12, borderWidth: 1, borderColor: Colors.border,
    alignItems: "center",
  },
  btnSecondaryText: { color: Colors.t2, fontSize: 15 },
  bigIcon: { fontSize: 64, textAlign: "center", marginVertical: 16 },
  name: { color: Colors.t1, fontSize: 22, fontWeight: "700", textAlign: "center" },
  desc: { color: Colors.t2, fontSize: 13, textAlign: "center", marginTop: 8 },
  micBtn: {
    position: "absolute", right: 8, bottom: 8,
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border,
    alignItems: "center", justifyContent: "center",
  },
});
