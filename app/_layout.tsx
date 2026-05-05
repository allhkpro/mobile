import { Slot, useRouter, useSegments } from "expo-router";
import { useEffect, useState } from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import * as Linking from "expo-linking";
import { useAuthStore } from "../stores/auth";
import { Colors } from "../constants/theme";
import { registerForPushAsync, setupPushDeepLink } from "../services/push";

export default function RootLayout() {
  const { token, loadToken, fetchProfile } = useAuthStore();
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

  // Bootstrap profile + currentHomeId at root level so deep links to any tab /
  // alert / pair screen don't show the !homeId fallback. Previously this only
  // fired in (tabs)/index.tsx::useEffect, which never runs when the app cold-
  // starts via APNs deep link straight to /alert/[id] or /security.
  useEffect(() => {
    if (token) fetchProfile().catch(() => {});
  }, [token]);

  useEffect(() => {
    // Fire-and-forget permission request + token registration
    registerForPushAsync().catch(() => {});
    // Deep link listener
    const sub = setupPushDeepLink();
    return () => sub.remove();
  }, []);

  // OAuth callback deep link handler: aiknx://oauth/<provider>?code=...
  useEffect(() => {
    const sub = Linking.addEventListener("url", ({ url }) => {
      const parsed = Linking.parse(url);
      if (parsed.hostname === "oauth") {
        const provider = (parsed.path ?? "").replace(/^\//, "");
        const code = parsed.queryParams?.code as string | undefined;
        if (provider && code) {
          router.push(
            `/(marketplace)/providers/${provider}?oauth_code=${encodeURIComponent(code)}` as any,
          );
        }
      }
    });
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
