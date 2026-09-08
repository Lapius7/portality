import type { TcpState } from "@/lib/types";

const STYLES: Record<string, string> = {
  ESTABLISHED: "bg-state-established/15 text-state-established border-state-established/30",
  LISTEN: "bg-state-listen/15 text-state-listen border-state-listen/30",
  TIME_WAIT: "bg-state-timewait/15 text-state-timewait border-state-timewait/30",
  CLOSE_WAIT: "bg-state-closing/15 text-state-closing border-state-closing/30",
  CLOSING: "bg-state-closing/15 text-state-closing border-state-closing/30",
  LAST_ACK: "bg-state-closing/15 text-state-closing border-state-closing/30",
  FIN_WAIT1: "bg-state-idle/15 text-state-idle border-state-idle/30",
  FIN_WAIT2: "bg-state-idle/15 text-state-idle border-state-idle/30",
  SYN_SENT: "bg-state-idle/15 text-state-idle border-state-idle/30",
  SYN_RECEIVED: "bg-state-idle/15 text-state-idle border-state-idle/30",
};

export function StatusBadge({ state, protocol }: { state: TcpState | null; protocol: "tcp" | "udp" }) {
  if (protocol === "udp") {
    return (
      <span className="inline-flex items-center rounded-full border border-accent/30 bg-accent/15 px-2 py-0.5 text-[11px] font-medium text-accent">
        UDP
      </span>
    );
  }
  const style = (state && STYLES[state]) || "bg-base-700 text-base-300 border-base-600";
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${style}`}>
      {state ?? "UNKNOWN"}
    </span>
  );
}
