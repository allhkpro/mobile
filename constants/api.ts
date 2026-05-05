// Production URL is injected at build time via EAS (see mobile/eas.json env block).
// Falls back to the real prod URL so misconfigured prod builds at least hit
// the right host — kept as a known-correct value, not the old placeholder.
const PROD_BASE = process.env.EXPO_PUBLIC_API_BASE_URL ?? "https://api.aiknx.com";

// Dev URL: defaults to localhost (works for iOS Simulator + Android Emulator
// host-loopback). For a real iPhone testing via Expo Go on the same WiFi,
// set EXPO_PUBLIC_DEV_API_BASE=http://<your-LAN-IP>:8000 in your shell before
// running `npx expo start`.
const DEV_BASE = process.env.EXPO_PUBLIC_DEV_API_BASE ?? "http://localhost:8000";

const ACTIVE_BASE = __DEV__ ? DEV_BASE : PROD_BASE;

export const BASE_URL = ACTIVE_BASE;
export const WS_URL = ACTIVE_BASE.replace(/^https?:/, (m) =>
  m === "https:" ? "wss:" : "ws:"
);

export const Endpoints = {
  auth: {
    sendSMS: "/api/v1/auth/sms/send",
    verifySMS: "/api/v1/auth/sms/verify",
    wechatLogin: "/api/v1/auth/wechat/login",
    switchRole: "/api/v1/auth/switch-role",
    refresh: "/api/v1/auth/refresh",
    me: "/api/v1/auth/me",
    deleteAccount: "/api/v1/auth/delete-account",
  },
  dashboard: (homeId: string) => `/api/v1/homes/${homeId}/dashboard`,
  orders: {
    list: "/api/v1/orders",
    detail: (id: string) => `/api/v1/orders/${id}`,
    create: "/api/v1/orders",
    cancel: (id: string) => `/api/v1/orders/${id}/cancel`,
    pay: (id: string) => `/api/v1/orders/${id}/pay`,
  },
  suggestion: (id: string) => `/api/v1/ai/suggestions/${id}`,
  rooms: (homeId: string) => `/api/v1/homes/${homeId}/rooms`,
  devices: (roomId: string) => `/api/v1/rooms/${roomId}/devices`,
  deviceCommand: (deviceId: string) => `/api/v1/devices/${deviceId}/command`,
  batchControl: (roomId: string) => `/api/v1/rooms/${roomId}/batch`,
  scenes: (homeId: string) => `/api/v1/homes/${homeId}/scenes`,
  sceneExecute: (sceneId: string) => `/api/v1/scenes/${sceneId}/execute`,
  sceneAIGenerate: "/api/v1/scenes/ai-generate",
  marketplace: {
    skills: "/api/v1/skills",
    skillDetail: (id: string) => `/api/v1/skills/${id}`,
    aiGenerate: "/api/v1/skills/ai-generate",
    installations: (homeId: string) => `/api/v1/homes/${homeId}/installations`,
    uninstall: (id: string) => `/api/v1/installations/${id}`,
  },
  providers: {
    registered: "/api/v1/providers/registered",
    connections: (homeId: string) => `/api/v1/homes/${homeId}/connections`,
    start: (homeId: string, key: string) => `/api/v1/homes/${homeId}/connections/${key}/start`,
    complete: (homeId: string, key: string) => `/api/v1/homes/${homeId}/connections/${key}/complete`,
    sync: (id: string) => `/api/v1/connections/${id}/sync`,
    disconnect: (id: string) => `/api/v1/connections/${id}`,
  },
  chat: "/api/v1/ai/chat",
  chatHistory: "/api/v1/ai/chat/history",
  floorplan: (homeId: string) => `/api/v1/homes/${homeId}/floorplan`,
  ipadConfig: "/api/v1/ipad-configs/current",
  ipadConfigUpdate: (configId: string) => `/api/v1/ipad-configs/${configId}`,
  alerts: {
    list: "/api/v1/alerts",
    detail: (id: string) => `/api/v1/alerts/${id}`,
    label: (id: string) => `/api/v1/alerts/${id}/label`,
  },
  push: {
    register: "/api/v1/push/register",
    revoke: (tokenId: string) => `/api/v1/push/${tokenId}`,
  },
  sites: {
    status: "/api/v1/sites/status",
  },
  engineer: {
    orders: "/api/v1/engineer/orders",
    respondOrder: (orderId: string) => `/api/v1/engineer/orders/${orderId}/respond`,
    documents: (orderId: string) => `/api/v1/engineer/orders/${orderId}/documents`,
    logs: (orderId: string) => `/api/v1/engineer/orders/${orderId}/logs`,
    inventory: (orderId: string) => `/api/v1/engineer/orders/${orderId}/inventory`,
    aiParse: "/api/v1/engineer/ai/parse-input",
    dashboard: "/api/v1/engineer/dashboard",
  },
  ws: (homeId: string) => `/ws/v1/home/${homeId}`,
};
