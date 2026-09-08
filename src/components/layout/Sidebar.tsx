import { Icon, type IconName } from "@/components/common/Icon";
import { useUiStore, type Tab } from "@/store/uiStore";

const ITEMS: { tab: Tab; label: string; icon: IconName }[] = [
  { tab: "overview", label: "概要", icon: "overview" },
  { tab: "connections", label: "接続", icon: "connections" },
  { tab: "history", label: "履歴", icon: "history" },
  { tab: "settings", label: "設定", icon: "settings" },
];

export function Sidebar() {
  const activeTab = useUiStore((s) => s.activeTab);
  const setActiveTab = useUiStore((s) => s.setActiveTab);

  return (
    <div className="flex w-16 shrink-0 flex-col items-center gap-1 border-r border-base-800 bg-base-900 py-3">
      {ITEMS.map((item) => {
        const isActive = activeTab === item.tab;
        return (
          <button
            key={item.tab}
            onClick={() => setActiveTab(item.tab)}
            title={item.label}
            className="group relative flex h-12 w-12 flex-col items-center justify-center gap-1 rounded-lg text-[10px] transition-colors"
          >
            {isActive && (
              <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-accent" />
            )}
            <span
              className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${
                isActive ? "bg-accent/15 text-accent" : "text-base-400 group-hover:bg-base-850 group-hover:text-base-200"
              }`}
            >
              <Icon name={item.icon} size={18} />
            </span>
            <span className={isActive ? "text-accent" : "text-base-500 group-hover:text-base-300"}>{item.label}</span>
          </button>
        );
      })}
    </div>
  );
}
