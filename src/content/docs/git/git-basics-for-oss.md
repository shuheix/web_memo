---
title: OSS 向けの Git 基礎
description: 初めての OSS PR (rubocop/rubocop#15164) で使った Git 操作のまとめ
---

初めて OSS に PR を出した([rubocop/rubocop#15164](https://github.com/rubocop/rubocop/pull/15164))。そのときに使った Git 操作を、自分用に整理しておく。

先に一番効くポイントだけ書いておくと、

- `origin` は自分の fork、`upstream` は本家
- `fetch` は取ってくるだけ
- `rebase` は本家の最新の上に自分の変更を載せ直す
- `--force-with-lease` は安全寄りの強制 push

の 4 つを押さえておけば、普通の PR は十分回せる。

## remote: origin と upstream

`git remote -v` は「このローカル repo がどの GitHub repo とつながっているか」を見るコマンド。

OSS で fork して PR を出すときは、だいたい次の役割分担になる。

| remote 名 | 指す先 | 用途 |
| --- | --- | --- |
| `origin` | 自分の fork | 自分の branch を push する先 |
| `upstream` | 本家 repo | 本家の最新を取り込む元 |

clone した直後だと `origin` しか登録されていないので、本家を `upstream` として追加する。

```bash
git remote add upstream https://github.com/rubocop/rubocop.git
git remote -v
```

これをしておくと、本家の更新を安全に追える。

## fetch と pull の違い

`git fetch` は「リモートの最新情報を取ってくるだけ」のコマンド。作業中のファイルや branch には直接手を入れない。

```bash
git fetch upstream
```

一方 `git pull` は、ざっくり言うと、

```bash
git fetch
git merge
```

または設定次第で、

```bash
git fetch
git rebase
```

までやる。つまり、取得した内容を今の branch に反映するところまで進める。

OSS 作業では、勝手に merge commit ができるのを避けたいので、慣れるまでは、

```bash
git fetch upstream
git rebase upstream/master
```

のように 2 段階で明示する方が分かりやすかった。

## rebase: 本家の最新に載せ直す

`git rebase upstream/master` は、自分の変更を本家最新の `master` の上に載せ直す操作。

```
本家 master:  A -- B -- C
自分 branch:  A -- B -- my-change

rebase 後:
本家 master:  A -- B -- C
自分 branch:  A -- B -- C -- my-change
```

PR では履歴をきれいに保ちたいので、`merge` でなく `rebase` がよく使われる。merge commit が混ざらず、レビュアーから見て「本家の最新に対する純粋な差分」になる。

## push -u: upstream tracking

最初の push で使ったのがこれ。

```bash
git push -u origin fix/suggest-extensions-broken-link
```

`-u` は upstream tracking の設定。以後その branch では、

```bash
git push
git pull
```

だけで `origin/fix/suggest-extensions-broken-link` とやり取りできる。

## reset --soft: 直前 commit を作り直す

commit message を直したい、commit を作り直したい、PR 前に整理したいときに使ったのがこれ。

```bash
git reset --soft HEAD^
```

「直前の commit だけ取り消す。ただし変更内容は staged のまま残す」という意味になる。

似たコマンドとの違いをまとめると、

| コマンド | commit | staged | working tree |
| --- | --- | --- | --- |
| `reset --soft HEAD^` | 取り消し | 残る | 残る |
| `reset --mixed HEAD^` | 取り消し | 戻す | 残る |
| `reset --hard HEAD^` | 取り消し | 消える | 消える |

`--hard` は commit も作業内容も消える。慣れるまでは使わない方が安全。

## commit --amend: 直前 commit に混ぜ込む

レビュー対応で commit を増やしたくないときに使う。

```bash
git commit --amend --no-edit
```

直前の commit に、今 staged にある変更を混ぜ込む。`--no-edit` は commit message を変えない指定。

PR に小さい修正を追加するときに、commit を増やさず 1 つに保てる。

## force-with-lease: 安全寄りの強制 push

`amend` や `rebase` をすると commit hash が変わるので、普通の `git push` では拒否される。

そのときに使うのがこれ。

```bash
git push --force-with-lease
```

「リモートが自分の知っている状態から変わっていなければ上書きする」という挙動になる。つまり、自分が最後に fetch した時点から誰かが先に push していたら、上書きを止めてくれる。

`--force` よりも安全なので、PR branch では基本こちらを使う。

## やってはいけないこと

特に注意するのはこのあたり。

```bash
git reset --hard
git checkout -- .
git clean -fd
git push --force
```

- `reset --hard` は未保存の変更を消す
- `checkout -- .` も作業ツリーの変更を消す
- `clean -fd` は未追跡ファイルを消す
- `push --force` はリモート branch を強制上書きする

使うなら、何が消えるかを確認してから。PR branch では `--force` ではなく `--force-with-lease` を使うのが基本。

## 今回の流れ

最後に、今回の rubocop PR で実際にやった流れを時系列で残しておく。

```bash
# 1. 本家の最新を取得
git fetch upstream

# 2. 作業 branch を作成
git checkout -b fix/suggest-extensions-broken-link

# 3. 変更を commit
git add ...
git commit ...

# 4. 自分の fork に push
git push -u origin fix/suggest-extensions-broken-link

# 5. レビュー対応を 1 commit にまとめて PR を更新
git commit --amend --no-edit
git push --force-with-lease
```

これだけで PR は出せた。覚えておくと一番効くのは、冒頭にも書いた 4 点

- `origin` は自分の fork、`upstream` は本家
- `fetch` は取ってくるだけ
- `rebase` は載せ直し
- `--force-with-lease` は安全寄りの上書き

に尽きる。
