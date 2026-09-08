import { useEffect } from "react";

import { api, onTrafficTick } from "@/lib/tauri";
import { useTrafficStore } from "@/store/trafficStore";
import { useTauriEvent } from "@/hooks/useTauriEvent";
import { SYSTEM_TRAFFIC_KEY } from "@/lib/types";

/** Subscribes the whole app to live traffic ticks once. Mount near the root. */
export function useTrafficSubscription() {
  const applyTick = useTrafficStore((s) => s.applyTick);
  useTauriEvent(() => onTrafficTick(applyTick), []);
}

/** Backfills a connection's rolling traffic window from the backend once,
 * then relies on the live subscription above to keep it current. */
export function useTrafficSeries(id: string | null) {
  const seedSeries = useTrafficStore((s) => s.seedSeries);
  const series = useTrafficStore((s) => (id ? s.seriesById.get(id) : undefined));

  useEffect(() => {
    if (!id) return;
    const fetcher = id === SYSTEM_TRAFFIC_KEY ? api.getSystemTrafficSeries : () => api.getTrafficSeries(id);
    fetcher().then((samples) => {
      seedSeries(
        id,
        samples.map((s) => ({ ts: s.ts, sent: s.bytes_sent_delta, recv: s.bytes_recv_delta }))
      );
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  return series ?? [];
}
