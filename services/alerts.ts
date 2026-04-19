import api from "./api";
import { Endpoints } from "../constants/api";

export type AlertType = "fire" | "smoke" | "fall" | "stranger";
export type Severity = "critical" | "warning" | "info";
export type LabelType = "correct" | "false_positive" | "miss_reported" | "wrong_class";

export interface AlertListItem {
  id: string;
  alert_type: AlertType;
  severity: Severity;
  triggered_at: string;  // ISO-8601
  camera_id: string;
  camera_name: string;
  frame_thumbnail_url: string | null;
  label_type: LabelType | null;
  site_id: string;
}

export interface AlertDetail extends AlertListItem {
  local_alert_id: string;
  verdict: Record<string, unknown>;
  frame_url: string | null;
  clip_url: string | null;
  vlm_model_version: string;
  corrected_class: AlertType | null;
  label_note: string | null;
  labeled_at: string | null;
}

export interface AlertListResponse {
  items: AlertListItem[];
  next_cursor: string | null;
}

export interface ListParams {
  home_id: string;
  limit?: number;
  cursor?: string;
  alert_type?: AlertType;
  labeled?: boolean;
}

export async function listAlerts(params: ListParams): Promise<AlertListResponse> {
  const { data } = await api.get<AlertListResponse>(Endpoints.alerts.list, { params });
  return data;
}

export async function getAlert(id: string): Promise<AlertDetail> {
  const { data } = await api.get<AlertDetail>(Endpoints.alerts.detail(id));
  return data;
}

export interface LabelPayload {
  label_type: LabelType;
  corrected_class?: AlertType;
  note?: string;
}

export async function labelAlert(id: string, payload: LabelPayload): Promise<void> {
  await api.post(Endpoints.alerts.label(id), payload);
}
