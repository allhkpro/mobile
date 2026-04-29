import { useEffect, useRef } from "react";
import { WS_URL } from "../constants/api";

export type OrderUpdateEvent = {
  type: "order_update";
  order_id: string;
  status?: "pending" | "in_progress" | "completed" | "cancelled";
  payment_status?:
    | "not_quoted" | "quoted" | "partially_paid" | "paid" | "cancelled";
  engineer_id?: string;
  engineer_name?: string;
  quoted_amount?: number;
  ts: string;
};

/**
 * Subscribe to order_update events on /ws/v1/home/{homeId}.
 * Auto-closes on unmount or homeId change. Errors are logged, not raised.
 */
export function useOrderUpdates(
  homeId: string | undefined,
  onUpdate: (e: OrderUpdateEvent) => void
) {
  const onUpdateRef = useRef(onUpdate);
  onUpdateRef.current = onUpdate;

  useEffect(() => {
    if (!homeId) return;
    let ws: WebSocket | null = null;
    try {
      ws = new WebSocket(`${WS_URL}/ws/v1/home/${homeId}`);
    } catch (err) {
      console.warn("WS open failed", err);
      return;
    }
    ws.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        if (data.type === "order_update") onUpdateRef.current(data);
      } catch {
        /* swallow */
      }
    };
    ws.onerror = (err) => console.warn("WS error", err);
    return () => {
      try {
        ws?.close();
      } catch {}
    };
  }, [homeId]);
}
