import { invoke } from "@tauri-apps/api/core";
import { listen, type UnlistenFn } from "@tauri-apps/api/event";

import type {
  Connection,
  ConnectionsDiff,
  HistoryFilter,
  HistoryRow,
  KillError,
  TrafficSample,
  TrafficTick,
} from "./types";

export const api = {
  listConnections: () => invoke<Connection[]>("list_connections"),
  setPollInterval: (ms: number) => invoke<void>("set_poll_interval", { ms }),
  killProcess: (pid: number) => invoke<void>("kill_process", { pid }) as Promise<void>,
  isElevated: () => invoke<boolean>("is_elevated"),
  relaunchAsAdmin: () => invoke<void>("relaunch_as_admin"),
  getTrafficSeries: (id: string) => invoke<TrafficSample[]>("get_traffic_series", { id }),
  getSystemTrafficSeries: () => invoke<TrafficSample[]>("get_system_traffic_series"),
  queryHistory: (filter: HistoryFilter) => invoke<HistoryRow[]>("query_history", { filter }),
  exportHistoryCsv: (filter: HistoryFilter) => invoke<string>("export_history_csv", { filter }),
  getHistoryRetentionDays: () => invoke<number>("get_history_retention_days"),
  setHistoryRetentionDays: (days: number) => invoke<void>("set_history_retention_days", { days }),
  clearHistory: () => invoke<number>("clear_history"),
};

export function onConnectionsUpdate(handler: (diff: ConnectionsDiff) => void): Promise<UnlistenFn> {
  return listen<ConnectionsDiff>("connections://update", (event) => handler(event.payload));
}

export function onTrafficTick(handler: (tick: TrafficTick) => void): Promise<UnlistenFn> {
  return listen<TrafficTick>("traffic://tick", (event) => handler(event.payload));
}

export type { KillError };
