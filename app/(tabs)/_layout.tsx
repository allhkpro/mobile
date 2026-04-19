import { Tabs } from "expo-router";
import { View, Text, StyleSheet } from "react-native";
import { Colors } from "../../constants/theme";

function TabIcon({ label, active, color }: { label: string; active: boolean; color: string }) {
  return (
    <View style={styles.tabIcon}>
      {active && <View style={[styles.dot, { backgroundColor: color, shadowColor: color }]} />}
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "rgba(5,5,8,0.9)",
          borderTopWidth: 0.5,
          borderTopColor: "rgba(255,255,255,0.05)",
          height: 82,
          paddingBottom: 20,
        },
        tabBarActiveTintColor: Colors.cyan,
        tabBarInactiveTintColor: "rgba(255,255,255,0.16)",
        tabBarLabelStyle: { fontSize: 10, fontWeight: "600" },
      }}
    >
      <Tabs.Screen name="index" options={{
        title: "智家",
        tabBarActiveTintColor: Colors.cyan,
        tabBarIcon: ({ focused }) => <TabIcon label="智家" active={focused} color={Colors.cyan} />,
      }} />
      <Tabs.Screen name="ai" options={{
        title: "AI",
        tabBarActiveTintColor: Colors.purple,
        tabBarIcon: ({ focused }) => <TabIcon label="AI" active={focused} color={Colors.purple} />,
      }} />
      <Tabs.Screen name="data" options={{
        title: "数据",
        tabBarActiveTintColor: Colors.blue,
        tabBarIcon: ({ focused }) => <TabIcon label="数据" active={focused} color={Colors.blue} />,
      }} />
      <Tabs.Screen name="security" options={{
        title: "安防",
        tabBarActiveTintColor: Colors.red ?? "#FF3B30",
        tabBarIcon: ({ focused }) => (
          <TabIcon label="安防" active={focused} color={Colors.red ?? "#FF3B30"} />
        ),
      }} />
      <Tabs.Screen name="me" options={{
        title: "我的",
        tabBarActiveTintColor: Colors.t2,
        tabBarIcon: ({ focused }) => <TabIcon label="我的" active={focused} color={Colors.t2} />,
      }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabIcon: { alignItems: "center", justifyContent: "center", height: 22 },
  dot: { width: 4, height: 4, borderRadius: 2, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 1, shadowRadius: 4 },
});
