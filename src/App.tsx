import { AppShell } from "@/components/layout/AppShell";
import { FilterBar } from "@/components/grid/FilterBar";
import { ConnectionsTable } from "@/components/grid/ConnectionsTable";
import { DetailPanel } from "@/components/detail/DetailPanel";
import { KillConfirmDialog } from "@/components/kill/KillConfirmDialog";
import { HistoryView } from "@/components/history/HistoryView";
import { SettingsPanel } from "@/components/settings/SettingsPanel";
import { OverviewView } from "@/components/overview/OverviewView";
import { CommandPalette } from "@/components/common/CommandPalette";
import { ToastStack } from "@/components/common/ToastStack";
import { EmptyState } from "@/components/common/EmptyState";
import { TableSkeleton } from "@/components/common/Skeleton";
import { useConnections } from "@/queries/useConnections";
import { useTrafficSubscription } from "@/queries/useTraffic";
import { useUiStore } from "@/store/uiStore";

export default function App() {
  useTrafficSubscription();

  const { connections, isLoading, error } = useConnections();
  const activeTab = useUiStore((s) => s.activeTab);
  const search = useUiStore((s) => s.search);
  const protocolFilter = useUiStore((s) => s.protocolFilter);
  const stateFilter = useUiStore((s) => s.stateFilter);

  const shown = connections.filter((c) => {
    if (protocolFilter !== "all" && c.protocol !== protocolFilter) return false;
    if (stateFilter !== "all" && c.state !== stateFilter) return false;
    if (search) {
      const needle = search.toLowerCase();
      const hit =
        String(c.local_port).includes(needle) ||
        (c.process_name?.toLowerCase().includes(needle) ?? false) ||
        String(c.pid).includes(needle);
      if (!hit) return false;
    }
    return true;
  }).length;

  return (
    <AppShell>
      {activeTab === "overview" && <OverviewView connections={connections} />}

      {activeTab === "connections" && (
        <div className="flex h-full flex-col">
          <FilterBar total={connections.length} shown={shown} />

          <div className="flex-1 overflow-hidden">
            {isLoading ? (
              <TableSkeleton />
            ) : error ? (
              <EmptyState icon="close" title="接続情報の取得に失敗しました" description="アプリを再起動してもう一度お試しください" />
            ) : (
              <ConnectionsTable connections={connections} />
            )}
          </div>
        </div>
      )}

      {activeTab === "history" && <HistoryView />}
      {activeTab === "settings" && <SettingsPanel />}

      <DetailPanel connections={connections} />
      <KillConfirmDialog connections={connections} />
      <CommandPalette connections={connections} />
      <ToastStack />
    </AppShell>
  );
}
