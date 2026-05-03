---
title: interfaceとGoとの比較
description: TypeScriptのinterfaceをGoのinterfaceと対比して理解する
---

## Goのinterface: 振る舞いで型を定義する

Goのinterfaceは **メソッドの集合** で定義される。ある型がinterfaceを満たすかどうかは、そのメソッドを実装しているかどうかで決まる。

```go
type error interface {
    Error() string
}
```

`Error() string` メソッドを持っていれば、それが何であろうとすべて `error` として扱える。明示的な宣言(`implements` など)は不要で、メソッドさえ持っていれば自動的にinterfaceを満たす(structural typing / duck typing)。

```go
type MyError struct {
    Code    int
    Message string
}

// Error() string を実装しているので、MyError は error を満たす
func (e *MyError) Error() string {
    return fmt.Sprintf("code %d: %s", e.Code, e.Message)
}
```

つまりGoのinterfaceは **「何ができるか(振る舞い)」** に着目している。

## TypeScriptのinterface: データの形で型を定義する

TypeScriptのinterfaceは **プロパティの集合** で定義されることが多く、 **「どんなデータを持っているか(形)」** に着目する。

```typescript
interface User {
  id: number;
  name: string;
  email: string;
}
```

Goと同じくstructural typingなので、`implements` の宣言は不要。プロパティの形が合っていれば代入できる。

```typescript
// User と宣言していないが、形が合っているので代入可能
const user: User = {
  id: 1,
  name: "Alice",
  email: "alice@example.com",
};
```

## 対比のまとめ

| | Go | TypeScript |
|---|---|---|
| interfaceの中身 | メソッドの集合 | プロパティ(+ メソッド)の集合 |
| 着目点 | 振る舞い（何ができるか） | データの形（何を持っているか） |
| 満たす条件 | 必要なメソッドを実装している | 必要なプロパティを持っている |
| 型の一致判定 | structural typing | structural typing |

## TypeScript特有の注意: Excess Property Check

TypeScriptのstructural typingには直感に反する挙動がある。**オブジェクトリテラルを直接渡す場合** と **一度変数に入れてから渡す場合** で型チェックの結果が変わる。

```typescript
interface User {
  id: number;
  name: string;
}

function greet(user: User) {
  console.log(`Hello, ${user.name}`);
}
```

### オブジェクトリテラルを直接渡す → エラー

```typescript
// コンパイルエラー: 'age' は User に存在しない
greet({ id: 1, name: "Alice", age: 25 });
```

### 一度変数に入れてから渡す → エラーにならない

```typescript
const data = { id: 1, name: "Alice", age: 25 };
greet(data); // OK: id と name を持っているので User として十分
```

### なぜこうなるか

TypeScriptでは **オブジェクトリテラルを直接渡したときだけ** Excess Property Check（余剰プロパティチェック）が働く。これはタイプミスや意図しないプロパティの混入を防ぐための仕組み。

一方、変数経由で渡す場合は通常のstructural typingが適用される。`data` は `id: number` と `name: string` を持っているので `User` の条件を満たしており、余分な `age` があっても問題ない。

Goにはこのような区別はない。interfaceのメソッドを満たしていれば、余分なメソッドがいくつあってもエラーにはならない。
