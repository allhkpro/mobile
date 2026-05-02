import { Stack, useRouter } from "expo-router";
import { Pressable, Text } from "react-native";

/** Back button shown on the (service) stack root.
 *  This stack is pushed from the home tab via `router.push("/(service)/")`,
 *  but its index screen is the *root* of this nested Stack — so expo-router
 *  doesn't auto-render a back button. Provide an explicit headerLeft that
 *  calls `router.back()` to pop back into the (tabs) group.
 */
function ServiceBackButton() {
  const router = useRouter();
  return (
    <Pressable
      onPress={() => router.back()}
      hitSlop={12}
      accessibilityLabel="返回"
      accessibilityRole="button"
    >
      <Text style={{ color: "#fff", fontSize: 17 }}>‹ 返回</Text>
    </Pressable>
  );
}

export default function ServiceLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: "#0A0A0B" },
        headerTintColor: "#fff",
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: "服务",
          headerLeft: () => <ServiceBackButton />,
        }}
      />
      <Stack.Screen name="new" options={{ title: "提交报修" }} />
      <Stack.Screen name="[id]" options={{ title: "工单详情" }} />
      <Stack.Screen
        name="pay/[id]"
        options={{ presentation: "modal", headerShown: false }}
      />
    </Stack>
  );
}
