import { useMemo, useState } from "react";

import { useHistory } from "@/queries/useHistory";
import { api } from "@/lib/tauri";
import { formatBytes, formatEndpoint } from "@/lib/format";
import { useToastStore } from "@/store/toastStore";
import { DateRangePicker } from "./DateRangePicker";
import { HistoryTimeline } from "./HistoryTimeline";

function downloadCsv(content: string, filename: string) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function HistoryView() {
  const [presetMs, setPresetMs] = useState(24 * 60 * 60 * 1000);
  const [search, setSearch] = useState("");
  const [exporting, setExporting] = useState(false);

  const filter = useMemo(() => {
    const now = Date.now();
    return {
      fromTs: presetMs > 0 ? now - presetMs : undefined,
      process: search || undefined,
      limit: 500,
    };
  }, [presetMs, search]);

  const { data: rows = [], isLoading } = useHistory(filter);
  const pushToast = useToastStore((s) => s.push);

  const handleExport = async () => {
    setExporting(true);
    try {
      const csv = await api.exportHistoryCsv(filter);
      downloadCsv(csv, `portality-history-${Date.now()}.csv`);
      pushToast(`${rows.length}件をCSVエクスポートしました`, "success");
    } catch {
      pushToast("エクスポートに失敗しました", "error");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 border-b border-base-800 bg-base-900/60 px-4 py-3">
        <DateRangePicker activePresetMs={presetMs} onSelect={setPresetMs} />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="プロセス名で絞り込み..."
          className="max-w-xs flex-1 rounded-md border border-base-700 bg-base-850 px-3 py-1.5 text-sm text-base-200 placeholder:text-base-500 focus:border-accent focus:outline-none"
        />
        <button
          onClick={handleExport}
          disabled={exporting || rows.length === 0}
          className="ml-auto rounded-md border border-base-700 px-3 py-1.5 text-xs font-medium text-base-300 hover:bg-base-850 disabled:opacity-40"
        >
          {exporting ? "エクスポート中..." : "CSVエクスポート"}
        </button>
      </div>

      <div className="border-b border-base-800 px-4 py-2">
        <HistoryTimeline rows={rows} />
      </div>

      <div className="flex-1 overflow-y-auto px-2 py-2">
        {isLoading ? (
          <div className="flex h-full items-center justify-center text-sm text-base-500">読み込み中...</div>
        ) : rows.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-base-500">
            該当する履歴がありません
          </div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-[11px] uppercase tracking-wide text-base-400">
                <th className="px-2 py-1.5 font-medium">日時</th>
                <th className="px-2 py-1.5 font-medium">Proto</th>
                <th className="px-2 py-1.5 font-medium">Local</th>
                <th className="px-2 py-1.5 font-medium">Remote</th>
                <th className="px-2 py-1.5 font-medium">Process</th>
                <th className="px-2 py-1.5 font-medium text-right">送信</th>
                <th className="px-2 py-1.5 font-medium text-right">受信</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="hover:bg-base-850">
                  <td className="whitespace-nowrap px-2 py-1.5 font-mono text-xs text-base-400">
                    {new Date(r.ts).toLocaleString()}
                  </td>
                  <td className="px-2 py-1.5 font-mono text-xs uppercase text-base-400">{r.protocol}</td>
                  <td className="px-2 py-1.5 font-mono text-xs text-base-200">
                    {formatEndpoint(r.local_addr, r.local_port)}
                  </td>
                  <td className="px-2 py-1.5 font-mono text-xs text-base-400">
                    {r.remote_addr ? formatEndpoint(r.remote_addr, r.remote_port ?? 0) : "—"}
                  </td>
                  <td className="px-2 py-1.5 text-xs text-base-200">{r.process_name ?? "不明"}</td>
                  <td className="px-2 py-1.5 text-right font-mono text-xs text-accent">{formatBytes(r.bytes_sent_delta)}</td>
                  <td className="px-2 py-1.5 text-right font-mono text-xs text-state-established">{formatBytes(r.bytes_recv_delta)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
