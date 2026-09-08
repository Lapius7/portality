import { useMemo } from "react";

import type { Connection } from "@/lib/types";

const LABELS: Record<string, string> = {
  ESTABLISHED: "確立中",
  LISTEN: "待受中",
  TIME_WAIT: "終了待ち",
  CLOSE_WAIT: "クローズ待ち",
};

const COLORS: Record<string, string> = {
  ESTABLISHED: "bg-state-established",
  LISTEN: "bg-state-listen",
  TIME_WAIT: "bg-state-timewait",
  CLOSE_WAIT: "bg-state-closing",
};

export function StateBreakdown({ connections }: { connections: Connection[] }) {
  const breakdown = useMemo(() => {
    const counts = new Map<string, number>();
    for (const c of connections) {
      const key = c.state ?? (c.protocol === "udp" ? "UDP" : "OTHER");
      if (!["ESTABLISHED", "LISTEN", "TIME_WAIT", "CLOSE_WAIT"].includes(key)) continue;
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    return Array.from(counts.entries()).sort((a, b) => b[1] - a[1]);
  }, [connections]);

  const total = connections.length || 1;

  return (
    <div className="rounded-lg border border-base-800 bg-base-900/60 p-4 transition-colors hover:border-base-700">
      <h3 className="text-xs font-medium uppercase tracking-wide text-base-400">状態の内訳</h3>

      <div className="mt-3 flex h-2.5 overflow-hidden rounded-full bg-base-800">
        {breakdown.map(([state, count]) => (
          <div key={state} className={COLORS[state]} style={{ width: `${(count / total) * 100}%` }} />
        ))}
      </div>

      <div className="mt-3 space-y-1.5">
        {breakdown.map(([state, count]) => (
          <div key={state} className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5 text-base-300">
              <span className={`h-2 w-2 rounded-full ${COLORS[state]}`} />
              {LABELS[state] ?? state}
            </span>
            <span className="font-mono text-base-500">{count}</span>
          </div>
        ))}
        {breakdown.length === 0 && <div className="py-2 text-center text-xs text-base-500">データがありません</div>}
      </div>
    </div>
  );
}
