import { useEffect } from "react";
import type { UnlistenFn } from "@tauri-apps/api/event";

export function useTauriEvent(subscribe: () => Promise<UnlistenFn>, deps: unknown[] = []) {
  useEffect(() => {
    let unlisten: UnlistenFn | undefined;
    let cancelled = false;

    subscribe().then((fn) => {
      if (cancelled) fn();
      else unlisten = fn;
    });

    return () => {
      cancelled = true;
      unlisten?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
