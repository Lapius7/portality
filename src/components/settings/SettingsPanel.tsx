import { useEffect, useState } from "react";
import type { ReactNode } from "react";

import { api } from "@/lib/tauri";
import { useIsElevated, useRelaunchAsAdmin } from "@/queries/useProcessActions";
import { useInstallUpdate, useUpdateCheck } from "@/queries/useUpdater";
import { useToastStore } from "@/store/toastStore";
import { Icon, type IconName } from "@/components/common/Icon";

const APP_VERSION = "0.1.1";

function SectionCard({ icon, title, children }: { icon: IconName; title: string; children: ReactNode }) {
  return (
    <div className="rounded-lg border border-base-800 bg-base-900/60 transition-colors hover:border-base-700">
      <div className="flex items-center gap-2 border-b border-base-800 px-4 py-3">
        <span className="flex h-6 w-6 items-center justify-center rounded-md bg-accent/10 text-accent">
          <Icon name={icon} size={13} />
        </span>
        <h3 className="text-sm font-semibold text-base-100">{title}</h3>
      </div>
      <div className="divide-y divide-base-800 px-4">{children}</div>
    </div>
  );
}

function Field({ label, description, children }: { label: string; description: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3.5">
      <div>
        <div className="text-sm text-base-200">{label}</div>
        <div className="mt-0.5 text-xs text-base-500">{description}</div>
      </div>
      {children}
    </div>
  );
}

const selectClass =
  "rounded-md border border-base-700 bg-base-850 px-2 py-1.5 text-sm text-base-200 focus:border-accent focus:outline-none";

export function SettingsPanel() {
  const [pollMs, setPollMs] = useState(1000);
  const [retentionDays, setRetentionDays] = useState(14);
  const [clearArmed, setClearArmed] = useState(false);
  const [clearing, setClearing] = useState(false);
  const elevated = useIsElevated();
  const relaunch = useRelaunchAsAdmin();
  const pushToast = useToastStore((s) => s.push);
  const updateCheck = useUpdateCheck();
  const installUpdate = useInstallUpdate();

  useEffect(() => {
    api.getHistoryRetentionDays().then(setRetentionDays);
  }, []);

  const applyPoll = (ms: number) => {
    setPollMs(ms);
    api.setPollInterval(ms);
  };

  const applyRetention = (days: number) => {
    setRetentionDays(days);
    api.setHistoryRetentionDays(days);
  };

  const handleCheckUpdate = () => {
    updateCheck.mutate(undefined, {
      onSuccess: (result) => {
        if (result.available) {
          pushToast(`新しいバージョン ${result.version} が見つかりました`, "info");
        } else {
          pushToast("最新バージョンです", "success");
        }
      },
      onError: () => pushToast("アップデートの確認に失敗しました", "error"),
    });
  };

  const handleInstallUpdate = () => {
    installUpdate.mutate(undefined, {
      onError: () => pushToast("アップデートの適用に失敗しました", "error"),
    });
  };

  const handleClear = async () => {
    if (!clearArmed) {
      setClearArmed(true);
      setTimeout(() => setClearArmed(false), 3000);
      return;
    }
    setClearing(true);
    try {
      const count = await api.clearHistory();
      pushToast(`履歴を削除しました(${count}件)`, "success");
    } catch {
      pushToast("履歴の削除に失敗しました", "error");
    } finally {
      setClearing(false);
      setClearArmed(false);
    }
  };

  return (
    <div className="h-full overflow-y-auto px-6 py-6">
      <div className="mx-auto max-w-xl">
        <h2 className="text-lg font-semibold text-base-100">設定</h2>
        <p className="mt-1 text-sm text-base-500">Portalityの動作をカスタマイズします</p>

        <div className="mt-5 space-y-4">
          <SectionCard icon="shield" title="権限とセキュリティ">
            <Field label="実行権限" description="管理者権限で実行するとKillとトラフィック計測の精度が向上します">
              <div className="flex items-center gap-2">
                <span
                  className={`rounded-full border px-2.5 py-1 text-xs font-medium ${
                    elevated.data
                      ? "border-state-established/30 bg-state-established/10 text-state-established"
                      : "border-state-timewait/30 bg-state-timewait/10 text-state-timewait"
                  }`}
                >
                  {elevated.data ? "管理者" : "標準"}
                </span>
                {!elevated.data && (
                  <button
                    onClick={() => relaunch.mutate()}
                    className="rounded-md border border-base-700 px-2.5 py-1 text-xs text-base-300 hover:bg-base-850"
                  >
                    管理者として再起動
                  </button>
                )}
              </div>
            </Field>
          </SectionCard>

          <SectionCard icon="activity" title="モニタリング">
            <Field label="更新間隔" description="ポート一覧・トラフィックのポーリング間隔">
              <select value={pollMs} onChange={(e) => applyPoll(Number(e.target.value))} className={selectClass}>
                <option value={500}>0.5秒</option>
                <option value={1000}>1秒</option>
                <option value={2000}>2秒</option>
                <option value={5000}>5秒</option>
              </select>
            </Field>
          </SectionCard>

          <SectionCard icon="history" title="履歴データ">
            <Field label="保持期間" description="この日数より古いポート使用ログは自動的に削除されます">
              <select value={retentionDays} onChange={(e) => applyRetention(Number(e.target.value))} className={selectClass}>
                <option value={1}>1日</option>
                <option value={7}>7日</option>
                <option value={14}>14日</option>
                <option value={30}>30日</option>
                <option value={90}>90日</option>
              </select>
            </Field>
            <Field label="全履歴を削除" description="保存されているポート使用ログをすべて削除します(元に戻せません)">
              <button
                onClick={handleClear}
                disabled={clearing}
                className={`rounded-md border px-2.5 py-1.5 text-xs font-medium transition-colors disabled:opacity-50 ${
                  clearArmed
                    ? "border-state-closing/40 bg-state-closing/15 text-state-closing"
                    : "border-base-700 text-base-300 hover:bg-base-850"
                }`}
              >
                {clearing ? "削除中..." : clearArmed ? "本当に削除しますか?" : "削除する"}
              </button>
            </Field>
          </SectionCard>

          <SectionCard icon="download" title="アップデート">
            <Field
              label="更新の確認"
              description={
                updateCheck.data?.available
                  ? `新しいバージョン ${updateCheck.data.version} が利用可能です`
                  : "GitHub Releasesから最新版を確認します"
              }
            >
              {updateCheck.data?.available ? (
                <button
                  onClick={handleInstallUpdate}
                  disabled={installUpdate.isPending}
                  className="rounded-md border border-accent/40 bg-accent/15 px-2.5 py-1.5 text-xs font-medium text-accent hover:bg-accent/25 disabled:opacity-50"
                >
                  {installUpdate.isPending ? "インストール中..." : "更新して再起動"}
                </button>
              ) : (
                <button
                  onClick={handleCheckUpdate}
                  disabled={updateCheck.isPending}
                  className="rounded-md border border-base-700 px-2.5 py-1.5 text-xs text-base-300 hover:bg-base-850 disabled:opacity-50"
                >
                  {updateCheck.isPending ? "確認中..." : "更新を確認"}
                </button>
              )}
            </Field>
          </SectionCard>

          <SectionCard icon="port" title="このアプリについて">
            <Field label="Portality" description="開発者向けポート/ネットワーク可視化ツール">
              <span className="font-mono text-xs text-base-500">v{APP_VERSION}</span>
            </Field>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
