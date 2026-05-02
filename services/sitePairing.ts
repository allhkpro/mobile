/**
 * 站点配对的 3 个 API 调用。
 *
 * 1. discoverSites: 局域网 mDNS 扫描（在 useMDnsScan hook 里）
 * 2. registerSite: backend 调一次拿 token
 * 3. pushSetup: 直接给 LAN 上的 zhitong site 推 token + code
 */
import api from "./api";

export interface DiscoveredSite {
  device_id: string;       // "zhitong-3F9A82"
  ip: string;              // "192.168.0.42"
  port: number;            // 9100
}

export interface RegisterSiteResponse {
  site_id: string;
  token: string;
}

export async function registerSite(home_id: string, name = "home-zhitong") {
  const { data } = await api.post<RegisterSiteResponse>(
    "/api/v1/sites/register",
    { home_id, name },
  );
  return data;
}

export async function rotateSiteToken(home_id: string) {
  const { data } = await api.post<RegisterSiteResponse>(
    `/api/v1/sites/rotate-token?home_id=${home_id}`,
  );
  return data;
}

export async function pushSetup(args: {
  ip: string;
  port: number;
  token: string;
  backend_url: string;
  home_id: string;
  pairing_code: string;
}): Promise<void> {
  const { ip, port, token, backend_url, home_id, pairing_code } = args;
  const resp = await fetch(`http://${ip}:${port}/setup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token, backend_url, home_id, pairing_code }),
  });
  if (!resp.ok) {
    if (resp.status === 401) throw new Error("BAD_CODE");
    if (resp.status === 423) throw new Error("LOCKED");
    throw new Error(`HTTP ${resp.status}`);
  }
}
