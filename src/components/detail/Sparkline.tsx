import { Area, AreaChart, ResponsiveContainer } from "recharts";

import type { TrafficPoint } from "@/store/trafficStore";

export function Sparkline({ data, height = 24 }: { data: TrafficPoint[]; height?: number }) {
  if (data.length < 2) {
    return <div className="text-[10px] text-base-600">—</div>;
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 2, right: 0, bottom: 2, left: 0 }}>
        <defs>
          <linearGradient id="sparkSent" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#5b8cff" stopOpacity={0.5} />
            <stop offset="100%" stopColor="#5b8cff" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="sparkRecv" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3ddc84" stopOpacity={0.5} />
            <stop offset="100%" stopColor="#3ddc84" stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area type="monotone" dataKey="sent" stroke="#5b8cff" strokeWidth={1.25} fill="url(#sparkSent)" isAnimationActive={false} />
        <Area type="monotone" dataKey="recv" stroke="#3ddc84" strokeWidth={1.25} fill="url(#sparkRecv)" isAnimationActive={false} />
      </AreaChart>
    </ResponsiveContainer>
  );
}
