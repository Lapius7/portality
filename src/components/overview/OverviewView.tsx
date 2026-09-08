import { useMemo } from "react";

import type { Connection } from "@/lib/types";
import { StatCard } from "./StatCard";
import { StateBreakdown } from "./StateBreakdown";
import { TopProcesses } from "./TopProcesses";
import { SystemTrafficCard } from "./SystemTrafficCard";

export function OverviewView({ connections }: { connections: Connection[] }) {
  const stats = useMemo(() => {
    const tcp = connections.filter((c) => c.protocol === "tcp").length;
    const udp = connections.filter((c) => c.protocol === "udp").length;
    const listening = connections.filter((c) => c.state === "LISTEN").length;
    const processCount = new Set(connections.map((c) => c.process_name ?? c.pid)).size;
    return { tcp, udp, listening, processCount };
  }, [connections]);

  return (
    <div className="h-full overflow-y-auto px-6 py-6">
      <h2 className="text-lg font-semibold text-base-100">概要</h2>
      <p className="mt-1 text-sm text-base-500">現在のポート使用状況をひと目で確認できます</p>

      <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard icon="connections" label="総接続数" value={String(connections.length)} accent="accent" />
        <StatCard icon="port" label="TCP / UDP" value={`${stats.tcp} / ${stats.udp}`} accent="listen" />
        <StatCard icon="activity" label="待受中ポート" value={String(stats.listening)} accent="established" sub="LISTEN状態" />
        <StatCard icon="process" label="アクティブなプロセス" value={String(stats.processCount)} accent="timewait" />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <SystemTrafficCard />
        </div>
        <StateBreakdown connections={connections} />
      </div>

      <div className="mt-4">
        <TopProcesses connections={connections} />
      </div>
    </div>
  );
}
