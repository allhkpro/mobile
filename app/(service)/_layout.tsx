import { Stack } from "expo-router";

export default function ServiceLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: "#0A0A0B" },
        headerTintColor: "#fff",
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen name="index" options={{ title: "服务" }} />
      <Stack.Screen name="new" options={{ title: "提交报修" }} />
      <Stack.Screen name="[id]" options={{ title: "工单详情" }} />
      <Stack.Screen
        name="pay/[id]"
        options={{ presentation: "modal", headerShown: false }}
      />
    </Stack>
  );
}
