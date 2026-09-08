import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { api } from "@/lib/tauri";
import type { KillError } from "@/lib/types";

export function useIsElevated() {
  return useQuery({
    queryKey: ["elevation"],
    queryFn: api.isElevated,
    staleTime: 30_000,
  });
}

export function useKillProcess() {
  const queryClient = useQueryClient();
  return useMutation<void, KillError, number>({
    mutationFn: (pid: number) => api.killProcess(pid),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["connections"] });
    },
  });
}

export function useRelaunchAsAdmin() {
  return useMutation({
    mutationFn: api.relaunchAsAdmin,
  });
}
