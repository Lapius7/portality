import { useMemo } from "react";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis } from "recharts";

import type { HistoryRow } from "@/lib/types";

const BUCKET_COUNT = 48;

export function HistoryTimeline({ rows }: { rows: HistoryRow[] }) {
  const buckets = useMemo(() => {
    if (rows.length === 0) return [];
    const minTs = Math.min(...rows.map((r) => r.ts));
    const maxTs = Math.max(...rows.map((r) => r.ts));
    const span = Math.max(maxTs - minTs, 1);
    const bucketSize = span / BUCKET_COUNT;

    const counts = new Array(BUCKET_COUNT).fill(0);
    for (const r of rows) {
      const idx = Math.min(BUCKET_COUNT - 1, Math.floor((r.ts - minTs) / bucketSize));
      counts[idx] += 1;
    }
    return counts.map((count, i) => ({ bucket: i, count, ts: minTs + i * bucketSize }));
  }, [rows]);

  if (buckets.length === 0) {
    return null;
  }

  return (
    <ResponsiveContainer width="100%" height={80}>
      <BarChart data={buckets} margin={{ top: 4, right: 8, bottom: 0, left: 8 }}>
        <XAxis dataKey="bucket" tick={false} axisLine={false} />
        <Tooltip
          contentStyle={{ background: "#171923", border: "1px solid #272b38", borderRadius: 6, fontSize: 12 }}
          labelFormatter={(_, payload) => (payload?.[0] ? new Date(payload[0].payload.ts).toLocaleString() : "")}
          formatter={(value: number) => [`${value} 件`, "ポートイベント"]}
        />
        <Bar dataKey="count" fill="#5b8cff" radius={[2, 2, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
