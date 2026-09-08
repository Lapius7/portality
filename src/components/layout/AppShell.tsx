import type { ReactNode } from "react";

import { TitleBar } from "./TitleBar";
import { Sidebar } from "./Sidebar";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden rounded-lg border border-base-800">
      <TitleBar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <div className="relative flex-1 overflow-hidden">{children}</div>
      </div>
    </div>
  );
}
