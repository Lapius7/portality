// Mirrors src-tauri/src/net/model.rs. Keep in sync manually until a codegen
// step (e.g. ts-rs) is introduced.

export type Protocol = "tcp" | "udp";

export type TcpState =
  | "CLOSED"
  | "LISTEN"
  | "SYN_SENT"
  | "SYN_RECEIVED"
  | "ESTABLISHED"
  | "FIN_WAIT1"
  | "FIN_WAIT2"
  | "CLOSE_WAIT"
  | "CLOSING"
  | "LAST_ACK"
  | "TIME_WAIT"
  | "DELETE_TCB"
  | "UNKNOWN";

export interface Connection {
  id: string;
  protocol: Protocol;
  local_addr: string;
  local_port: number;
  remote_addr: string | null;
  remote_port: number | null;
  state: TcpState | null;
  pid: number;
  process_name: string | null;
  process_path: string | null;
}

export interface ConnectionsDiff {
  added: Connection[];
  removed: string[];
  changed: Connection[];
}

export type KillError =
  | { kind: "AccessDenied"; message: string }
  | { kind: "NotFound"; message: string }
  | { kind: "Other"; message: string };

export interface TrafficSample {
  ts: number;
  bytes_sent_delta: number;
  bytes_recv_delta: number;
}

/** Payload of the traffic://tick event: connection id -> [sentDelta, recvDelta]. */
export type TrafficTick = Record<string, [number, number]>;

export const SYSTEM_TRAFFIC_KEY = "__system__";

export interface HistoryRow {
  id: number;
  ts: number;
  protocol: string;
  local_addr: string;
  local_port: number;
  remote_addr: string | null;
  remote_port: number | null;
  state: string | null;
  pid: number;
  process_name: string | null;
  bytes_sent_delta: number;
  bytes_recv_delta: number;
}

export interface HistoryFilter {
  fromTs?: number;
  toTs?: number;
  protocol?: string;
  port?: number;
  process?: string;
  limit?: number;
  offset?: number;
}
