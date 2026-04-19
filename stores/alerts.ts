import { create } from "zustand";
import { AlertListItem, AlertType, labelAlert, LabelPayload, listAlerts } from "../services/alerts";

interface AlertsState {
  items: AlertListItem[];
  cursor: string | null;
  loading: boolean;
  error: string | null;
  filter: { alert_type?: AlertType; labeled?: boolean };

  loadFirstPage: (home_id: string) => Promise<void>;
  loadNextPage: (home_id: string) => Promise<void>;
  setFilter: (f: AlertsState["filter"]) => void;
  applyLabel: (alert_id: string, payload: LabelPayload) => Promise<void>;
  reset: () => void;
}

const LIMIT = 20;

export const useAlertsStore = create<AlertsState>((set, get) => ({
  items: [],
  cursor: null,
  loading: false,
  error: null,
  filter: {},

  async loadFirstPage(home_id) {
    set({ loading: true, error: null, items: [], cursor: null });
    try {
      const f = get().filter;
      const resp = await listAlerts({ home_id, limit: LIMIT, ...f });
      set({ items: resp.items, cursor: resp.next_cursor, loading: false });
    } catch (e) {
      set({ loading: false, error: String(e) });
    }
  },

  async loadNextPage(home_id) {
    const { cursor, loading, items, filter } = get();
    if (!cursor || loading) return;
    set({ loading: true });
    try {
      const resp = await listAlerts({ home_id, limit: LIMIT, cursor, ...filter });
      set({ items: [...items, ...resp.items], cursor: resp.next_cursor, loading: false });
    } catch (e) {
      set({ loading: false, error: String(e) });
    }
  },

  setFilter(f) {
    set({ filter: f, items: [], cursor: null });
  },

  async applyLabel(alert_id, payload) {
    const { items } = get();
    const previous = items.find((i) => i.id === alert_id);
    // optimistic update
    set({
      items: items.map((i) =>
        i.id === alert_id ? { ...i, label_type: payload.label_type } : i
      ),
    });
    try {
      await labelAlert(alert_id, payload);
    } catch (e) {
      // rollback
      if (previous) {
        set({
          items: get().items.map((i) => (i.id === alert_id ? previous : i)),
        });
      }
      throw e;
    }
  },

  reset() {
    set({ items: [], cursor: null, loading: false, error: null, filter: {} });
  },
}));
