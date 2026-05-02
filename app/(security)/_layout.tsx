import { Stack } from "expo-router";
import { Colors } from "../../constants/theme";

export default function SecurityLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: Colors.background ?? "#030306" },
        headerTintColor: "#fff",
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen name="pair" options={{ title: "添加摄像头主机" }} />
    </Stack>
  );
}
