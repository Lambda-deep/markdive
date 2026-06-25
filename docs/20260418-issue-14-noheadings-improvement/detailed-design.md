# 見出しなし文書の操作改善 詳細設計

## 目的

見出しなし Markdown ファイルに対して `dive` と `read` が適切なフィードバックを返すようにする。
パーサー層は変更せず、コマンド層のみで対応する。

## 問題の詳細

### `read` — `--path` が必須でヘッダーなし文書を読めない

```
$ markdive read noheadings.md
error: required option '--path <id>' not specified
```

`--path 0` を指定すれば読めるが、初見のユーザーや AI エージェントには非直感的。

## 設計方針

パーサー (`ParsedDocument`) は PR #18 の成果をそのまま利用する。

## 変更仕様

### `dive` の変更

変更なし（現状維持）。
（※見出し0件時に特別な出力やラベルは追加しない。理由は「構造がないことは出力結果から十分に判断できるため」）

### `read` の変更

`ReadOptions.path` を `string | undefined` に変更する。

| `--path` | 動作 |
|---|---|
| 指定あり | 現状と同じ（path "0" も含む） |
| 省略 | ファイル全文を出力 |

**出力フォーマット（`--path` 省略時）:**

```
---
markdive:
  source: sample.md
  path: (full)
  context: (full document)
---

# Introduction

This is the intro.

## Background

...
```

- 見出しの有無にかかわらず、ファイル内容をヘッダー・コンテンツすべて再屎的に出力する
- `read --path` 指定時のセクション単位出力と同じ `printSection` を流用する
- フロントマターが存在する場合は `markdive:` ブロックの前に展開する（既存の `printMetadataHeader` ロジックと同様）

**エッジケース:**

| 状況 | 動作 |
|---|---|
| `sections` が空 かつ `unsectionedContent` が `undefined`（完全空ファイル） | メタデータヘッダーのみ出力、コンテンツ行なし |

### `cli.ts` の変更

```diff
- .requiredOption("--path <id>", '読み込むパスID（例: "0" または "2.1"）')
+ .option("--path <id>", '読み込むパスID（例: "0" または "2.1"）')
```

## テスト追加方針

`tests/commands.test.ts` に以下を追加する。

### `read` テスト

- `noheadings.md` に対して `--path` 省略時に全文が出力されること
- `noheadings.md` に対してメタデータヘッダーの `path: (full)` / `context: (full document)` が含まれること
- `sample.md`（見出しあり）に対して `--path` 省略時に見出しセクション全体が出力されること
- 完全空ファイルに対して `--path` 省略時にメタデータヘッダーのみ出力されること

## 関連ドキュメント

- [index.md](index.md)
- [PR #18 見出し未所属本文対応](../20260411-unsectioned-content-design/detailed-design.md)
- [ADR-0004](../adr/0004-unsectioned-content-and-path-zero.md)
