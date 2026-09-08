import { useUiStore } from "@/store/uiStore";
import { Icon } from "@/components/common/Icon";

export function FilterBar({ total, shown }: { total: number; shown: number }) {
  const search = useUiStore((s) => s.search);
  const setSearch = useUiStore((s) => s.setSearch);
  const protocolFilter = useUiStore((s) => s.protocolFilter);
  const setProtocolFilter = useUiStore((s) => s.setProtocolFilter);
  const stateFilter = useUiStore((s) => s.stateFilter);
  const setStateFilter = useUiStore((s) => s.setStateFilter);
  const groupMode = useUiStore((s) => s.groupMode);
  const setGroupMode = useUiStore((s) => s.setGroupMode);

  return (
    <div className="flex items-center gap-3 border-b border-base-800 bg-base-900/60 px-4 py-3">
      <div className="relative flex-1 max-w-md">
        <Icon name="search" size={13} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-base-500" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="ポート・プロセス名・PIDで検索..."
          className="w-full rounded-md border border-base-700 bg-base-850 py-1.5 pl-8 pr-3 text-sm text-base-200 placeholder:text-base-500 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
        />
      </div>

      <select
        value={protocolFilter}
        onChange={(e) => setProtocolFilter(e.target.value as never)}
        className="rounded-md border border-base-700 bg-base-850 px-2 py-1.5 text-sm text-base-300 focus:border-accent focus:outline-none"
      >
        <option value="all">全プロトコル</option>
        <option value="tcp">TCP</option>
        <option value="udp">UDP</option>
      </select>

      <select
        value={stateFilter}
        onChange={(e) => setStateFilter(e.target.value as never)}
        className="rounded-md border border-base-700 bg-base-850 px-2 py-1.5 text-sm text-base-300 focus:border-accent focus:outline-none"
      >
        <option value="all">全状態</option>
        <option value="LISTEN">LISTEN</option>
        <option value="ESTABLISHED">ESTABLISHED</option>
        <option value="TIME_WAIT">TIME_WAIT</option>
        <option value="CLOSE_WAIT">CLOSE_WAIT</option>
      </select>

      <button
        onClick={() => setGroupMode(groupMode === "process" ? "none" : "process")}
        title="プロセスごとにグループ化"
        className={`flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-medium transition-colors ${
          groupMode === "process"
            ? "border-accent/40 bg-accent/15 text-accent"
            : "border-base-700 text-base-400 hover:bg-base-850"
        }`}
      >
        <Icon name="layers" size={13} />
        グループ化
      </button>

      <div className="ml-auto text-xs text-base-400 tabular-nums">
        {shown} / {total} 件
      </div>
    </div>
  );
}
