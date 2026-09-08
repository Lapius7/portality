import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import type { TrafficPoint } from "@/store/trafficStore";
import { formatBytes } from "@/lib/format";

export function TrafficChart({ data }: { data: TrafficPoint[] }) {
  if (data.length < 2) {
    return (
      <div className="flex h-40 items-center justify-center rounded-md border border-dashed border-base-700 text-xs text-base-500">
        トラフィックデータを収集中...
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={160}>
      <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id="chartSent" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#5b8cff" stopOpacity={0.4} />
            <stop offset="100%" stopColor="#5b8cff" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="chartRecv" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3ddc84" stopOpacity={0.4} />
            <stop offset="100%" stopColor="#3ddc84" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#272b38" vertical={false} />
        <XAxis dataKey="ts" tick={false} axisLine={{ stroke: "#272b38" }} />
        <YAxis
          tickFormatter={(v) => formatBytes(v)}
          tick={{ fontSize: 10, fill: "#7d84a0" }}
          axisLine={{ stroke: "#272b38" }}
          width={56}
        />
        <Tooltip
          contentStyle={{ background: "#171923", border: "1px solid #272b38", borderRadius: 6, fontSize: 12 }}
          labelFormatter={() => ""}
          formatter={(value: number, name: string) => [formatBytes(value) + "/s", name === "sent" ? "送信" : "受信"]}
        />
        <Area type="monotone" dataKey="sent" name="sent" stroke="#5b8cff" strokeWidth={1.5} fill="url(#chartSent)" isAnimationActive={false} />
        <Area type="monotone" dataKey="recv" name="recv" stroke="#3ddc84" strokeWidth={1.5} fill="url(#chartRecv)" isAnimationActive={false} />
      </AreaChart>
    </ResponsiveContainer>
  );
}
