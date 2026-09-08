# Portality

開発者向けの高機能ポート/ネットワーク可視化 Windows デスクトップアプリ。
Tauri (Rust) + React/TypeScript 製。

## インストール方法

1. [Releases](https://github.com/Lapius7/portality/releases/latest) から最新の `Portality_x.y.z_x64-setup.exe` をダウンロード
2. ダウンロードしたインストーラを実行(初回はWindows SmartScreenの警告が出ることがありますが、「詳細情報」→「実行」で進めます。証明書未署名のため表示されるもので、動作には問題ありません)
3. インストール完了後、スタートメニューまたはデスクトップのショートカットから起動

### 起動後の使い方

- ウィンドウを閉じても終了せず、**タスクトレイに常駐**します。再度開くにはトレイアイコンをクリックするか、右クリックメニューの「開く」を選択してください
- 完全に終了するには、トレイアイコンを右クリックして「終了」を選択してください
- Kill機能やトラフィック計測の精度を上げたい場合は、設定タブから「管理者として再起動」してください(必須ではありません)

### アップデート

アプリ内の「設定 → アップデート → 更新を確認」から、新しいバージョンが公開されているかを確認し、そのままダウンロード・インストール・再起動できます。GitHub上の新しいリリースを自動で検知します。

## セットアップ (開発者向け・ソースからビルド)

前提: Node.js 18+, Rust (stable, MSVC toolchain), [Tauri の前提環境](https://tauri.app/start/prerequisites/) (WebView2 は Windows 11 なら標準搭載)。

```powershell
npm install
npm run tauri dev      # 開発サーバ起動
npm run tauri build    # NSISインストーラ付きリリースビルド
```

初回ビルド前にアプリアイコンを差し替える場合:

```powershell
npx tauri icon path/to/source-icon.png
```

## 実装状況

- [x] **Phase 1 — ポート一覧・検索/フィルタ**: `GetExtendedTcpTable`/`GetExtendedUdpTable` によるTCP/UDP接続の列挙、PID→プロセス名の付与、1秒間隔の差分ポーリング+イベントプッシュ、仮想化テーブル+検索/フィルタUI。
- [x] **Phase 2 — プロセスKill**: `TerminateProcess`によるKill、アクセス拒否時の「管理者として再起動」導線、確認ダイアログ。
- [x] **Phase 3 — トラフィック/帯域グラフ**: TCP接続はper-connection EStats(`GetPerTcpConnectionEStats`)、システム全体はアダプタ集計(`GetIfTable2`)による通信量計測。行内スパークライン+詳細パネルのトラフィックチャート。UDPは非対応(OS側にUDP用の同等カウンタがないため)。
- [x] **Phase 4 — 履歴・ポート使用ログ**: SQLite(rusqlite, bundled)に5秒毎のスナップショットを永続化。日付範囲/プロセス名フィルタ付きの履歴ビュー、タイムライン可視化、CSVエクスポート、保持期間ベースの自動プルーニング。
- [x] **Phase 5 — UI仕上げ**: Cmd/Ctrl+Kのコマンドパレット(タブ移動・接続検索・Killをキーボードだけで実行)、トースト通知(Kill/CSVエクスポート結果)、インストーラのメタデータ(発行者・説明・日英インストーラ言語選択)を整備。設定パネル(更新間隔・保持期間・権限表示)を実装済み。
- [x] **タスクトレイ常駐**: ウィンドウを閉じるとタスクトレイに常駐し、トレイアイコンのクリックまたは「開く」メニューで復帰、「終了」メニューで完全終了(`src-tauri/src/tray.rs`)。
- [x] **GitHub経由の自動アップデート**: `tauri-plugin-updater`によりGitHub Releasesの`latest.json`をエンドポイントとして更新確認・ダウンロード・再起動を実装(設定 → アップデート)。

## 開発環境に関する注意

このコードはLinuxコンテナ内で作成されており、`cargo check`/`cargo build`(非Windowsターゲット、`net/iphlpapi.rs`・`traffic/estats.rs`・`traffic/adapter.rs`等のモック経路)とフロントエンドのビルド(`tsc`/`vite build`)は通過を確認済みです。ただし `Win32_NetworkManagement_IpHelper` / `GetPerTcpConnectionEStats` / `GetIfTable2` / `TerminateProcess` などのWindows専用API実装は、GitHub Actions上のWindowsランナーでのビルドで検証しています。EStats関連(`traffic/estats.rs`)でコンパイルエラーが出た場合、使用しているwindows crateのバージョンのドキュメント(docs.rs)で構造体/定数名を確認して調整してください。

## アーキテクチャ概要

```
src-tauri/src/
├── net/              # TCP/UDP接続列挙 (Windows IP Helper API) + プロセス情報付与
├── process/kill.rs   # プロセス終了
├── elevation.rs      # 管理者権限判定・昇格
├── poller.rs         # バックグラウンドポーリング→差分イベント発行・トラフィック計測・履歴書き込み
├── traffic/          # per-connection EStats + アダプタ集計フォールバック、ローリングバッファ
├── persistence/      # SQLite(rusqlite)による履歴ログ、フィルタ付きクエリ、保持期間プルーニング
├── tray.rs           # タスクトレイアイコン・メニュー(開く/終了)、閉じるボタンで常駐化
└── commands/         # フロントエンドから呼び出すTauriコマンド一式

.github/workflows/
├── ci.yml            # push/PR時のビルド確認(フロントエンド+Rust)
└── release.yml       # vX.Y.Zタグpushで署名付きインストーラをビルドしGitHub Releaseに公開

src/
├── store/        # Zustand: connectionsStore(ライブ接続一覧), trafficStore(通信量), uiStore(タブ/フィルタ/選択状態)
├── queries/      # TanStack Query: 接続/履歴の初期ロード、トラフィック購読、Kill/昇格ミューテーション
└── components/
    ├── layout/   # フレームレスウィンドウ + カスタムタイトルバー + サイドバー(接続/履歴/設定タブ)
    ├── grid/     # 仮想化テーブル + 検索/フィルタバー + 行内スパークライン
    ├── detail/   # 選択接続の詳細パネル + トラフィックチャート
    ├── kill/     # Kill確認ダイアログ
    ├── history/  # 履歴ビュー・タイムライン・日付範囲プリセット・CSVエクスポート
    ├── settings/ # 更新間隔・保持期間・権限表示
    └── common/   # コマンドパレット(Cmd/Ctrl+K)、トースト通知
```
