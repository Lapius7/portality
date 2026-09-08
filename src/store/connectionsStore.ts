import { create } from "zustand";

import type { Connection, ConnectionsDiff } from "@/lib/types";

interface ConnectionsState {
  byId: Map<string, Connection>;
  setAll: (connections: Connection[]) => void;
  applyDiff: (diff: ConnectionsDiff) => void;
}

export const useConnectionsStore = create<ConnectionsState>((set) => ({
  byId: new Map(),
  setAll: (connections) =>
    set({ byId: new Map(connections.map((c) => [c.id, c])) }),
  applyDiff: (diff) =>
    set((state) => {
      const next = new Map(state.byId);
      for (const conn of diff.added) next.set(conn.id, conn);
      for (const conn of diff.changed) next.set(conn.id, conn);
      for (const id of diff.removed) next.delete(id);
      return { byId: next };
    }),
}));
