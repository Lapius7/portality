import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

import type { Connection } from "@/lib/types";
import { useUiStore } from "@/store/uiStore";
import { formatEndpoint } from "@/lib/format";

interface PaletteItem {
  id: string;
  group: "移動" | "接続" | "操作";
  label: string;
  sublabel?: string;
  run: () => void;
}

export function CommandPalette({ connections }: { connections: Connection[] }) {
  const open = useUiStore((s) => s.paletteOpen);
  const setOpen = useUiStore((s) => s.setPaletteOpen);
  const setActiveTab = useUiStore((s) => s.setActiveTab);
  const select = useUiStore((s) => s.select);
  const requestKill = useUiStore((s) => s.requestKill);
  const setSearch = useUiStore((s) => s.setSearch);

  const [query, setQuery] = useState("");
  const [highlight, setHighlight] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen(!open);
      } else if (e.key === "Escape" && open) {
        setOpen(false);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, setOpen]);

  useEffect(() => {
    if (open) {
      setQuery("");
      setHighlight(0);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  const items = useMemo<PaletteItem[]>(() => {
    const nav: PaletteItem[] = [
      { id: "nav-overview", group: "移動", label: "概要を表示", run: () => setActiveTab("overview") },
      { id: "nav-connections", group: "移動", label: "接続一覧を表示", run: () => setActiveTab("connections") },
      { id: "nav-history", group: "移動", label: "履歴を表示", run: () => setActiveTab("history") },
      { id: "nav-settings", group: "移動", label: "設定を開く", run: () => setActiveTab("settings") },
    ];

    const needle = query.toLowerCase().trim();
    const matched = needle
      ? connections.filter(
          (c) =>
            String(c.local_port).includes(needle) ||
            String(c.pid).includes(needle) ||
            (c.process_name?.toLowerCase().includes(needle) ?? false)
        )
      : [];

    const connectionItems: PaletteItem[] = matched.slice(0, 6).map((c) => ({
      id: `conn-${c.id}`,
      group: "接続",
      label: `${c.process_name ?? "不明なプロセス"} — ${formatEndpoint(c.local_addr, c.local_port)}`,
      sublabel: `PID ${c.pid} / ${c.protocol.toUpperCase()}`,
      run: () => {
        setActiveTab("connections");
        setSearch(String(c.local_port));
        select(c.id);
      },
    }));

    const killItems: PaletteItem[] = matched.slice(0, 4).map((c) => ({
      id: `kill-${c.id}`,
      group: "操作",
      label: `${c.process_name ?? "PID " + c.pid} を終了`,
      sublabel: formatEndpoint(c.local_addr, c.local_port),
      run: () => {
        setActiveTab("connections");
        requestKill(c.id);
      },
    }));

    const filteredNav = needle ? nav.filter((n) => n.label.toLowerCase().includes(needle)) : nav;

    return [...filteredNav, ...connectionItems, ...killItems];
  }, [query, connections, setActiveTab, setSearch, select, requestKill]);

  useEffect(() => {
    setHighlight(0);
  }, [items.length]);

  const runHighlighted = () => {
    const item = items[highlight];
    if (item) {
      item.run();
      setOpen(false);
    }
  };

  const groups = useMemo(() => {
    const map = new Map<string, PaletteItem[]>();
    items.forEach((item) => {
      const list = map.get(item.group) ?? [];
      list.push(item);
      map.set(item.group, list);
    });
    return map;
  }, [items]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[70] flex items-start justify-center bg-black/60 pt-[15vh]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setOpen(false)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: -8 }}
            transition={{ duration: 0.12 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg overflow-hidden rounded-lg border border-base-700 bg-base-900 shadow-panel"
          >
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "ArrowDown") {
                  e.preventDefault();
                  setHighlight((h) => Math.min(h + 1, items.length - 1));
                } else if (e.key === "ArrowUp") {
                  e.preventDefault();
                  setHighlight((h) => Math.max(h - 1, 0));
                } else if (e.key === "Enter") {
                  e.preventDefault();
                  runHighlighted();
                }
              }}
              placeholder="コマンド、ポート、プロセス名、PIDを入力..."
              className="w-full border-b border-base-800 bg-transparent px-4 py-3 text-sm text-base-100 placeholder:text-base-500 focus:outline-none"
            />

            <div className="max-h-80 overflow-y-auto py-2">
              {items.length === 0 && (
                <div className="px-4 py-6 text-center text-xs text-base-500">一致する項目がありません</div>
              )}
              {Array.from(groups.entries()).map(([group, groupItems]) => (
                <div key={group} className="mb-1">
                  <div className="px-4 py-1 text-[10px] font-medium uppercase tracking-wide text-base-500">{group}</div>
                  {groupItems.map((item) => {
                    const globalIndex = items.indexOf(item);
                    const isHighlighted = globalIndex === highlight;
                    return (
                      <button
                        key={item.id}
                        onMouseEnter={() => setHighlight(globalIndex)}
                        onClick={() => {
                          item.run();
                          setOpen(false);
                        }}
                        className={`flex w-full items-center justify-between px-4 py-2 text-left text-sm ${
                          isHighlighted ? "bg-accent/10 text-base-100" : "text-base-300"
                        }`}
                      >
                        <span>{item.label}</span>
                        {item.sublabel && <span className="font-mono text-[11px] text-base-500">{item.sublabel}</span>}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between border-t border-base-800 px-4 py-2 text-[10px] text-base-500">
              <span>↑↓ で選択 · Enter で実行</span>
              <span>Esc で閉じる</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
