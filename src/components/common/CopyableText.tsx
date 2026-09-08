import { useState } from "react";

import { Icon } from "./Icon";

export function CopyableText({ value, className = "" }: { value: string; className?: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      // Clipboard access can be denied by the OS; silently ignore.
    }
  };

  return (
    <button
      onClick={copy}
      title="クリックしてコピー"
      className={`group/copy inline-flex items-center gap-1 rounded px-0.5 hover:bg-base-800 ${className}`}
    >
      <span className="truncate">{value}</span>
      <Icon
        name={copied ? "check" : "copy"}
        size={10}
        className={`shrink-0 opacity-0 transition-opacity group-hover/copy:opacity-100 ${copied ? "text-state-established opacity-100" : "text-base-500"}`}
      />
    </button>
  );
}
