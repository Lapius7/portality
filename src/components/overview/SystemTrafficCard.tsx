import { useTrafficSeries } from "@/queries/useTraffic";
import { SYSTEM_TRAFFIC_KEY } from "@/lib/types";
import { formatBytes } from "@/lib/format";
import { TrafficChart } from "@/components/detail/TrafficChart";

export function SystemTrafficCard() {
  const series = useTrafficSeries(SYSTEM_TRAFFIC_KEY);
  const latest = series[series.length - 1];

  return (
    <div className="rounded-lg border border-base-800 bg-base-900/60 p-4 transition-colors hover:border-base-700">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-medium uppercase tracking-wide text-base-400">システム全体の通信量</h3>
        {latest && (
          <span className="font-mono text-[11px] text-base-400">
            ↑{formatBytes(latest.sent)}/s ↓{formatBytes(latest.recv)}/s
          </span>
        )}
      </div>
      <div className="mt-3">
        <TrafficChart data={series} />
      </div>
    </div>
  );
}
