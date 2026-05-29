---
title: モナド・ROP・Either/Result・Effect・dry-monads の全体像
description: 「失敗するかもしれない計算をどう合成するか」という軸で、数学的な概念とプログラミングでの表現を分けて整理する
---

この5つは **「文脈を持った計算をどう合成するか」という1本の軸** でつながっている。
ただし「モナド」は数学（圏論）の概念で、残りはそれをプログラミングで具体化したもの。
混同しやすいので、**数学の話** と **プログラミングでの表現** を分けて整理する。

```
【数学の話】              【プログラミングでの表現】

モナド（圏論の概念）  ──┬─▶ Either / Result  ──▶ ROP（設計スタイル）
  ・型コンストラクタ M    │
  ・unit / bind          ├─▶ Maybe / Option
  ・3つのモナド則         │
                         └─▶ Effect（副作用まで拡張）

                            dry-monads … 上記を Ruby で実装したライブラリ
```

---

## 第1部: 数学の話（モナドとは何か）

モナドは元々 **圏論（category theory）** の概念で、プログラミングとは独立して存在する。
プログラミング的に必要な部分だけ取り出すと、モナドは次の3点セット。

### 1. 型コンストラクタ `M`

普通の型 `A` を「文脈付きの型」`M<A>` に持ち上げるもの。
`M` が何かでモナドの種類が決まる。

- `M = List` → リストモナド
- `M = Maybe` → 失敗（値が無いかも）の文脈
- `M = Either E` → 失敗（理由付き）の文脈

### 2. 2つの操作 `unit` と `bind`

```
unit : A          → M<A>          -- 普通の値を文脈に包む（return とも呼ぶ）
bind : M<A> → (A → M<B>) → M<B>   -- 包まれた値を取り出し→関数適用→また包む（>>= とも書く）
```

`bind` が本質。**「文脈を保ったまま」関数を繋ぐ** ための演算。

### 3. 3つのモナド則（これを満たして初めてモナド）

```
左単位則:  bind(unit(a), f)        ≡ f(a)
右単位則:  bind(m, unit)           ≡ m
結合則:    bind(bind(m, f), g)     ≡ bind(m, λx. bind(f(x), g))
```

ざっくり言うと「`unit` は余計なことをしない」「繋ぐ順序を変えても結果は同じ」。
この法則があるおかげで、合成しても破綻しないと数学的に保証される。

> ポイント: モナドは **特定のデータ構造ではなく「インターフェース＋法則」**。
> `Either` も `List` も `Promise` も、上の3点セットを満たせば等しく「モナド」。

---

## 第2部: プログラミングでの表現

数学の `M` / `unit` / `bind` が、実際のコードでどう現れるかを見ていく。

### Either / Result（モナドの代表選手）

「失敗の文脈」を持つモナド `M = Either E`。エラーを **例外（throw）ではなく値** として扱う。

```
Result = Ok(成功値) | Err(失敗値)     ← Rust の Result
Either = Right(成功) | Left(失敗)     ← Haskell/関数型の伝統的な名前。中身は同じ
```

数学との対応:

| 数学 | プログラミング |
| --- | --- |
| `unit(a)` | `Ok(a)` / `Right(a)` |
| `bind(m, f)` | `m.flatMap(f)` / `m.and_then(f)` |
| 文脈の保持 | Err になったら以降の `flatMap` は自動スキップされ、Err が末尾まで運ばれる |

この「Err なら以降スキップ」がモナド則（特に結合則）の恩恵そのもの。

### ROP（Railway Oriented Programming）

Scott Wlaschin が広めた **Either/Result の使い方を表す比喩・設計スタイル**。
新しい数学ではなく「Either モナドの実務での見せ方」。

```
入力 ──▶[ 検証 ]──▶[ 保存 ]──▶[ 通知 ]──▶ 成功
           │          │          │
           ▼          ▼          ▼
        ──────── 失敗レール ────────────▶ 失敗
```

- 成功レールと失敗レールの2本がある
- どこかで失敗すると失敗レールに乗り換え、**残りを飛ばして終点へ**
- この「乗り換え＆スキップ」の正体が `bind`（`flatMap`）

→ **ROP =「Either モナドで処理を直列に繋ぐ」を線路に例えた呼び名**。

### Effect（Either の上位互換）

Either は「成功 or 失敗」だけ。Effect はそこに **副作用・非同期・依存（DI）・リソース管理** まで型で乗せたモナド。Effect-TS が代表。

```
Either<Error, Value>                … 失敗だけ
Effect<Value, Error, Requirements>  … 失敗 + 必要な依存 + 実行効果
```

数学的にはこれも `unit` / `bind` / モナド則を満たす「ただのモナド」。
文脈に載せる情報が Either より多いだけ。**Either のスーパーセット** と思えばよい。

### dry-monads（Ruby 実装）

上記の概念を Ruby で使えるようにしたライブラリ。提供物がそのまま対応関係になっている。

| dry-monads | 概念 | 数学 |
| --- | --- | --- |
| `Success(x)` / `Failure(e)` | Result / Either | `M = Either` |
| `Some(x)` / `None` | Maybe / Option | `M = Maybe` |
| `bind { ... }` | flatMap | `bind` |
| `Do` notation (`yield`) | bind 連鎖の糖衣構文 | — |

```ruby
include Dry::Monads[:result]
include Dry::Monads::Do.mixin

def register(params)
  values = yield validate(params)   # Failure ならここで脱出
  user   = yield save(values)       # → Failure がそのまま返る
  yield notify(user)
  Success(user)
end
```

`yield`（Do記法）は **bind の連鎖を手続き的に書ける糖衣構文**。
Haskell の `do` 記法 / Rust の `?` 演算子と同じ役割で、「失敗したら以降スキップ」を読みやすく表現する。

---

## まとめ（1行で）

> 数学の **モナド**（型コンストラクタ + unit/bind + モナド則）という土台があり、
> その「失敗の文脈」版が **Either/Result**、それを線路に例えた実務スタイルが **ROP**、
> 副作用まで載せて拡張したのが **Effect**、そして Ruby でこれら一式を提供するのが **dry-monads**。

数学的には全部「同じモナドという1つの型」で、**文脈に何を載せるか・どの言語で書くか** が違うだけ。
