const PRESETS = [
  { label: "1時間", ms: 60 * 60 * 1000 },
  { label: "24時間", ms: 24 * 60 * 60 * 1000 },
  { label: "7日間", ms: 7 * 24 * 60 * 60 * 1000 },
  { label: "全期間", ms: 0 },
];

export function DateRangePicker({
  activePresetMs,
  onSelect,
}: {
  activePresetMs: number;
  onSelect: (ms: number) => void;
}) {
  return (
    <div className="flex gap-1">
      {PRESETS.map((p) => (
        <button
          key={p.label}
          onClick={() => onSelect(p.ms)}
          className={`rounded-md border px-2.5 py-1 text-xs font-medium transition-colors ${
            activePresetMs === p.ms
              ? "border-accent/40 bg-accent/15 text-accent"
              : "border-base-700 text-base-400 hover:bg-base-850"
          }`}
        >
          {p.label}
        </button>
      ))}
    </div>
  );
}
