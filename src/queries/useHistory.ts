import { useQuery } from "@tanstack/react-query";

import { api } from "@/lib/tauri";
import type { HistoryFilter } from "@/lib/types";

export function useHistory(filter: HistoryFilter) {
  return useQuery({
    queryKey: ["history", filter],
    queryFn: () => api.queryHistory(filter),
    placeholderData: (prev) => prev,
  });
}
