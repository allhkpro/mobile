import { Slot, useRouter, useSegments } from "expo-router";
import { useEffect, useState } from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { useAuthStore } from "../stores/auth";
import { Colors } from "../constants/theme";
import { registerForPushAsync, setupPushDeepLink } from "../services/push";

export default function RootLayout() {
  const { token, loadToken } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    loadToken().finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (loading) return;

    const inAuth = segments[0] === "(auth)";

    if (!token && !inAuth) {
      router.replace("/(auth)/login");
    } else if (token && inAuth) {
      router.replace("/(tabs)");
    }
  }, [token, segments, loading]);

  useEffect(() => {
    // Fire-and-forget permission request + token registration
    registerForPushAsync().catch(() => {});
    // Deep link listener
    const sub = setupPushDeepLink();
    return () => sub.remove();
  }, []);

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return <Slot />;
}

const styles = StyleSheet.create({
  loading: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: Colors.background },
});
