import { Icon, type IconName } from "@/components/common/Icon";

export function StatCard({
  icon,
  label,
  value,
  sub,
  accent = "accent",
}: {
  icon: IconName;
  label: string;
  value: string;
  sub?: string;
  accent?: "accent" | "established" | "listen" | "timewait" | "closing";
}) {
  const accentClass = {
    accent: "bg-accent/10 text-accent",
    established: "bg-state-established/10 text-state-established",
    listen: "bg-state-listen/10 text-state-listen",
    timewait: "bg-state-timewait/10 text-state-timewait",
    closing: "bg-state-closing/10 text-state-closing",
  }[accent];

  return (
    <div className="rounded-lg border border-base-800 bg-base-900/60 p-4 transition-colors hover:border-base-700">
      <div className="flex items-center gap-2">
        <span className={`flex h-8 w-8 items-center justify-center rounded-md ${accentClass}`}>
          <Icon name={icon} size={16} />
        </span>
        <span className="text-xs font-medium text-base-400">{label}</span>
      </div>
      <div className="mt-3 text-2xl font-semibold tabular-nums text-base-100">{value}</div>
      {sub && <div className="mt-0.5 text-[11px] text-base-500">{sub}</div>}
    </div>
  );
}
