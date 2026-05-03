## プロジェクト概要

**Astro 6 + Starlight** で構築した個人用の技術ドキュメント/メモサイト。GitHub Pages に静的サイトとしてデプロイされる (`https://shuheix.github.io/web_memo/`)。

## コマンド

- **依存関係インストール**: `pnpm install`
- **開発サーバー起動**: `pnpm dev` (http://localhost:4321)
- **ビルド**: `pnpm build` (`./dist/` に出力)
- **ビルドプレビュー**: `pnpm preview`

**Node 22+** と **pnpm 9** が必要。

## アーキテクチャ
- **コンテンツ**: `src/content/docs/` 内の Markdown/MDX ファイルがファイルシステムベースでルーティングされる
- **コンテンツ設定**: `src/content.config.ts` で Starlight の loader/schema を使って docs コレクションを定義
- **サイドバー**: `astro.config.mjs` の `starlight()` インテグレーション設定内で定義。新しいページはここに追加する（ディレクトリ単位なら `autogenerate` も可）
- **ベースパス**: `/web_memo/` — 内部リンクはこのサブパスを考慮する必要がある（`astro.config.mjs` の `base` で設定）

## コンテンツの追加方法

1. `src/content/docs/<カテゴリ>/` に `.md` または `.mdx` ファイルを作成し、YAML フロントマター（`title`, `description`）を記述
2. `astro.config.mjs` の `sidebar` 配列にページを追加

## デプロイ

`main` ブランチへの push で GitHub Actions (`.github/workflows/deploy.yml`) が自動デプロイを実行。ワークフローは `pnpm install --frozen-lockfile` → `pnpm build` を実行し、`./dist/` を GitHub Pages にデプロイする。
