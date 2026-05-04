import { useEffect, useState } from "react";
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
} from "react-native";
import { useRouter } from "expo-router";
import { useAuthStore } from "../../stores/auth";
import { useHomeStore, Room } from "../../stores/home";
import { getDashboard, updateSuggestion } from "../../services/dashboard";
import { listRooms } from "../../services/rooms";
import { listOrders, OrderListItem as OrderType } from "../../services/orders";
import { wsClient } from "../../services/websocket";
import { Colors } from "../../constants/theme";
import { Icon } from "../../components/ui/Icon";
import { ServiceEntryCard } from "../../components/service/ServiceEntryCard";
import { OrderListItem } from "../../components/service/OrderListItem";

// ─── Icon name map ───────────────────────────────────────────────────────────

const ICON_MAP: Record<string, string> = {
  leaf: "leaf",
  temp: "temp",
  zap: "zap",
  shield: "shield",
  users: "users",
  wifi: "wifi",
  bell: "bell",
  sun: "sun",
  home: "home",
  proj: "proj",
  moon: "moon",
};

// ─── Mock data matching prototype exactly ────────────────────────────────────

const MOCK_ROOMS = [
  { id: "living", nm: "客厅", ic: "sofa", dv: 6, tmp: "24°", on: 4, c: Colors.cyan },
  { id: "master", nm: "主卧", ic: "bed", dv: 4, tmp: "23°", on: 2, c: Colors.purple },
  { id: "study", nm: "书房", ic: "book", dv: 3, tmp: "22°", on: 0, c: Colors.blue },
  { id: "kitchen", nm: "餐厨", ic: "chef", dv: 5, tmp: "25°", on: 3, c: Colors.amber },
  { id: "kid", nm: "儿童房", ic: "teddy", dv: 3, tmp: "24°", on: 0, c: Colors.rose },
];

const MOCK_SCENES = [
  { nm: "起床", ic: "sun", c: Colors.amber, a: "7:00" },
  { nm: "回家", ic: "home", c: Colors.cyan, a: "GPS" },
  { nm: "影院", ic: "proj", c: Colors.purple, a: undefined },
  { nm: "晚安", ic: "moon", c: Colors.blue, a: "22:30" },
];

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function HomeScreen() {
  const router = useRouter();
  const { currentHomeId, profile } = useAuthStore();
  const { dashboard, setDashboard, rooms, setRooms } = useHomeStore();
  const [refreshing, setRefreshing] = useState(false);
  const [activeOrderCount, setActiveOrderCount] = useState(0);
  const [recentOrders, setRecentOrders] = useState<OrderType[]>([]);
  const [time, setTime] = useState("");
  const [greeting, setGreeting] = useState("");

  // Clock tick
  useEffect(() => {
    const update = () => {
      const d = new Date();
      setTime(
        d.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })
      );
      const h = d.getHours();
      setGreeting(
        h < 6 ? "夜深了" : h < 12 ? "早上好" : h < 18 ? "下午好" : "晚上好"
      );
    };
    update();
    const iv = setInterval(update, 30000);
    return () => clearInterval(iv);
  }, []);

  useEffect(() => {
    if (currentHomeId) {
      loadAll();
      wsClient.connect(currentHomeId);
      return () => wsClient.disconnect();
    }
  }, [currentHomeId]);

  const loadAll = async () => {
    if (!currentHomeId) return;
    try {
      const [dash, roomList, ordersResp] = await Promise.all([
        getDashboard(currentHomeId),
        listRooms(currentHomeId),
        // Soft-fail orders query: a failure here shouldn't black out the whole
        // dashboard. Empty list = no badge, which is the right fallback.
        listOrders(currentHomeId).catch(() => ({ items: [], next_cursor: null })),
      ]);
      setDashboard(dash);
      setRooms(roomList);
      // backend already returns orders newest-first (created_at desc) — first 2
      // make a tight "最近工单" widget without overwhelming the home tab.
      setRecentOrders(ordersResp.items.slice(0, 2));
      const active = ordersResp.items.filter(
        (o) => o.status === "pending" || o.status === "in_progress"
      ).length;
      setActiveOrderCount(active);
    } catch {}
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAll();
    setRefreshing(false);
  };

  const handleSuggestionAction = async (
    id: string,
    action: "accept" | "dismiss"
  ) => {
    try {
      await updateSuggestion(id, action);
      await loadAll();
    } catch {}
  };

  // Use API data for device counts / AI suggestion, fallback to mock
  const dash = dashboard;
  const devicesTotal = dash?.devices.total ?? 24;
  const devicesOnline = dash?.devices.online ?? 21;
  const devicesRunning = dash?.devices.running ?? 9;
  const suggestion = dash?.ai_suggestions?.[0];

  // Use API rooms or fallback to mock
  const displayRooms =
    rooms.length > 0
      ? rooms.map((r) => ({
          id: r.id,
          nm: r.name,
          ic:
            MOCK_ROOMS.find((mr) => mr.id === r.id)?.ic ??
            "home",
          dv: r.device_count,
          tmp: r.temperature != null ? `${r.temperature}°` : "",
          on: r.running_count,
          c:
            MOCK_ROOMS.find((mr) => mr.id === r.id)?.c ??
            Colors.cyan,
        }))
      : MOCK_ROOMS;

  const userName = profile?.nickname || "张先生";

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={Colors.t2}
        />
      }
    >
      {/* ── Header ── */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>{greeting}，{userName}</Text>
          <Text style={styles.headerTime}>{time}</Text>
        </View>
        <TouchableOpacity style={styles.bellWrap} activeOpacity={0.7}>
          <Icon name="bell" size={16} color={Colors.t3} strokeWidth={1.5} />
          <View style={styles.bellDot} />
        </TouchableOpacity>
      </View>

      {/* ── Device status bar ── */}
      <View style={styles.statusBar}>
        <View style={styles.statusDot} />
        <Text style={styles.statusText}>
          设备 <Text style={{ fontWeight: "700" }}>{devicesOnline}</Text>/{devicesTotal} 在线 · <Text style={{ fontWeight: "700" }}>{devicesRunning}</Text> 运行中
        </Text>
        <Text style={styles.statusChevron}>›</Text>
      </View>

      {/* ── AI suggestion card ── */}
      <View style={styles.aiCard}>
        <View style={styles.aiCardHeaderRow}>
          <Icon name="sparkle" size={14} color={Colors.purple} strokeWidth={1.5} />
          <Text style={styles.aiCardTag}>AI 发现</Text>
          <Text style={styles.aiCardTime}>
            {suggestion ? `优先级 ${suggestion.priority}` : "5分钟前"}
          </Text>
        </View>
        <Text style={styles.aiCardDesc}>
          {suggestion?.description ||
            "你每天 22:30 关灯，建议创建「晚安」自动化"}
        </Text>
        <View style={styles.aiCardActions}>
          <TouchableOpacity
            style={styles.aiActionBtnPrimary}
            onPress={() =>
              suggestion
                ? handleSuggestionAction(suggestion.id, "accept")
                : undefined
            }
            activeOpacity={0.75}
          >
            <Text style={styles.aiActionTextPrimary}>启用</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.aiActionBtnSecondary}
            onPress={() =>
              suggestion
                ? handleSuggestionAction(suggestion.id, "dismiss")
                : undefined
            }
            activeOpacity={0.75}
          >
            <Text style={styles.aiActionTextSecondary}>忽略</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Scenes ── */}
      <View style={styles.scenesSection}>
        <View style={styles.scenesHeader}>
          <Text style={styles.sectionTitle}>场景</Text>
          <View style={{ flexDirection: "row", gap: 14 }}>
            <Text
              style={styles.scenesManage}
              onPress={() => router.push("/(marketplace)/")}
            >
              + 从市场
            </Text>
            <Text style={styles.scenesManage}>管理 ›</Text>
          </View>
        </View>
        <View style={styles.scenesRow}>
          {MOCK_SCENES.map((sc) => (
            <TouchableOpacity
              key={sc.nm}
              style={styles.sceneCard}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.sceneIconWrap,
                  { backgroundColor: sc.c + "12" },
                ]}
              >
                <Icon name={ICON_MAP[sc.ic] || "home"} size={16} color={sc.c} strokeWidth={1.5} />
              </View>
              <Text style={styles.sceneLabel}>{sc.nm}</Text>
              <Text style={styles.sceneSub}>{sc.a || "手动"}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* ── Rooms ── */}
      <View>
        <Text style={[styles.sectionTitle, { marginBottom: 10 }]}>房间</Text>
        {displayRooms.map((r) => (
          <TouchableOpacity
            key={r.id}
            style={styles.roomRow}
            onPress={() => router.push(`/room/${r.id}`)}
            activeOpacity={0.75}
          >
            <View
              style={[
                styles.roomIconWrap,
                {
                  backgroundColor: r.c + "0a",
                  borderColor: r.c + "15",
                },
              ]}
            >
              <Icon name={r.ic} size={20} color={r.c} strokeWidth={1.4} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.roomName}>{r.nm}</Text>
              <Text style={styles.roomMeta}>
                {r.on > 0 ? `${r.on}运行 · ${r.tmp}` : "全部关闭"}
              </Text>
            </View>
            {r.on > 0 && (
              <View
                style={[
                  styles.roomActiveDot,
                  { backgroundColor: r.c },
                ]}
              />
            )}
            <Text style={styles.roomChevron}>›</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ── Recent orders (only when ≥1 exists; spec says dashboard
            shouldn't be just badges — the user should see the actual
            most-recent orders without bouncing to the service tab) ── */}
      {recentOrders.length > 0 && (
        <View style={styles.recentOrdersSection}>
          <View style={styles.recentOrdersHeader}>
            <Text style={styles.sectionTitle}>最近工单</Text>
            <TouchableOpacity
              onPress={() => router.push("/(service)/")}
              activeOpacity={0.6}
            >
              <Text style={styles.recentOrdersAll}>全部 ›</Text>
            </TouchableOpacity>
          </View>
          {recentOrders.map((o) => (
            <OrderListItem
              key={o.id}
              order={o}
              onPress={() => router.push(`/(service)/${o.id}`)}
            />
          ))}
        </View>
      )}

      {/* ── Service entry ── */}
      <ServiceEntryCard
        icon="🔧"
        title={
          activeOrderCount > 0
            ? `${activeOrderCount} 个工单进行中`
            : "设备坏了？找师傅维修"
        }
        subtitle={
          activeOrderCount > 0
            ? "点击查看进度"
            : "专业工程师 · 30 分钟响应"
        }
        onPress={() => router.push("/(service)/")}
      />
    </ScrollView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 24,
  },

  // Header
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 18,
  },
  greeting: {
    fontSize: 13,
    color: Colors.t3,
    fontWeight: "500",
  },
  headerTime: {
    fontSize: 30,
    fontWeight: "800",
    color: Colors.t1,
    letterSpacing: -0.9,
    marginTop: 2,
  },
  bellWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 6,
    position: "relative",
  },
  bellIcon: {
    fontSize: 16,
    opacity: 0.45,
  },
  bellDot: {
    position: "absolute",
    top: 7,
    right: 7,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.rose,
    borderWidth: 1.5,
    borderColor: "#050508",
  },

  // Device status bar
  statusBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 16,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: Colors.emerald,
    shadowColor: Colors.emerald,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
  },
  statusText: {
    fontSize: 12,
    color: Colors.t2,
    flex: 1,
  },
  statusChevron: {
    fontSize: 14,
    color: "rgba(255,255,255,0.12)",
  },

  // AI suggestion card
  aiCard: {
    padding: 13,
    paddingHorizontal: 16,
    borderRadius: 18,
    backgroundColor: Colors.purple + "08",
    borderWidth: 1,
    borderColor: Colors.purple + "14",
    marginBottom: 16,
  },
  aiCardHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 5,
  },
  aiCardTag: {
    fontSize: 11,
    fontWeight: "700",
    color: Colors.purple,
  },
  aiCardTime: {
    fontSize: 9,
    color: Colors.t3,
    marginLeft: "auto",
  },
  aiCardDesc: {
    fontSize: 12,
    color: Colors.t2,
    lineHeight: 19.2,
  },
  aiCardActions: {
    flexDirection: "row",
    gap: 6,
    marginTop: 8,
  },
  aiActionBtnPrimary: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 8,
    backgroundColor: Colors.purple + "15",
  },
  aiActionTextPrimary: {
    fontSize: 11,
    fontWeight: "600",
    color: Colors.purple,
  },
  aiActionBtnSecondary: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  aiActionTextSecondary: {
    fontSize: 11,
    color: Colors.t3,
  },

  // Scenes
  scenesSection: {
    marginBottom: 16,
  },
  scenesHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.t1,
  },
  scenesManage: {
    fontSize: 12,
    color: Colors.t3,
  },
  scenesRow: {
    flexDirection: "row",
    gap: 8,
  },
  sceneCard: {
    flex: 1,
    alignItems: "center",
    paddingTop: 14,
    paddingBottom: 10,
    paddingHorizontal: 4,
    backgroundColor: Colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sceneIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  sceneLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: Colors.t1,
  },
  sceneSub: {
    fontSize: 8,
    color: Colors.t3,
    marginTop: 2,
  },

  // Rooms
  roomRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 18,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 7,
  },
  roomIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 13,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  roomName: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.t1,
  },
  roomMeta: {
    fontSize: 11,
    color: Colors.t3,
    marginTop: 1,
  },
  roomActiveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  roomChevron: {
    fontSize: 14,
    color: "rgba(255,255,255,0.12)",
  },

  // Recent orders widget (above service entry)
  recentOrdersSection: {
    marginTop: 16,
    marginBottom: 4,
  },
  recentOrdersHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  recentOrdersAll: {
    fontSize: 12,
    color: Colors.t3,
  },
});
