import { motion } from "framer-motion";

import type { Connection } from "@/lib/types";
import { formatEndpoint } from "@/lib/format";
import { useTrafficSeries } from "@/queries/useTraffic";
import { Sparkline } from "@/components/detail/Sparkline";
import { StatusBadge } from "./StatusBadge";

export const ROW_GRID_COLS = "grid-cols-[60px_1fr_1fr_140px_70px_1fr_90px_56px]";

export function ConnectionRow({
  conn,
  isSelected,
  top,
  height,
  onSelect,
  onKill,
}: {
  conn: Connection;
  isSelected: boolean;
  top: number;
  height: number;
  onSelect: () => void;
  onKill: () => void;
}) {
  const traffic = useTrafficSeries(conn.protocol === "tcp" ? conn.id : null);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.15 }}
      onClick={onSelect}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height,
        transform: `translateY(${top}px)`,
      }}
      className={`group grid cursor-pointer ${ROW_GRID_COLS} items-center gap-2 rounded-md px-2 text-sm ${
        isSelected ? "bg-accent/10 ring-1 ring-accent/40" : "hover:bg-base-850"
      }`}
    >
      <div className="font-mono text-xs uppercase text-base-400">{conn.protocol}</div>
      <div className="truncate font-mono text-xs text-base-200">{formatEndpoint(conn.local_addr, conn.local_port)}</div>
      <div className="truncate font-mono text-xs text-base-400">
        {conn.remote_addr ? formatEndpoint(conn.remote_addr, conn.remote_port ?? 0) : "—"}
      </div>
      <div>
        <StatusBadge state={conn.state} protocol={conn.protocol} />
      </div>
      <div className="font-mono text-xs text-base-400">{conn.pid}</div>
      <div className="truncate text-xs text-base-200">{conn.process_name ?? "不明"}</div>
      <div className="h-6">
        {conn.protocol === "tcp" ? (
          <Sparkline data={traffic} />
        ) : (
          <span className="text-[10px] text-base-600">—</span>
        )}
      </div>
      <div className="text-right">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onKill();
          }}
          className="rounded border border-state-closing/30 bg-state-closing/10 px-2 py-0.5 text-[11px] font-medium text-state-closing opacity-0 transition-opacity hover:bg-state-closing/20 group-hover:opacity-100"
        >
          Kill
        </button>
      </div>
    </motion.div>
  );
}
