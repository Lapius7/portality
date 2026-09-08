import type { ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";

import type { Connection } from "@/lib/types";
import { useUiStore } from "@/store/uiStore";
import { formatBytes, formatEndpoint } from "@/lib/format";
import { StatusBadge } from "@/components/grid/StatusBadge";
import { Icon } from "@/components/common/Icon";
import { CopyableText } from "@/components/common/CopyableText";
import { TrafficChart } from "./TrafficChart";
import { useTrafficSeries } from "@/queries/useTraffic";

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between py-2 text-sm">
      <span className="text-base-400">{label}</span>
      <span className="font-mono text-base-200">{children}</span>
    </div>
  );
}

export function DetailPanel({ connections }: { connections: Connection[] }) {
  const selectedId = useUiStore((s) => s.selectedId);
  const select = useUiStore((s) => s.select);
  const requestKill = useUiStore((s) => s.requestKill);

  const conn = connections.find((c) => c.id === selectedId) ?? null;
  const traffic = useTrafficSeries(conn?.protocol === "tcp" ? conn.id : null);
  const latest = traffic[traffic.length - 1];

  return (
    <AnimatePresence>
      {conn && (
        <motion.div
          initial={{ x: 360, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 360, opacity: 0 }}
          transition={{ type: "spring", stiffness: 320, damping: 32 }}
          className="absolute right-0 top-0 h-full w-[360px] overflow-y-auto border-l border-base-800 bg-base-900/95 shadow-panel backdrop-blur"
        >
          <div className="flex items-center justify-between border-b border-base-800 px-5 py-4">
            <h3 className="text-sm font-semibold text-base-100">接続の詳細</h3>
            <button
              onClick={() => select(null)}
              className="flex h-6 w-6 items-center justify-center rounded text-base-400 hover:bg-base-800 hover:text-base-200"
            >
              <Icon name="close" size={13} />
            </button>
          </div>

          <div className="px-5 py-4">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10 text-accent">
                <Icon name="process" size={18} />
              </span>
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold text-base-100">{conn.process_name ?? "不明なプロセス"}</div>
                <div className="font-mono text-xs text-base-500">PID {conn.pid}</div>
              </div>
              <div className="ml-auto">
                <StatusBadge state={conn.state} protocol={conn.protocol} />
              </div>
            </div>

            <div className="mt-4 divide-y divide-base-800 rounded-lg border border-base-800 bg-base-850/40 px-3">
              <Row label="ローカル">
                <CopyableText value={formatEndpoint(conn.local_addr, conn.local_port)} />
              </Row>
              <Row label="リモート">
                {conn.remote_addr ? (
                  <CopyableText value={formatEndpoint(conn.remote_addr, conn.remote_port ?? 0)} />
                ) : (
                  <span className="text-base-500">—</span>
                )}
              </Row>
              {conn.process_path && (
                <div className="py-2 text-sm">
                  <div className="mb-1 text-base-400">実行ファイル</div>
                  <CopyableText value={conn.process_path} className="w-full text-[11px] text-base-300" />
                </div>
              )}
            </div>

            <div className="mt-5">
              <div className="mb-2 flex items-center justify-between">
                <h4 className="text-xs font-medium uppercase tracking-wide text-base-400">通信量 (毎秒)</h4>
                {latest && (
                  <span className="font-mono text-[11px] text-base-400">
                    ↑{formatBytes(latest.sent)} ↓{formatBytes(latest.recv)}
                  </span>
                )}
              </div>
              {conn.protocol === "tcp" ? (
                <TrafficChart data={traffic} />
              ) : (
                <div className="flex h-40 items-center justify-center rounded-md border border-dashed border-base-700 text-xs text-base-500">
                  UDPの通信量計測には対応していません
                </div>
              )}
            </div>

            <button
              onClick={() => requestKill(conn.id)}
              className="mt-5 flex w-full items-center justify-center gap-1.5 rounded-md border border-state-closing/30 bg-state-closing/10 py-2 text-sm font-medium text-state-closing transition-colors hover:bg-state-closing/20"
            >
              プロセスを終了
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
