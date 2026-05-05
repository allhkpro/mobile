import api from "./api";
import { Endpoints } from "../constants/api";

export interface RegisteredProvider {
  key: string;
  name: string;
  icon: string;
  category: string;
  auth_kind: "none" | "oauth2" | "apikey" | "lan_pair";
}

export interface ProviderConnection {
  id: string;
  home_id: string;
  provider: string;
  status: "connecting" | "connected" | "disconnected" | "error";
  last_synced_at: string | null;
  error_message: string | null;
  created_at: string;
  device_count: number;
}

export interface StartFlowResult {
  auth_url?: string | null;
  challenge?: Record<string, any> | null;
  immediate_connection_id?: string | null;
}

export async function listRegistered(): Promise<RegisteredProvider[]> {
  const { data } = await api.get<RegisteredProvider[]>(Endpoints.providers.registered);
  return data;
}

export async function listConnections(homeId: string): Promise<ProviderConnection[]> {
  const { data } = await api.get<ProviderConnection[]>(Endpoints.providers.connections(homeId));
  return data;
}

export async function startConnect(homeId: string, providerKey: string): Promise<StartFlowResult> {
  const { data } = await api.post<StartFlowResult>(
    Endpoints.providers.start(homeId, providerKey),
  );
  return data;
}

export async function completeConnect(
  homeId: string, providerKey: string, authPayload: Record<string, any>,
): Promise<ProviderConnection> {
  const { data } = await api.post<ProviderConnection>(
    Endpoints.providers.complete(homeId, providerKey),
    { auth_payload: authPayload },
  );
  return data;
}

export async function syncConnection(connectionId: string): Promise<{ device_count: number }> {
  const { data } = await api.post<{ device_count: number }>(
    Endpoints.providers.sync(connectionId),
  );
  return data;
}

export async function disconnect(connectionId: string): Promise<void> {
  await api.delete(Endpoints.providers.disconnect(connectionId));
}
