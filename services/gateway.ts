import api from "./api";
import { Endpoints } from "../constants/api";

export interface GatewayRegisterResp {
  gateway_id: string;
  register_token: string;
  ws_url: string;
  /** v1-compat alias for register_token (backend returns both). */
  token?: string;
}

export interface GatewayStatus {
  paired: boolean;
  gateway_id?: string;
  status?: "online" | "offline";
  last_seen?: string | null;
  device_count?: number;
}

/** Mobile-driven gateway pairing: backend creates Gateway + ProviderConnection
 *  in same transaction, returns the register_token + ws_url. Mobile then
 *  relays these to the gateway's /setup-pair endpoint along with the sticker code. */
export async function registerGateway(homeId: string, name: string): Promise<GatewayRegisterResp> {
  const { data } = await api.post<GatewayRegisterResp>(Endpoints.gateway.register, {
    home_id: homeId,
    gateway_name: name,
  });
  return data;
}

export async function getGatewayStatus(homeId: string): Promise<GatewayStatus> {
  const { data } = await api.get<GatewayStatus>(Endpoints.gateway.status, {
    params: { home_id: homeId },
  });
  return data;
}
