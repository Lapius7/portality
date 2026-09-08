import { useMutation } from "@tanstack/react-query";
import { check } from "@tauri-apps/plugin-updater";
import { relaunch } from "@tauri-apps/plugin-process";

export type UpdateCheckResult = { available: false } | { available: true; version: string };

export function useUpdateCheck() {
  return useMutation<UpdateCheckResult>({
    mutationFn: async () => {
      const update = await check();
      if (!update) return { available: false };
      return { available: true, version: update.version };
    },
  });
}

export function useInstallUpdate() {
  return useMutation({
    mutationFn: async () => {
      const update = await check();
      if (!update) return;
      await update.downloadAndInstall();
      await relaunch();
    },
  });
}
