---
title: ミニ SNS サンプルアプリのエンドポイント一覧
description: ユーザー認証つきミニ SNS を作るための実装エンドポイントを棚卸しする。Rails チュートリアルを参考にした
---

ユーザー認証つきのミニ SNS（短文投稿＋フォロー）を作るための実装エンドポイント一覧。この一式で MVC・認証・CRUD・関連付け・メール・ファイルアップロード・TDD・デプロイを一通り扱う。パスは REST 規約ベース。エンドポイントの洗い出しは [Rails チュートリアル](https://railstutorial.jp/) を参考にした。

## エンドポイント一覧

### 静的ページ

| メソッド | パス | 役割 |
|---|---|---|
| GET | `/` | Home |
| GET | `/help` | Help |
| GET | `/about` | About |
| GET | `/contact` | Contact |

### ユーザー登録・管理

| メソッド | パス | 役割 |
|---|---|---|
| GET | `/signup` | 登録フォーム |
| POST | `/users` | ユーザー作成（バリデーション・パスワード暗号化） |
| GET | `/users` | ユーザー一覧（ページネーション） |
| GET | `/users/:id` | プロフィール表示（投稿一覧つき） |
| GET | `/users/:id/edit` | 編集フォーム（本人のみ） |
| PATCH | `/users/:id` | プロフィール更新（本人のみ） |
| DELETE | `/users/:id` | ユーザー削除（管理者のみ） |

### ログイン

| メソッド | パス | 役割 |
|---|---|---|
| GET | `/login` | ログインフォーム |
| POST | `/login` | ログイン（remember me 対応） |
| DELETE | `/logout` | ログアウト |

### アカウント有効化

| メソッド | パス | 役割 |
|---|---|---|
| GET | `/account_activations/:token/edit` | メール内リンクから有効化 |

### パスワード再設定

| メソッド | パス | 役割 |
|---|---|---|
| GET | `/password_resets/new` | 再設定リクエストフォーム |
| POST | `/password_resets` | 再設定メール送信 |
| GET | `/password_resets/:token/edit` | 再設定フォーム |
| PATCH | `/password_resets/:token` | パスワード更新 |

### 投稿（マイクロポスト）

| メソッド | パス | 役割 |
|---|---|---|
| POST | `/microposts` | 投稿作成（画像添付・バリデーション） |
| DELETE | `/microposts/:id` | 投稿削除（本人のみ） |

### フォロー・フィード

| メソッド | パス | 役割 |
|---|---|---|
| GET | `/users/:id/following` | フォロー中一覧 |
| GET | `/users/:id/followers` | フォロワー一覧 |
| POST | `/relationships` | フォロー |
| DELETE | `/relationships/:id` | フォロー解除 |

> フィードは Home（`GET /`）でログインユーザー＋フォロー中の投稿を新しい順に表示する。

---

## Advance（基本形に足すと新しい技術を扱う機能）

| 追加する機能 | 扱う技術 |
|---|---|
| リアルタイム通知 / DM（チャット） | WebSocket（Action Cable 等）。サーバーからの push |
| 重い処理の非同期化（メール・画像・集計） | 非同期ジョブ（Sidekiq / Solid Queue 等） |
| ソーシャルログイン（Google / GitHub） | OAuth・外部 API 連携 |
| 課金・サブスク | Stripe 連携・Webhook 受信・外部サービスとの状態同期 |
| 全文検索 / 絞り込み検索 | LIKE を超えた検索（pg_search / Meilisearch 等）、インデックス・N+1 |
| role/権限管理の本格化 | 認可ライブラリ（Pundit / CanCanCan 等）、宣言的ポリシー |
| API モード + 別フロント（React/Vue） | JSON API 設計・トークン認証（JWT）・CORS・SPA 分離 |
| 多言語対応（日/英切替） | i18n |
