import api from "./api";
import { Endpoints } from "../constants/api";

export type OrderType = "repair" | "install" | "debug" | "consult";
export type OrderStatus = "pending" | "in_progress" | "completed" | "cancelled";
export type PaymentStatus =
  | "not_quoted"
  | "quoted"
  | "partially_paid"
  | "paid"
  | "cancelled";
export type PayMethod = "wechat" | "alipay" | "balance";

export interface OrderListItem {
  id: string;
  type: OrderType;
  description: string;
  status: OrderStatus;
  engineer_id: string | null;
  engineer_name: string | null;
  quoted_amount: number | null;
  payment_status: PaymentStatus;
  created_at: string;
}

export interface EngineerBrief {
  id: string;
  name: string;
  title: string | null;
  rating: number | null;
  completed_jobs: number;
  skills: string[];
}

export interface PaymentBrief {
  id: string;
  amount_cents: number;
  method: string;
  status: string;
  paid_at: string | null;
  created_at: string;
}

export interface OrderDetail {
  id: string;
  home_id: string;
  type: OrderType;
  description: string;
  status: OrderStatus;
  payment_status: PaymentStatus;
  quoted_amount: number | null;
  quoted_at: string | null;
  created_at: string;
  engineer: EngineerBrief | null;
  payments: PaymentBrief[];
}

/**
 * Shape returned by `POST /api/v1/orders` (backend `OrderOut` model).
 *
 * Distinct from `OrderDetail` — at creation time the order has no engineer
 * assigned (it goes into the pool) and no payments yet, so the response
 * deliberately omits those fields. Use `getOrder(id)` afterwards to fetch
 * the full `OrderDetail` once a师傅 accepts.
 */
export interface OrderCreated {
  id: string;
  home_id: string;
  type: OrderType;
  description: string;
  status: OrderStatus;
  engineer_id: string | null;
  quoted_amount: number | null;
  payment_status: PaymentStatus;
  created_at: string;
}

export async function listOrders(homeId: string, status?: OrderStatus, cursor?: string) {
  const params: Record<string, string> = { home_id: homeId };
  if (status) params.status = status;
  if (cursor) params.cursor = cursor;
  const { data } = await api.get<{ items: OrderListItem[]; next_cursor: string | null }>(
    Endpoints.orders.list,
    { params }
  );
  return data;
}

export async function getOrder(id: string) {
  const { data } = await api.get<OrderDetail>(Endpoints.orders.detail(id));
  return data;
}

export async function createOrder(body: {
  home_id: string;
  type: OrderType;
  description: string;
  preferred_time?: string;
  context_alert_id?: string;
}) {
  const { data } = await api.post<OrderCreated>(Endpoints.orders.create, body);
  return data;
}

export async function cancelOrder(id: string) {
  const { data } = await api.post<{ id: string; status: string }>(Endpoints.orders.cancel(id), {});
  return data;
}

export async function payOrder(id: string, method: PayMethod) {
  const { data } = await api.post(Endpoints.orders.pay(id), { method });
  return data as {
    payment: { id: string; amount_cents: number; method: string; status: string; paid_at: string | null };
    earning_created: { id: string; net_amount: number; status: string };
    order_payment_status: PaymentStatus;
  };
}
