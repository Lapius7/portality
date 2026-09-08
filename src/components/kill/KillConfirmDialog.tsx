import { AnimatePresence, motion } from "framer-motion";

import type { Connection, KillError } from "@/lib/types";
import { useUiStore } from "@/store/uiStore";
import { useToastStore } from "@/store/toastStore";
import { useKillProcess, useRelaunchAsAdmin } from "@/queries/useProcessActions";

export function KillConfirmDialog({ connections }: { connections: Connection[] }) {
  const pendingKillId = useUiStore((s) => s.pendingKillId);
  const requestKill = useUiStore((s) => s.requestKill);
  const killMutation = useKillProcess();
  const relaunch = useRelaunchAsAdmin();
  const pushToast = useToastStore((s) => s.push);

  const target = connections.find((c) => c.id === pendingKillId) ?? null;
  const open = !!target;

  const close = () => {
    requestKill(null);
    killMutation.reset();
  };

  const handleKill = () => {
    if (!target) return;
    const label = target.process_name ?? `PID ${target.pid}`;
    killMutation.mutate(target.pid, {
      onSuccess: () => {
        pushToast(`${label} を終了しました`, "success");
        close();
      },
      onError: (err) => {
        if ((err as KillError).kind !== "AccessDenied") {
          pushToast(`${label} の終了に失敗しました`, "error");
        }
      },
    });
  };

  const error = killMutation.error as KillError | null;

  return (
    <AnimatePresence>
      {open && target && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={close}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.15 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-lg border border-base-700 bg-base-900 p-5 shadow-panel"
          >
            <h2 className="text-sm font-semibold text-base-100">プロセスを終了しますか?</h2>
            <p className="mt-2 text-sm text-base-400">
              <span className="font-mono text-base-200">{target.process_name ?? "不明なプロセス"}</span>
              {" "}(PID {target.pid}) がポート
              <span className="mx-1 font-mono text-base-200">{target.local_port}</span>
              を解放して終了します。この操作は取り消せません。
            </p>

            {error && (
              <div className="mt-3 rounded-md border border-state-closing/30 bg-state-closing/10 p-2 text-xs text-state-closing">
                {error.kind === "AccessDenied" ? (
                  <div className="flex items-center justify-between gap-2">
                    <span>アクセスが拒否されました。管理者権限が必要です。</span>
                    <button
                      onClick={() => relaunch.mutate()}
                      className="shrink-0 rounded bg-state-closing/20 px-2 py-1 font-medium hover:bg-state-closing/30"
                    >
                      管理者として再起動
                    </button>
                  </div>
                ) : (
                  <span>{error.message}</span>
                )}
              </div>
            )}

            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={close}
                className="rounded-md border border-base-700 px-3 py-1.5 text-sm text-base-300 hover:bg-base-850"
              >
                キャンセル
              </button>
              <button
                disabled={killMutation.isPending}
                onClick={handleKill}
                className="rounded-md bg-state-closing px-3 py-1.5 text-sm font-medium text-base-950 hover:opacity-90 disabled:opacity-50"
              >
                {killMutation.isPending ? "終了中..." : "終了する"}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
