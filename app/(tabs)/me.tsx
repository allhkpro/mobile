import { ScrollView, View, Text, TouchableOpacity, StyleSheet, Alert, Linking } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import Constants from "expo-constants";
import { useAuthStore } from "../../stores/auth";
import { deleteAccount } from "../../services/auth";
import { Colors } from "../../constants/theme";
import { Icon } from "../../components/ui/Icon";

const serviceButtons = [
  { l: "附近门店", c: Colors.cyan },
  { l: "找工程师", c: Colors.blue },
  { l: "售后报修", c: Colors.emerald },
];

// Each item may carry an `onPress` handler. Items without one are still
// rendered (as visual placeholders) but are no-ops on tap. As features land,
// fill in the handler — UI doesn't change.
type MenuItem = { l: string; b?: string; onPress?: () => void };

// `mailto:` and `Linking.openSettings()` are the cheapest ways to land
// 帮助反馈 / 通知偏好 with no backend / no extra screens. Both are App Store
// compliant first-launch behaviors.
const FEEDBACK_MAILTO = "mailto:support@aiknx.com?subject=智能家居%20App%20%E5%8F%8D%E9%A6%88";

const menuSections: { t: string; items: MenuItem[] }[] = [
  { t: "家庭", items: [{ l: "家庭管理" }, { l: "成员与权限" }] },
  {
    t: "项目与服务",
    items: [
      { l: "施工进度", b: "进行中" },
      { l: "设备物流", b: "2" },
      { l: "售后工单" },
      { l: "我的报价" },
    ],
  },
  { t: "发现", items: [{ l: "品牌馆" }, { l: "灵感案例" }] },
  {
    t: "设置",
    items: [
      { l: "网络管理" },
      { l: "网关管理" },
      {
        l: "通知偏好",
        onPress: () => {
          Linking.openSettings().catch(() => {
            Alert.alert("打开失败", "请在系统「设置」中找到本应用调整通知偏好。");
          });
        },
      },
      { l: "隐私安全" },
      {
        l: "帮助反馈",
        onPress: () => {
          Linking.openURL(FEEDBACK_MAILTO).catch(() => {
            Alert.alert(
              "邮件应用未配置",
              "请发送邮件至 support@aiknx.com 反馈问题。",
            );
          });
        },
      },
    ],
  },
];

export default function MeScreen() {
  const router = useRouter();
  const { profile, logout } = useAuthStore();

  const displayName = profile?.nickname || "张先生";
  const displayInitial = displayName[0] || "张";

  const handleLogout = () => {
    Alert.alert("退出登录", "确定要退出吗？", [
      { text: "取消", style: "cancel" },
      {
        text: "确定",
        style: "destructive",
        onPress: () => {
          logout();
          router.replace("/(auth)/login");
        },
      },
    ]);
  };

  // Two-step confirm so a single mis-tap can't nuke the account. The second
  // dialog is the irreversible action gate. After delete the JWT becomes
  // invalid (server rejects with 401 on next request), so we logout locally
  // and navigate to /login immediately.
  const handleDeleteAccount = () => {
    Alert.alert(
      "注销账号",
      "注销后账号将无法登录，与你绑定的手机号可重新注册新账号。订单 / 收款记录会保留供对账，但不再与你关联。\n\n此操作无法撤销。",
      [
        { text: "取消", style: "cancel" },
        {
          text: "继续",
          style: "destructive",
          onPress: () => {
            Alert.alert("最后确认", "真的要注销账号吗？", [
              { text: "取消", style: "cancel" },
              {
                text: "确定注销",
                style: "destructive",
                onPress: async () => {
                  try {
                    await deleteAccount();
                  } catch (e: any) {
                    Alert.alert(
                      "注销失败",
                      e?.response?.data?.detail || "请稍后再试",
                    );
                    return;
                  }
                  await logout();
                  router.replace("/(auth)/login");
                },
              },
            ]);
          },
        },
      ],
    );
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Profile header */}
      <View style={styles.profileHeader}>
        <LinearGradient
          colors={[Colors.blue, Colors.purple]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.avatar}
        >
          <Text style={styles.avatarText}>{displayInitial}</Text>
        </LinearGradient>
        <View style={{ flex: 1 }}>
          <Text style={styles.profileName}>{displayName}</Text>
          <Text style={styles.membershipText}>PRO 会员 · 2027.03</Text>
        </View>
        <TouchableOpacity activeOpacity={0.7}>
          <Icon name="gear" size={18} color="rgba(255,255,255,0.25)" strokeWidth={1.5} />
        </TouchableOpacity>
      </View>

      {/* Service buttons */}
      <View style={styles.serviceRow}>
        {serviceButtons.map((sv) => (
          <TouchableOpacity key={sv.l} style={[styles.serviceCard, { backgroundColor: `${sv.c}06`, borderColor: `${sv.c}12` }]} activeOpacity={0.7}>
            <View style={[styles.serviceIconCircle, { backgroundColor: `${sv.c}12` }]}>
              <Text style={{ fontSize: 14 }}>●</Text>
            </View>
            <Text style={styles.serviceLabel}>{sv.l}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Menu sections */}
      {menuSections.map((sec) => (
        <View key={sec.t} style={{ marginBottom: 16 }}>
          <Text style={styles.sectionTitle}>{sec.t}</Text>
          <View style={styles.menuCard}>
            {sec.items.map((it, i) => (
              <TouchableOpacity
                key={it.l}
                style={[
                  styles.menuItem,
                  i < sec.items.length - 1 && {
                    borderBottomWidth: 1,
                    borderBottomColor: Colors.border,
                  },
                ]}
                activeOpacity={it.onPress ? 0.7 : 1}
                onPress={it.onPress}
              >
                <Text style={styles.menuItemLabel}>{it.l}</Text>
                {it.b && (
                  <View
                    style={[
                      styles.menuBadge,
                      {
                        backgroundColor:
                          it.b === "进行中" ? `${Colors.amber}15` : `${Colors.rose}15`,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.menuBadgeText,
                        {
                          color: it.b === "进行中" ? Colors.amber : Colors.rose,
                        },
                      ]}
                    >
                      {it.b}
                    </Text>
                  </View>
                )}
                <Text style={styles.chevron}>›</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ))}

      {/* Account section — soft delete (App Store 5.1.1(v) compliance) */}
      <View style={{ marginBottom: 16 }}>
        <Text style={styles.sectionTitle}>账号</Text>
        <View style={styles.menuCard}>
          <TouchableOpacity
            style={styles.menuItem}
            activeOpacity={0.7}
            onPress={handleDeleteAccount}
          >
            <Text style={[styles.menuItemLabel, { color: Colors.rose }]}>
              注销账号
            </Text>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Logout */}
      <TouchableOpacity style={styles.logoutBtn} activeOpacity={0.7} onPress={handleLogout}>
        <Text style={styles.logoutText}>退出登录</Text>
      </TouchableOpacity>

      {/* Version footer — App Store compliance + diagnostic value */}
      <Text style={styles.versionText}>
        版本 {Constants.expoConfig?.version ?? "—"}
        {Constants.expoConfig?.ios?.buildNumber
          ? ` (Build ${Constants.expoConfig.ios.buildNumber})`
          : ""}
      </Text>

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    paddingTop: 60,
  },

  // Profile header
  profileHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginBottom: 24,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 20,
    fontWeight: "800",
    color: "#fff",
  },
  profileName: {
    fontSize: 18,
    fontWeight: "800",
    color: Colors.t1,
  },
  membershipText: {
    fontSize: 11,
    color: Colors.purple,
    marginTop: 2,
  },
  gearIcon: {
    fontSize: 18,
    color: "rgba(255,255,255,0.25)",
  },

  // Service buttons
  serviceRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 20,
  },
  serviceCard: {
    flex: 1,
    alignItems: "center",
    paddingTop: 12,
    paddingBottom: 10,
    paddingHorizontal: 6,
    borderRadius: 14,
    borderWidth: 1,
  },
  serviceIconCircle: {
    width: 30,
    height: 30,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 5,
  },
  serviceLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: Colors.t1,
  },

  // Menu sections
  sectionTitle: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.t3,
    marginBottom: 6,
    paddingLeft: 2,
  },
  menuCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: "hidden",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  menuItemLabel: {
    flex: 1,
    fontSize: 13,
    color: Colors.t1,
    fontWeight: "500",
  },
  menuBadge: {
    paddingVertical: 2,
    paddingHorizontal: 7,
    borderRadius: 5,
  },
  menuBadgeText: {
    fontSize: 9,
    fontWeight: "600",
  },
  chevron: {
    fontSize: 12,
    color: "rgba(255,255,255,0.1)",
  },

  // Logout
  logoutBtn: {
    alignItems: "center",
    paddingVertical: 16,
    marginTop: 8,
  },
  logoutText: {
    fontSize: 15,
    color: Colors.rose,
    fontWeight: "500",
  },

  versionText: {
    textAlign: "center",
    fontSize: 11,
    color: Colors.t3,
    marginTop: 4,
    opacity: 0.6,
  },
});
