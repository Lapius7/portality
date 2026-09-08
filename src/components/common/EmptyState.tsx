import { Icon, type IconName } from "./Icon";

export function EmptyState({
  icon,
  title,
  description,
}: {
  icon: IconName;
  title: string;
  description?: string;
}) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-base-800 text-base-500">
        <Icon name={icon} size={22} />
      </span>
      <div>
        <div className="text-sm font-medium text-base-300">{title}</div>
        {description && <div className="mt-1 text-xs text-base-500">{description}</div>}
      </div>
    </div>
  );
}
