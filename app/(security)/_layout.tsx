import { Stack } from "expo-router";

export default function SecurityLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: "#0A0A0B" },
        headerTintColor: "#fff",
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen name="pair" options={{ title: "添加摄像头主机" }} />
    </Stack>
  );
}
