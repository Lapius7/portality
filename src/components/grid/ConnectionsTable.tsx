import { useMemo, useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";

import type { Connection } from "@/lib/types";
import { useUiStore } from "@/store/uiStore";
import { EmptyState } from "@/components/common/EmptyState";
import { ConnectionRow, ROW_GRID_COLS } from "./ConnectionRow";

const ROW_HEIGHT = 40;
const HEADER_HEIGHT = 30;

type ListItem = { kind: "header"; key: string; label: string; count: number } | { kind: "row"; key: string; conn: Connection };

function matches(conn: Connection, search: string): boolean {
  if (!search) return true;
  const needle = search.toLowerCase();
  return (
    String(conn.local_port).includes(needle) ||
    (conn.process_name?.toLowerCase().includes(needle) ?? false) ||
    String(conn.pid).includes(needle) ||
    conn.local_addr.toLowerCase().includes(needle) ||
    (conn.remote_addr?.toLowerCase().includes(needle) ?? false)
  );
}

export function ConnectionsTable({ connections }: { connections: Connection[] }) {
  const search = useUiStore((s) => s.search);
  const protocolFilter = useUiStore((s) => s.protocolFilter);
  const stateFilter = useUiStore((s) => s.stateFilter);
  const groupMode = useUiStore((s) => s.groupMode);
  const selectedId = useUiStore((s) => s.selectedId);
  const select = useUiStore((s) => s.select);
  const requestKill = useUiStore((s) => s.requestKill);

  const filtered = useMemo(() => {
    return connections
      .filter((c) => (protocolFilter === "all" ? true : c.protocol === protocolFilter))
      .filter((c) => (stateFilter === "all" ? true : c.state === stateFilter))
      .filter((c) => matches(c, search))
      .sort((a, b) => a.local_port - b.local_port);
  }, [connections, search, protocolFilter, stateFilter]);

  const items = useMemo<ListItem[]>(() => {
    if (groupMode !== "process") {
      return filtered.map((conn) => ({ kind: "row", key: conn.id, conn }));
    }

    const groups = new Map<string, Connection[]>();
    for (const conn of filtered) {
      const key = conn.process_name ?? "不明なプロセス";
      const list = groups.get(key) ?? [];
      list.push(conn);
      groups.set(key, list);
    }

    const sortedGroups = Array.from(groups.entries()).sort((a, b) => b[1].length - a[1].length);

    const flat: ListItem[] = [];
    for (const [name, conns] of sortedGroups) {
      flat.push({ kind: "header", key: `group-${name}`, label: name, count: conns.length });
      for (const conn of conns) flat.push({ kind: "row", key: conn.id, conn });
    }
    return flat;
  }, [filtered, groupMode]);

  const parentRef = useRef<HTMLDivElement>(null);
  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: (index) => (items[index].kind === "header" ? HEADER_HEIGHT : ROW_HEIGHT),
    overscan: 12,
  });

  return (
    <div className="flex h-full flex-col">
      <div className={`grid ${ROW_GRID_COLS} gap-2 border-b border-base-800 bg-base-900 px-4 py-2 text-[11px] font-medium uppercase tracking-wide text-base-400`}>
        <div>Proto</div>
        <div>Local</div>
        <div>Remote</div>
        <div>State</div>
        <div>PID</div>
        <div>Process</div>
        <div>Traffic</div>
        <div></div>
      </div>

      <div ref={parentRef} className="flex-1 overflow-y-auto px-2">
        {items.length === 0 && (
          <EmptyState icon="search" title="条件に一致する接続がありません" description="検索語やフィルタを調整してみてください" />
        )}
        <div style={{ height: virtualizer.getTotalSize(), position: "relative" }}>
          {virtualizer.getVirtualItems().map((virtualRow) => {
            const item = items[virtualRow.index];
            if (item.kind === "header") {
              return (
                <div
                  key={item.key}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: HEADER_HEIGHT,
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                  className="flex items-center gap-2 px-2 text-xs font-medium text-base-400"
                >
                  <span>{item.label}</span>
                  <span className="rounded-full bg-base-800 px-1.5 py-0.5 text-[10px] text-base-500">{item.count}</span>
                </div>
              );
            }
            return (
              <ConnectionRow
                key={item.key}
                conn={item.conn}
                isSelected={item.conn.id === selectedId}
                top={virtualRow.start}
                height={ROW_HEIGHT}
                onSelect={() => select(item.conn.id)}
                onKill={() => requestKill(item.conn.id)}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
