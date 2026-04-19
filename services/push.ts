import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { router } from "expo-router";
import api from "./api";
import { Endpoints } from "../constants/api";

let registeredTokenId: string | null = null;

export async function registerForPushAsync(): Promise<string | null> {
  if (Platform.OS !== "ios") return null; // v1: iOS only

  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;
  if (existing !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== "granted") return null;

  const tokenData = await Notifications.getDevicePushTokenAsync();
  const deviceToken = tokenData.data;

  const { data } = await api.post<{ token_id: string }>(
    Endpoints.push.register,
    { device_token: deviceToken, platform: "ios" }
  );
  registeredTokenId = data.token_id;
  return registeredTokenId;
}

export async function revokePushAsync(): Promise<void> {
  if (!registeredTokenId) return;
  try {
    await api.delete(Endpoints.push.revoke(registeredTokenId));
  } finally {
    registeredTokenId = null;
  }
}

/**
 * 注册一个全局 listener：用户点通知或通知在前台到达时，如果 payload 里有 alert_id，
 * 跳转到 /alert/{alert_id}
 */
export function setupPushDeepLink() {
  // Configure foreground behavior
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });

  return Notifications.addNotificationResponseReceivedListener((response) => {
    const alertId = response.notification.request.content.data?.alert_id;
    if (typeof alertId === "string") {
      router.push(`/alert/${alertId}`);
    }
  });
}
