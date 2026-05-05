import { Stack } from "expo-router";
import { Colors } from "../../constants/theme";

export default function MarketplaceLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: Colors.bg },
        headerTintColor: Colors.t1,
        contentStyle: { backgroundColor: Colors.bg },
      }}
    >
      <Stack.Screen name="index" options={{ title: "AI 应用市场" }} />
      <Stack.Screen name="[id]" options={{ title: "技能详情" }} />
      <Stack.Screen name="generate" options={{ title: "自己描述创建" }} />
      <Stack.Screen name="installed" options={{ title: "已安装" }} />
      <Stack.Screen name="providers/[key]" options={{ title: "接入设备" }} />
      <Stack.Screen name="connections" options={{ title: "已接入" }} />
    </Stack>
  );
}
