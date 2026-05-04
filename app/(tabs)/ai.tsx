import { useEffect, useRef, useState } from "react";
import {
  Dimensions,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useAuthStore } from "../../stores/auth";
import { useChatStore, ChatMessage } from "../../stores/chat";
import { sendChatMessage, getChatHistory } from "../../services/chat";
import { Colors } from "../../constants/theme";
import { Icon } from "../../components/ui/Icon";

// ─── Types ────────────────────────────────────────────────────────────────────

type SubTab = "chat" | "learn" | "insight" | "rules" | "timeline";

const TABS: { id: SubTab; l: string; ic: string }[] = [
  { id: "chat", l: "对话", ic: "mic" },
  { id: "learn", l: "学习", ic: "sparkle" },
  { id: "insight", l: "洞察", ic: "zap" },
  { id: "rules", l: "自动化", ic: "bulb" },
  { id: "timeline", l: "我的", ic: "user" },
];

// ─── Icon name map (identity) ─────────────────────────────────────────────────

const ICON_MAP: Record<string, string> = {
  mic: "mic",
  sparkle: "sparkle",
  zap: "zap",
  bulb: "bulb",
  user: "user",
};

// ─── Mock data (matching prototype exactly) ──────────────────────────────────

const LEARN_SECTIONS = [
  {
    title: "家庭作息",
    items: [
      "爸爸 通常18:30到家 ± 20min",
      "妈妈 通常17:00到家",
      "奶奶 每天7:00起床",
      "小宝 16:30放学到家",
    ],
    c: Colors.cyan,
  },
  {
    title: "环境偏好",
    items: [
      "客厅 全年24°C · 湿度50-60%",
      "卧室 睡前降至22°C",
      "书房 偏好冷白灯光",
    ],
    c: Colors.blue,
  },
  {
    title: "能耗模式",
    items: [
      "工作日白天低谷 3-5kWh",
      "晚7-10点高峰 8-10kWh",
      "周末全天中等 15-18kWh",
    ],
    c: Colors.amber,
  },
];

const INSIGHTS = [
  { type: "异常", c: Colors.rose, title: "客厅空调能耗异常", desc: "本月较上月高23%，日均运行多2小时。建议检查滤网或调整温度设定。", time: "今天" },
  { type: "关注", c: Colors.amber, title: "奶奶活动量下降", desc: "本周步数较上周下降15%，连续3天未出门。建议关注。", time: "昨天" },
  { type: "提醒", c: Colors.amber, title: "小宝连续超时", desc: "游戏日均1.8小时，本周超出2小时限额1次。", time: "2天前" },
  { type: "信息", c: Colors.blue, title: "书房传感器信号弱", desc: "近7天信号不稳定，电池电量约15%，建议更换。", time: "3天前" },
  { type: "信息", c: Colors.cyan, title: "空气质量改善", desc: "新风系统调整后，PM2.5月均值从35降至18。", time: "本周" },
];

const RULES_DATA = [
  { name: "晚安模式", trigger: "每天22:30", actions: "关灯+锁门+降温+布防", status: "运行中", from: "AI建议", runs: 28, c: Colors.emerald },
  { name: "回家模式", trigger: "GPS到家500m", actions: "开灯+空调+热水", status: "运行中", from: "AI建议", runs: 45, c: Colors.emerald },
  { name: "小宝断网", trigger: "游戏超2小时", actions: "限制游戏类网络", status: "运行中", from: "手动", runs: 3, c: Colors.emerald },
  { name: "起床模式", trigger: "工作日7:00", actions: "窗帘+灯光+播报天气", status: "待确认", from: "AI建议", runs: 0, c: Colors.amber },
];

const TIMELINE_STATS = [
  { lb: "到家", v: "18:28", sub: "较往常早2min", c: Colors.cyan },
  { lb: "睡眠", v: "7.2h", sub: "中等 · 深睡32%", c: Colors.purple },
  { lb: "心率", v: "72", sub: "bpm · 正常", c: Colors.rose },
  { lb: "能耗占比", v: "34%", sub: "全家最高", c: Colors.amber },
];

const TIMELINE_EVENTS = [
  { t: "18:28", ev: "到家 · GPS触发回家模式", c: Colors.cyan },
  { t: "18:30", ev: "打开客厅灯 · 调至80%", c: Colors.amber },
  { t: "19:15", ev: "调低空调至23°C", c: Colors.blue },
  { t: "20:00", ev: "启用影院模式", c: Colors.purple },
  { t: "07:00", ev: "起床模式自动执行", c: Colors.amber },
  { t: "07:05", ev: "离家 · 安防自动布防", c: Colors.emerald },
];

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: "init-1",
    role: "assistant",
    content: "有什么需要随时说。",
    msg_type: "text",
    created_at: new Date().toISOString(),
  },
];

const screenWidth = Dimensions.get("window").width;

// ─── Chat Tab (wired to real store) ──────────────────────────────────────────

function ChatTab({ currentHomeId }: { currentHomeId: string | null }) {
  const { messages, setMessages, addMessage } = useChatStore();
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const flatRef = useRef<FlatList>(null);

  useEffect(() => {
    if (messages.length === 0) {
      setMessages(INITIAL_MESSAGES);
    }
  }, []);

  useEffect(() => {
    if (currentHomeId && messages.length <= INITIAL_MESSAGES.length) {
      loadHistory();
    }
  }, [currentHomeId]);

  const loadHistory = async () => {
    if (!currentHomeId) return;
    try {
      const data = await getChatHistory(currentHomeId);
      if (data && data.length > 0) setMessages(data);
    } catch {}
  };

  const handleSend = async () => {
    const text = input.trim();
    if (!text || sending) return;
    setInput("");
    setSending(true);
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: text,
      msg_type: "text",
      created_at: new Date().toISOString(),
    };
    addMessage(userMsg);
    try {
      const homeId = currentHomeId || "demo";
      const response = await sendChatMessage(homeId, text);
      addMessage({
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: response.reply,
        msg_type: response.type,
        action_payload: response.action,
        created_at: new Date().toISOString(),
      });
    } catch {
      addMessage({
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "抱歉，暂时无法处理，请稍后再试。",
        msg_type: "text",
        created_at: new Date().toISOString(),
      });
    } finally {
      setSending(false);
    }
  };

  const renderMessage = ({ item }: { item: ChatMessage }) => {
    const isUser = item.role === "user";
    const hasAction = item.action_payload && item.msg_type !== "text";

    return (
      <View style={{ alignSelf: isUser ? "flex-end" : "flex-start", maxWidth: "88%", marginBottom: 12 }}>
        {!isUser && (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 3, marginLeft: 4 }}>
            <Icon name="sparkle" size={10} color={Colors.t3} strokeWidth={1.5} />
            <Text style={{ fontSize: 9, color: Colors.t3 }}>AI 管家</Text>
          </View>
        )}
        {isUser ? (
          <LinearGradient
            colors={[Colors.blue, Colors.purple]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              padding: 12,
              paddingHorizontal: 15,
              borderTopLeftRadius: 18,
              borderTopRightRadius: 18,
              borderBottomLeftRadius: 18,
              borderBottomRightRadius: 4,
              shadowColor: Colors.blue,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.2,
              shadowRadius: 18,
              elevation: 4,
            }}
          >
            <Text style={{ fontSize: 13, lineHeight: 13 * 1.7, color: "#fff" }}>{item.content}</Text>
          </LinearGradient>
        ) : (
          <View
            style={{
              padding: 12,
              paddingHorizontal: 15,
              borderTopLeftRadius: 18,
              borderTopRightRadius: 18,
              borderBottomLeftRadius: 4,
              borderBottomRightRadius: 18,
              backgroundColor: Colors.card,
              borderWidth: 1,
              borderColor: Colors.border,
            }}
          >
            <Text style={{ fontSize: 13, lineHeight: 13 * 1.7, color: Colors.t2 }}>{item.content}</Text>
          </View>
        )}
        {hasAction && (
          <View style={{ flexDirection: "row", gap: 8, marginTop: 8 }}>
            <TouchableOpacity
              style={{
                paddingVertical: 7,
                paddingHorizontal: 16,
                borderRadius: 10,
                backgroundColor: Colors.rose + "15",
                borderWidth: 1,
                borderColor: Colors.rose + "28",
              }}
            >
              <Text style={{ fontSize: 12, fontWeight: "600", color: Colors.rose }}>限制游戏</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{
                paddingVertical: 7,
                paddingHorizontal: 16,
                borderRadius: 10,
                borderWidth: 1,
                borderColor: Colors.border,
              }}
            >
              <Text style={{ fontSize: 12, color: Colors.t3 }}>先不管</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={140}
    >
      <FlatList
        ref={flatRef}
        data={messages}
        keyExtractor={(m) => m.id}
        renderItem={renderMessage}
        contentContainerStyle={{ paddingHorizontal: 0, paddingTop: 12, paddingBottom: 16, justifyContent: "flex-end", flexGrow: 1 }}
        onContentSizeChange={() => flatRef.current?.scrollToEnd({ animated: true })}
        showsVerticalScrollIndicator={false}
      />
      <View style={{ flexDirection: "row", gap: 10, marginTop: 14, alignItems: "center", flexShrink: 0 }}>
        <View
          style={{
            flex: 1,
            paddingVertical: 12,
            paddingHorizontal: 16,
            borderRadius: 16,
            backgroundColor: Colors.card,
            borderWidth: 1,
            borderColor: Colors.border,
          }}
        >
          <TextInput
            style={{ fontSize: 13, color: Colors.t1, padding: 0 }}
            value={input}
            onChangeText={setInput}
            placeholder="说点什么..."
            placeholderTextColor={Colors.t3}
            returnKeyType="send"
            onSubmitEditing={handleSend}
          />
        </View>
        <TouchableOpacity onPress={handleSend} disabled={sending || !input.trim()} activeOpacity={0.7}>
          <LinearGradient
            colors={[Colors.blue, Colors.purple]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              width: 46,
              height: 46,
              borderRadius: 15,
              alignItems: "center",
              justifyContent: "center",
              shadowColor: Colors.blue,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.27,
              shadowRadius: 18,
              elevation: 4,
            }}
          >
            <Icon name="mic" size={19} color="#fff" strokeWidth={1.5} />
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

// ─── Learn Tab ───────────────────────────────────────────────────────────────

function LearnTab() {
  return (
    <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
      {/* Header banner */}
      <View
        style={{
          padding: 12,
          paddingHorizontal: 14,
          borderRadius: 16,
          backgroundColor: Colors.purple + "06",
          borderWidth: 1,
          borderColor: Colors.purple + "12",
          marginBottom: 12,
        }}
      >
        <Text style={{ fontSize: 12, fontWeight: "700", color: Colors.purple, marginBottom: 4 }}>
          AI已学习 87 天
        </Text>
        <Text style={{ fontSize: 11, color: Colors.t3 }}>
          持续观察你家的生活规律，以下是我的理解
        </Text>
      </View>

      {LEARN_SECTIONS.map((sec) => (
        <View key={sec.title} style={{ marginBottom: 14 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 6 }}>
            <View style={{ width: 4, height: 14, borderRadius: 2, backgroundColor: sec.c }} />
            <Text style={{ fontSize: 13, fontWeight: "700", color: Colors.t1 }}>{sec.title}</Text>
          </View>
          {sec.items.map((it, i) => (
            <View
              key={i}
              style={{
                padding: 8,
                paddingHorizontal: 12,
                borderRadius: 10,
                backgroundColor: Colors.card,
                borderWidth: 1,
                borderColor: Colors.border,
                marginBottom: 4,
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Text style={{ fontSize: 11, color: Colors.t2 }}>{it}</Text>
              <Text style={{ fontSize: 9, color: Colors.t3 }}>修正</Text>
            </View>
          ))}
        </View>
      ))}
    </ScrollView>
  );
}

// ─── Insight Tab ─────────────────────────────────────────────────────────────

function InsightTab() {
  return (
    <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
      <Text style={{ fontSize: 12, color: Colors.t3, marginBottom: 10 }}>
        AI主动发现的洞察 · 按重要程度排序
      </Text>
      {INSIGHTS.map((ins, i) => (
        <View
          key={i}
          style={{
            padding: 12,
            paddingHorizontal: 14,
            borderRadius: 16,
            backgroundColor: i < 2 ? ins.c + "06" : Colors.card,
            borderWidth: 1,
            borderColor: i < 2 ? ins.c + "15" : Colors.border,
            marginBottom: 8,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 5 }}>
            <View
              style={{
                paddingVertical: 1,
                paddingHorizontal: 6,
                borderRadius: 4,
                backgroundColor: ins.c + "15",
              }}
            >
              <Text style={{ fontSize: 9, color: ins.c, fontWeight: "600" }}>{ins.type}</Text>
            </View>
            <Text style={{ fontSize: 12, fontWeight: "700", color: Colors.t1, flex: 1 }}>{ins.title}</Text>
            <Text style={{ fontSize: 9, color: Colors.t3 }}>{ins.time}</Text>
          </View>
          <Text style={{ fontSize: 11, color: Colors.t2, lineHeight: 11 * 1.6 }}>{ins.desc}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

// ─── Rules Tab ───────────────────────────────────────────────────────────────

function RulesTab() {
  return (
    <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
      {/* Filter chips */}
      <View style={{ flexDirection: "row", gap: 6, marginBottom: 12 }}>
        {["运行中", "待确认", "已暂停"].map((st, i) => (
          <TouchableOpacity
            key={st}
            style={{
              paddingVertical: 5,
              paddingHorizontal: 12,
              borderRadius: 8,
              backgroundColor: i === 0 ? Colors.emerald + "12" : Colors.card,
              borderWidth: 1,
              borderColor: i === 0 ? Colors.emerald + "25" : Colors.border,
            }}
          >
            <Text
              style={{
                fontSize: 11,
                color: i === 0 ? Colors.emerald : Colors.t3,
                fontWeight: i === 0 ? "600" : "400",
              }}
            >
              {st}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {RULES_DATA.map((rule, i) => (
        <View
          key={i}
          style={{
            padding: 12,
            paddingHorizontal: 14,
            borderRadius: 16,
            backgroundColor: Colors.card,
            borderWidth: 1,
            borderColor: Colors.border,
            marginBottom: 8,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 5 }}>
            <Text style={{ fontSize: 13, fontWeight: "700", color: Colors.t1 }}>{rule.name}</Text>
            <View
              style={{
                paddingVertical: 2,
                paddingHorizontal: 7,
                borderRadius: 5,
                backgroundColor: rule.c + "15",
              }}
            >
              <Text style={{ fontSize: 9, color: rule.c, fontWeight: "600" }}>{rule.status}</Text>
            </View>
          </View>
          <Text style={{ fontSize: 11, color: Colors.t3, marginBottom: 3 }}>
            {rule.trigger} → {rule.actions}
          </Text>
          <View style={{ flexDirection: "row", gap: 10 }}>
            <Text style={{ fontSize: 10, color: Colors.t3 }}>{rule.from}</Text>
            <Text style={{ fontSize: 10, color: Colors.t3 }}>已执行 {rule.runs} 次</Text>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

// ─── Timeline Tab ────────────────────────────────────────────────────────────

function TimelineTab() {
  const halfWidth = (screenWidth - 40 - 8) / 2; // padding 20 each side, gap 8

  return (
    <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
      {/* Profile header */}
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 14 }}>
        <LinearGradient
          colors={[Colors.blue, Colors.purple]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            width: 36,
            height: 36,
            borderRadius: 12,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text style={{ fontSize: 14, fontWeight: "800", color: "#fff" }}>张</Text>
        </LinearGradient>
        <View>
          <Text style={{ fontSize: 14, fontWeight: "700", color: Colors.t1 }}>张先生的数据</Text>
          <Text style={{ fontSize: 10, color: Colors.t3 }}>今日概览</Text>
        </View>
      </View>

      {/* Stats grid 2x2 */}
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 14 }}>
        {TIMELINE_STATS.map((st) => (
          <View
            key={st.lb}
            style={{
              width: halfWidth,
              padding: 10,
              paddingHorizontal: 12,
              borderRadius: 14,
              backgroundColor: Colors.card,
              borderWidth: 1,
              borderColor: Colors.border,
            }}
          >
            <Text style={{ fontSize: 9, color: Colors.t3, marginBottom: 3 }}>{st.lb}</Text>
            <Text style={{ fontSize: 17, fontWeight: "800", color: st.c }}>{st.v}</Text>
            <Text style={{ fontSize: 9, color: Colors.t3, marginTop: 2 }}>{st.sub}</Text>
          </View>
        ))}
      </View>

      {/* Timeline label */}
      <Text style={{ fontSize: 12, fontWeight: "600", color: Colors.t3, marginBottom: 8 }}>今日时间线</Text>

      {/* Timeline events */}
      {TIMELINE_EVENTS.map((ev, i) => (
        <View
          key={i}
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 10,
            paddingVertical: 8,
            borderBottomWidth: i < 5 ? 1 : 0,
            borderBottomColor: Colors.border,
          }}
        >
          <Text style={{ fontSize: 11, color: Colors.t3, width: 40, textAlign: "right" }}>{ev.t}</Text>
          <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: ev.c }} />
          <Text style={{ fontSize: 11, color: Colors.t2 }}>{ev.ev}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

// ─── Main screen ─────────────────────────────────────────────────────────────

export default function AIScreen() {
  const [aiTab, setAiTab] = useState<SubTab>("chat");
  const currentHomeId = useAuthStore((s) => s.currentHomeId);
  const router = useRouter();

  const renderContent = () => {
    switch (aiTab) {
      case "chat":
        return <ChatTab currentHomeId={currentHomeId} />;
      case "learn":
        return <LearnTab />;
      case "insight":
        return <InsightTab />;
      case "rules":
        return <RulesTab />;
      case "timeline":
        return <TimelineTab />;
    }
  };

  return (
    <View style={styles.screen}>
      {/* Title */}
      <Text style={styles.title}>AI 管家</Text>

      {/* Marketplace CTA */}
      <Pressable onPress={() => router.push("/(marketplace)/")}>
        <LinearGradient
          colors={[Colors.purple + "30", Colors.purple + "10"]}
          style={{
            flexDirection: "row",
            alignItems: "center",
            padding: 14,
            borderRadius: 16,
            marginBottom: 12,
            gap: 12,
          }}
        >
          <Text style={{ fontSize: 24 }}>✨</Text>
          <View style={{ flex: 1 }}>
            <Text style={{ color: Colors.t1, fontSize: 14, fontWeight: "700" }}>
              AI 应用市场
            </Text>
            <Text style={{ color: Colors.t3, fontSize: 11, marginTop: 2 }}>
              浏览精选 · 自己描述创建
            </Text>
          </View>
          <Text style={{ color: Colors.t3, fontSize: 18 }}>›</Text>
        </LinearGradient>
      </Pressable>

      {/* Tab bar */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 4, marginBottom: 14, flexShrink: 0 }}
        style={{ flexGrow: 0 }}
      >
        {TABS.map((t) => {
          const isActive = aiTab === t.id;
          return (
            <TouchableOpacity
              key={t.id}
              onPress={() => setAiTab(t.id)}
              activeOpacity={0.7}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 5,
                paddingVertical: 6,
                paddingHorizontal: 12,
                borderRadius: 10,
                backgroundColor: isActive ? Colors.purple + "15" : "transparent",
                borderWidth: 1,
                borderColor: isActive ? Colors.purple + "30" : "transparent",
                flexShrink: 0,
              }}
            >
              <Icon name={ICON_MAP[t.ic] || t.ic} size={12} color={isActive ? Colors.purple : Colors.t3} strokeWidth={1.5} />
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: isActive ? "700" : "400",
                  color: isActive ? Colors.purple : Colors.t3,
                }}
              >
                {t.l}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Content */}
      <View style={{ flex: 1 }}>{renderContent()}</View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.bg,
    paddingTop: Platform.OS === "ios" ? 56 : 32,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: Colors.t1,
    marginBottom: 12,
  },
});
