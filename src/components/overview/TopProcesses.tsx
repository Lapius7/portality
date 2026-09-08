import { useMemo } from "react";

import type { Connection } from "@/lib/types";
import { useUiStore } from "@/store/uiStore";

export function TopProcesses({ connections }: { connections: Connection[] }) {
  const setActiveTab = useUiStore((s) => s.setActiveTab);
  const setSearch = useUiStore((s) => s.setSearch);

  const top = useMemo(() => {
    const counts = new Map<string, number>();
    for (const c of connections) {
      const name = c.process_name ?? "不明なプロセス";
      counts.set(name, (counts.get(name) ?? 0) + 1);
    }
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6);
  }, [connections]);

  const max = top[0]?.[1] ?? 1;

  const jumpTo = (name: string) => {
    setActiveTab("connections");
    setSearch(name);
  };

  return (
    <div className="rounded-lg border border-base-800 bg-base-900/60 p-4">
      <h3 className="text-xs font-medium uppercase tracking-wide text-base-400">プロセス別ポート数</h3>
      <div className="mt-3 space-y-2.5">
        {top.length === 0 && <div className="py-4 text-center text-xs text-base-500">データがありません</div>}
        {top.map(([name, count]) => (
          <button
            key={name}
            onClick={() => jumpTo(name)}
            className="group block w-full text-left"
          >
            <div className="mb-1 flex items-center justify-between text-xs">
              <span className="truncate text-base-200 group-hover:text-accent">{name}</span>
              <span className="ml-2 shrink-0 font-mono text-base-500">{count}</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-base-800">
              <div
                className="h-full rounded-full bg-accent/60 transition-all group-hover:bg-accent"
                style={{ width: `${(count / max) * 100}%` }}
              />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
