# Portality

開発者向けの高機能ポート/ネットワーク可視化 Windows デスクトップアプリ。
Tauri (Rust) + React/TypeScript 製。

## セットアップ (Windows)

前提: Node.js 18+, Rust (stable, MSVC toolchain), [Tauri の前提環境](https://tauri.app/start/prerequisites/) (WebView2 は Windows 11 なら標準搭載)。

```powershell
npm install
npm run tauri dev      # 開発サーバ起動
npm run tauri build    # NSISインストーラ付きリリースビルド
```

初回ビルド前にアプリアイコンを差し替えてください(現在のアイコンはプレースホルダーです):

```powershell
npx tauri icon path/to/source-icon.png
```

## 実装状況

- [x] **Phase 1 — ポート一覧・検索/フィルタ**: `GetExtendedTcpTable`/`GetExtendedUdpTable` によるTCP/UDP接続の列挙、PID→プロセス名の付与、1秒間隔の差分ポーリング+イベントプッシュ、仮想化テーブル+検索/フィルタUI。
- [x] **Phase 2 — プロセスKill**: `TerminateProcess`によるKill、アクセス拒否時の「管理者として再起動」導線、確認ダイアログ。
- [x] **Phase 3 — トラフィック/帯域グラフ**: TCP接続はper-connection EStats(`GetPerTcpConnectionEStats`)、システム全体はアダプタ集計(`GetIfTable2`)による通信量計測。行内スパークライン+詳細パネルのトラフィックチャート。**要検証**: EStats APIの構造体/定数名はwindows crateのバージョンにより差異があり得るため、Windows実機での初回ビルド時に確認が必要(`src-tauri/src/traffic/estats.rs`にコメント記載)。UDPは非対応(OS側にUDP用の同等カウンタがないため)。
- [x] **Phase 4 — 履歴・ポート使用ログ**: SQLite(rusqlite, bundled)に5秒毎のスナップショットを永続化。日付範囲/プロセス名フィルタ付きの履歴ビュー、タイムライン可視化、CSVエクスポート、保持期間ベースの自動プルーニング。
- [x] **Phase 5 — UI仕上げ**: Cmd/Ctrl+Kのコマンドパレット(タブ移動・接続検索・Killをキーボードだけで実行)、トースト通知(Kill/CSVエクスポート結果)、インストーラのメタデータ(発行者・説明・日英インストーラ言語選択)を整備。設定パネル(更新間隔・保持期間・権限表示)を実装済み。
- [x] **タスクトレイ常駐**: ウィンドウを閉じるとタスクトレイに常駐し、トレイアイコンのクリックまたは「開く」メニューで復帰、「終了」メニューで完全終了(`src-tauri/src/tray.rs`)。
- [x] **GitHub経由の自動アップデート**: `tauri-plugin-updater`によりGitHub Releasesの`latest.json`をエンドポイントとして更新確認・ダウンロード・再起動を実装(設定 → アップデート)。**公開作業はユーザー側で必要**(下記「GitHubへの公開手順」参照)。

## 開発環境に関する注意

このコードはLinuxコンテナ内で作成されており、`cargo check`/`cargo build`(非Windowsターゲット、`net/iphlpapi.rs`・`traffic/estats.rs`・`traffic/adapter.rs`等のモック経路)とフロントエンドのビルド(`tsc`/`vite build`)は通過を確認済みです。ただし `Win32_NetworkManagement_IpHelper` / `GetPerTcpConnectionEStats` / `GetIfTable2` / `TerminateProcess` などのWindows専用API実装は、この環境ではコンパイル・実機検証ができません。**Windows環境で `npm run tauri dev` を実行し、実際のポート一覧表示・Kill機能・トラフィック計測・権限まわりの動作を確認してください。**特にEStats関連(`traffic/estats.rs`)はコンパイルエラーが出た場合、使用しているwindows crateのバージョンのドキュメント(docs.rs)で構造体/定数名を確認して調整してください。

## GitHubへの公開手順(https://github.com/Lapius7/portality)

この作業はGitHubアカウントの認証が必要なため、開発者(あなた)が実行してください。

### 1. リポジトリを作成してpush

GitHub上で `Lapius7/portality` という名前の空リポジトリを作成してから、プロジェクトルート(`package.json`と`src-tauri`がある場所)で:

```powershell
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/Lapius7/portality.git
git push -u origin main
```

(`gh` CLIが使える場合は `gh repo create Lapius7/portality --public --source=. --push` でも可)

### 2. 自動アップデート用の署名鍵を生成

自動アップデートはリリース成果物の改ざん検知のため署名が必須です。秘密鍵は**あなたの手元でのみ生成・保管**してください(このセッションでは生成していません):

```powershell
npm run tauri signer generate -- -w ./portality-updater.key
```

- パスフレーズを聞かれるので設定してください(空でも可ですが推奨しません)
- `portality-updater.key`(秘密鍵)と、コンソールに表示される公開鍵の2つが得られます
- `.gitignore`に`*.key`を追加し、秘密鍵は絶対にコミットしないでください

### 3. 公開鍵を設定ファイルに反映

`src-tauri/tauri.conf.json` の `plugins.updater.pubkey` を、手順2で表示された公開鍵の値に置き換えてください(現在は `REPLACE_WITH_YOUR_GENERATED_PUBLIC_KEY` というプレースホルダーです)。

### 4. GitHub Secretsを設定

リポジトリの Settings → Secrets and variables → Actions で以下を追加:

| Secret名 | 値 |
|---|---|
| `TAURI_SIGNING_PRIVATE_KEY` | `portality-updater.key` の中身(秘密鍵) |
| `TAURI_SIGNING_PRIVATE_KEY_PASSWORD` | 手順2で設定したパスフレーズ |

(`GITHUB_TOKEN` はGitHub Actionsが自動的に用意するため設定不要です)

### 5. リリースを作成

`.github/workflows/release.yml` が `v*` 形式のタグpushをトリガーに、Windows向けNSISインストーラのビルド・署名・GitHub Releaseへの公開・`latest.json`(自動アップデート用マニフェスト)の生成までを自動実行します:

```powershell
git tag v0.1.0
git push origin v0.1.0
```

Actionsタブでビルドが完了すると、Releasesに下書き(draft)としてインストーラが公開されます。内容を確認して「Publish release」を押すと公開され、以降このバージョンより新しいタグをリリースするたびに、既存ユーザーのアプリ内「設定 → 更新を確認」から自動更新できるようになります。

### 補足: コード署名について

現状インストーラは(Windowsのコード署名証明書がないため)未署名です。配布時にSmartScreenの警告が出ますが、動作に支障はありません。将来的に配布を広げる場合はOV/EVコード署名証明書の取得を検討してください。

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

詳細設計は `/config/.claude/plans/shiny-coalescing-hinton.md` を参照。
