import { create } from "zustand";

import type { Protocol, TcpState } from "@/lib/types";

export type Tab = "overview" | "connections" | "history" | "settings";
export type GroupMode = "none" | "process";

interface UiState {
  activeTab: Tab;
  search: string;
  protocolFilter: Protocol | "all";
  stateFilter: TcpState | "all";
  selectedId: string | null;
  pendingKillId: string | null;
  paletteOpen: boolean;
  groupMode: GroupMode;
  setActiveTab: (tab: Tab) => void;
  setSearch: (search: string) => void;
  setProtocolFilter: (protocol: Protocol | "all") => void;
  setStateFilter: (state: TcpState | "all") => void;
  select: (id: string | null) => void;
  requestKill: (id: string | null) => void;
  setPaletteOpen: (open: boolean) => void;
  setGroupMode: (mode: GroupMode) => void;
}

export const useUiStore = create<UiState>((set) => ({
  activeTab: "overview",
  search: "",
  protocolFilter: "all",
  stateFilter: "all",
  selectedId: null,
  pendingKillId: null,
  paletteOpen: false,
  groupMode: "none",
  setActiveTab: (activeTab) => set({ activeTab }),
  setSearch: (search) => set({ search }),
  setProtocolFilter: (protocolFilter) => set({ protocolFilter }),
  setStateFilter: (stateFilter) => set({ stateFilter }),
  select: (selectedId) => set({ selectedId }),
  requestKill: (pendingKillId) => set({ pendingKillId }),
  setPaletteOpen: (paletteOpen) => set({ paletteOpen }),
  setGroupMode: (groupMode) => set({ groupMode }),
}));
