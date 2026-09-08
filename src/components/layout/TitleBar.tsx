import { getCurrentWindow } from "@tauri-apps/api/window";

import { useIsElevated } from "@/queries/useProcessActions";
import { useUiStore } from "@/store/uiStore";
import { Icon } from "@/components/common/Icon";

const appWindow = getCurrentWindow();
const isMac = navigator.platform.toLowerCase().includes("mac");

export function TitleBar() {
  const elevated = useIsElevated();
  const setPaletteOpen = useUiStore((s) => s.setPaletteOpen);

  return (
    <div className="drag flex h-11 shrink-0 items-center justify-between border-b border-base-800 bg-base-900 px-3">
      <div className="flex items-center gap-2.5">
        <img src="/app-icon.png" alt="" className="h-6 w-6 rounded-md" draggable={false} />
        <span className="text-sm font-semibold tracking-tight text-base-100">Portality</span>
        <span
          className={`ml-1 flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium ${
            elevated.data
              ? "border-state-established/30 bg-state-established/10 text-state-established"
              : "border-state-timewait/30 bg-state-timewait/10 text-state-timewait"
          }`}
        >
          <Icon name="shield" size={10} />
          {elevated.data ? "管理者" : "標準権限"}
        </span>
      </div>

      <div className="no-drag flex items-center gap-2">
        <button
          onClick={() => setPaletteOpen(true)}
          className="flex items-center gap-1.5 rounded-md border border-base-700 px-2.5 py-1 text-[11px] text-base-400 transition-colors hover:border-base-600 hover:bg-base-800 hover:text-base-200"
        >
          <Icon name="search" size={12} />
          <span>検索・コマンド</span>
          <kbd className="rounded border border-base-600 bg-base-800 px-1 font-mono text-[10px]">
            {isMac ? "⌘K" : "Ctrl+K"}
          </kbd>
        </button>
        <div className="mx-1 h-4 w-px bg-base-800" />
        <button
          onClick={() => appWindow.minimize()}
          className="flex h-7 w-9 items-center justify-center rounded text-base-400 hover:bg-base-800 hover:text-base-200"
        >
          <Icon name="minus" size={13} />
        </button>
        <button
          onClick={() => appWindow.toggleMaximize()}
          className="flex h-7 w-9 items-center justify-center rounded text-base-400 hover:bg-base-800 hover:text-base-200"
        >
          <Icon name="square" size={11} />
        </button>
        <button
          onClick={() => appWindow.close()}
          className="flex h-7 w-9 items-center justify-center rounded text-base-400 hover:bg-state-closing hover:text-base-950"
        >
          <Icon name="close" size={13} />
        </button>
      </div>
    </div>
  );
}
