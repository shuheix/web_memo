---
title: 型チェッカーの現在地
description: Sorbet / Tapioca / Steep / RBS は何ができて何ができないか
---

## 全体像

Ruby の静的型付けには、書式とツールの組み合わせで大きく2系統ある。

| | Sorbet 系 | RBS 系 |
|---|---|---|
| 型の書式 | RBI (`.rbi`) / `sig` DSL | RBS (`.rbs`) ※Ruby公式 |
| チェッカー | **Sorbet** (`srb`) | **Steep** / TypeProf |
| 型の自動生成 | **Tapioca** | `rbs prototype` / `rbs collection` |
| 開発元 | Stripe + Shopify (Tapioca) | Ruby コアチーム (soutaro 氏) |

両系統とも、最近は「**コードにコメントで inline に型を書く**」方向へ収束しつつある。

---

## 何ができて、何ができないか

### Sorbet（チェッカー本体・Stripe製）
- ✅ できる: C++製で **超高速**。大規模コードベースでの実績（Stripe / Shopify）。`sig` を Ruby コード内に直接書ける。型ガードでの絞り込みが強力。
- ❌ できない / 苦手: 型を **RBI という独自フォーマット**で持つため Ruby 公式の RBS と非互換だった（最近 inline RBS 対応が進行中）。導入の初期コストが高い。

型をコードと同じファイルに `sig` で書く:

```ruby
# typed: true
require "sorbet-runtime"

class Greeter
  extend T::Sig

  sig { params(name: String).returns(String) }
  def hello(name)
    "Hello, #{name}!"
  end
end

Greeter.new.hello(42) # => srb tc がエラー: Expected String, got Integer
```

### Tapioca（型定義の自動生成・Shopify製）
- ✅ できる: gem や **Rails の DSL（`has_many` などメタプロ）から RBI を自動生成**。Sorbet を Rails で使うならほぼ必須。
- ❌ できない: あくまで **Sorbet 専用の RBI ジェネレータ**。型チェック自体はしない（Sorbet とセットで使う）。
- 💡 旧 `srb rbi` 系は保守モード。RBI 生成は Tapioca が公式推奨。

```bash
tapioca init            # 初期セットアップ
tapioca gems            # Gemfile の gem から RBI を生成
tapioca dsl             # Rails の has_many 等から RBI を生成
srb tc                  # 生成された型でチェック
```

### Steep（チェッカー本体・RBS系）
- ✅ できる: Ruby 公式フォーマット **RBS をそのまま使える**。本体コードを汚さず `.rbs` を別管理。
- ❌ できない / 苦手: Sorbet ほど高速ではない。型定義を別ファイルで書く手間。
- 💡 最近 **User-defined Type Guards** を追加し、アプリ独自ロジックでも型の絞り込みが可能に。

`sig/greeter.rbs` に型を別ファイルで書く:

```rbs
class Greeter
  def hello: (String name) -> String
end
```

```bash
steep check   # lib/greeter.rb を上の .rbs と突き合わせてチェック
```

### RBS（型シグネチャ言語・Ruby公式）
- ✅ できる: Ruby 3.0 から標準同梱の**公式型フォーマット**。`rbs collection install` で gem の型定義を取得（RBS Collection）。
- ❌ できない: RBS は「言語」であってチェッカーではない。実際の検査は Steep / TypeProf が担う。
- 💡 コード内に型を書く `rbs-inline` は **プロトタイプ扱い**。将来 rbs 本体 gem に取り込み、`rbs-inline` gem は deprecate 予定。

`rbs-inline` ならコメントで型を書き、`.rbs` を自動生成できる:

```ruby
class Greeter
  # @rbs name: String
  # @rbs return: String
  def hello(name)
    "Hello, #{name}!"
  end
end
```

---

## どう選ぶか

- **速度・実績・厳格さ重視 / Rails 大規模** → Sorbet + Tapioca
- **公式フォーマットに乗る / 本体非汚染で `.rbs` 管理** → RBS + Steep
- どちらも inline 化が進んでいるので、今から学ぶならその前提で。

## 今後

- RubyKaigi 2025 で、将来の Ruby に gradual typing モード（"Typed Ruby" / 型違反でインタプリタ警告）を入れる議論あり。
- Ruby コアが型に踏み込めば採用が一気に増える可能性。バージョンは 3.5 preview を経て **4.0** へ。
