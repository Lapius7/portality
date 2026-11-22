<div align="center">

<p align="center">
  <img src="docs/images/banner.png" alt="Portality" width="100%">
</p>

<p align="center"><a href="README.md">English</a> | <b>日本語</b></p>

<h1 align="center">Portality</h1>

<h3 align="center">Windows の全ポートと通信を、ひと目で。</h3>

<p align="center">開発者向けの Windows デスクトップアプリです。TCP/UDP のポート、接続ごとの通信量、履歴を一覧できます。Tauri (Rust) と React/TypeScript で作っています。</p>

<p align="center">
  <a href="https://github.com/Lapius7/portality/releases"><img alt="Release" src="https://img.shields.io/github/v/release/Lapius7/portality?label=release&style=flat-square&color=e8833a&logo=github"></a>
  <a href="https://github.com/Lapius7/portality/actions/workflows/ci.yml"><img alt="CI" src="https://img.shields.io/github/actions/workflow/status/Lapius7/portality/ci.yml?branch=main&label=CI&style=flat-square&logo=githubactions&logoColor=white"></a>
  <a href="LICENSE"><img alt="License: MIT" src="https://img.shields.io/github/license/Lapius7/portality?style=flat-square&color=97ca00"></a>
  <a href="https://tauri.app"><img alt="Tauri" src="https://img.shields.io/badge/Tauri-2-ffc131?style=flat-square&logo=tauri&logoColor=000000"></a>
  <a href="https://www.microsoft.com/windows"><img alt="Windows" src="https://img.shields.io/badge/platform-Windows-0078d4?style=flat-square&logo=windows&logoColor=white"></a>
  <a href="https://github.com/Lapius7/portality/stargazers"><img alt="Stars" src="https://img.shields.io/github/stars/Lapius7/portality?style=flat-square&color=e3b341&logo=github"></a>
  <a href="https://github.com/Lapius7/portality/commits/main"><img alt="Last commit" src="https://img.shields.io/github/last-commit/Lapius7/portality?style=flat-square&color=3b82f6"></a>
</p>

<p align="center">
  <a href="#クイックスタート">クイックスタート</a> ·
  <a href="#特長">特長</a> ·
  <a href="#開発">開発</a> ·
  <a href="#今後の予定">今後の予定</a>
</p>

</div>

---

## 特長

- **ポート一覧**: `GetExtendedTcpTable` / `GetExtendedUdpTable` で TCP/UDP 接続を列挙し、PID からプロセス名を付けます。1秒間隔の差分ポーリングとイベントプッシュで更新し、仮想化テーブルと検索・フィルタで表示します。
- **プロセスの Kill**: `TerminateProcess` で終了します。確認ダイアログがあり、アクセス拒否のときは「管理者として再起動」へ進めます。
- **トラフィックグラフ**: TCP 接続は per-connection EStats（`GetPerTcpConnectionEStats`）、システム全体はアダプタ集計（`GetIfTable2`）で通信量を測ります。行内のスパークラインと、詳細パネルのチャートで表示します。UDP は、OS に同等のカウンタがないため非対応です。
- **履歴**: ポーラーの5ティックごとのスナップショットを SQLite（rusqlite, bundled）に保存します。履歴ビューには日付範囲とプロセス名のフィルタ、タイムライン、CSV エクスポートがあり、保持期間に応じて自動で古い記録を削除します。
- **キーボード操作**: Cmd/Ctrl+K のコマンドパレットで、タブ移動、接続検索、Kill ができます。Kill や CSV エクスポートの結果はトーストで通知します。
- **タスクトレイ**: ウィンドウを閉じても、タスクトレイに常駐します。
- **自動アップデート**: `tauri-plugin-updater` が GitHub Releases の `latest.json` を確認し、ダウンロード、インストール、再起動まで行います。

## クイックスタート

1. [Releases](https://github.com/Lapius7/portality/releases/latest) から最新の `Portality_x.y.z_x64-setup.exe` をダウンロードします。
2. インストーラを実行します。
3. スタートメニューまたはデスクトップのショートカットから起動します。

> [!NOTE]
> 初回は、インストーラにコード署名の証明書がないため、Windows SmartScreen の警告が出ることがあります。「詳細情報」から「実行」を選んでください。

**起動後の使い方**

- ウィンドウを閉じてもアプリは終了せず、**タスクトレイに常駐**します。再度開くには、トレイアイコンをクリックするか、右クリックメニューの「開く」を選びます。
- 完全に終了するには、トレイアイコンを右クリックして「終了」を選びます。
- Kill とトラフィック計測の精度を上げたいときは、設定タブの「管理者として再起動」を使います（必須ではありません）。

**アップデート**: アプリ内の「設定 → アップデート → 更新を確認」から行います。GitHub 上の新しいリリースを検知し、ダウンロード、インストール、再起動まで進められます。

## 開発

Node.js 18 以降、Rust（stable、MSVC toolchain）、[Tauri の前提環境](https://tauri.app/start/prerequisites/)が必要です（WebView2 は Windows 11 なら標準搭載）。

```powershell
pnpm install
pnpm run tauri dev      # 開発サーバ起動
pnpm run tauri build    # NSISインストーラ付きリリースビルド
```

アプリとインストーラーのアイコンは `design/icon.svg` がソースです。差し替えるときはこの SVG を編集し、`npx tauri icon design/icon.svg` で `src-tauri/icons/` 配下の各サイズと `icon.ico` を再生成してください。

<details>
<summary>アーキテクチャ</summary>

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

</details>

> [!NOTE]
> このコードは Linux コンテナ内で作成されました。そこで、`cargo check` / `cargo build`（非Windowsターゲット。`net/iphlpapi.rs`、`traffic/estats.rs`、`traffic/adapter.rs` などのモック経路）とフロントエンドのビルド（`tsc` / `vite build`）が通ることを確認しています。Windows 専用 API の実装（`Win32_NetworkManagement_IpHelper`、`GetPerTcpConnectionEStats`、`GetIfTable2`、`TerminateProcess`）は、GitHub Actions の Windows ランナーでのビルドで検証しています。`traffic/estats.rs` でコンパイルエラーが出たときは、使っている `windows` crate のバージョンのドキュメント（docs.rs）で構造体や定数の名前を確認してください。今回の書き直しでは、ビルドを再実行していません。

## 今後の予定

予定していたフェーズはすべて実装済みです（ポート一覧、Kill、トラフィックグラフ、履歴、UI の仕上げ、タスクトレイ、自動アップデート）。

## ライセンス

[MIT](LICENSE)
