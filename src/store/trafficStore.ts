import { create } from "zustand";

import type { TrafficTick } from "@/lib/types";

const WINDOW_SIZE = 120;

export interface TrafficPoint {
  ts: number;
  sent: number;
  recv: number;
}

interface TrafficState {
  seriesById: Map<string, TrafficPoint[]>;
  seedSeries: (id: string, points: TrafficPoint[]) => void;
  applyTick: (tick: TrafficTick) => void;
}

function appendBounded(existing: TrafficPoint[], point: TrafficPoint): TrafficPoint[] {
  const next = [...existing, point];
  return next.length > WINDOW_SIZE ? next.slice(next.length - WINDOW_SIZE) : next;
}

export const useTrafficStore = create<TrafficState>((set) => ({
  seriesById: new Map(),
  seedSeries: (id, points) =>
    set((state) => {
      // Don't clobber a series that has already received live ticks newer
      // than the backfill (e.g. backfill request resolved late).
      if (state.seriesById.has(id)) return state;
      const next = new Map(state.seriesById);
      next.set(id, points);
      return { seriesById: next };
    }),
  applyTick: (tick) =>
    set((state) => {
      const next = new Map(state.seriesById);
      const ts = Date.now();
      for (const [id, [sent, recv]] of Object.entries(tick)) {
        const existing = next.get(id) ?? [];
        next.set(id, appendBounded(existing, { ts, sent, recv }));
      }
      return { seriesById: next };
    }),
}));
