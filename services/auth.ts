import api from "./api";
import { Endpoints } from "../constants/api";

export async function sendSMSCode(phone: string) {
  const { data } = await api.post(Endpoints.auth.sendSMS, { phone });
  return data;
}

export async function verifySMSCode(phone: string, code: string) {
  const { data } = await api.post(Endpoints.auth.verifySMS, { phone, code });
  return data as {
    access_token: string;
    user_id: string;
    is_new: boolean;
    role: string;
    expires_in: number;
  };
}

/**
 * Soft-deletes the authenticated user (App Store guideline 5.1.1(v)).
 * Backend nulls phone/wechat_openid + sets deleted_at; subsequent calls with
 * the same JWT return 401. Caller must logout + navigate away on success.
 */
export async function deleteAccount(): Promise<void> {
  await api.post(Endpoints.auth.deleteAccount);
}
