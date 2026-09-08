import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef } from "react";

import { api, onConnectionsUpdate } from "@/lib/tauri";
import { useConnectionsStore } from "@/store/connectionsStore";
import { useToastStore } from "@/store/toastStore";
import { useTauriEvent } from "@/hooks/useTauriEvent";

/** Loads the initial snapshot via TanStack Query, then keeps the Zustand
 * store fresh from push events so the table never re-polls. Also surfaces a
 * toast when a new LISTEN port appears, which is the moment a developer
 * actually cares about (a dev server/daemon just started). */
export function useConnections() {
  const setAll = useConnectionsStore((s) => s.setAll);
  const applyDiff = useConnectionsStore((s) => s.applyDiff);
  const byId = useConnectionsStore((s) => s.byId);
  const pushToast = useToastStore((s) => s.push);
  const hasInitialized = useRef(false);

  const query = useQuery({
    queryKey: ["connections", "initial"],
    queryFn: api.listConnections,
  });

  useEffect(() => {
    if (query.data) {
      setAll(query.data);
      hasInitialized.current = true;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query.data]);

  useTauriEvent(
    () =>
      onConnectionsUpdate((diff) => {
        applyDiff(diff);
        if (!hasInitialized.current) return;
        for (const conn of diff.added) {
          if (conn.state === "LISTEN") {
            pushToast(`新しいポートが開きました: ${conn.process_name ?? "不明"} :${conn.local_port}`, "info");
          }
        }
      }),
    []
  );

  return {
    connections: Array.from(byId.values()),
    isLoading: query.isLoading,
    error: query.error,
  };
}
