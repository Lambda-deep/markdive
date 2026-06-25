# 見出しなし文書の操作改善 設計ドキュメント

## 概要

このディレクトリは、見出し（ATX ヘッダー）が存在しない Markdown ファイルを `markdive` で操作した際の
ユーザー体験を改善するための設計をまとめたものです。

関連 Issue: [#14](https://github.com/Lambda-deep/markdive/issues/14)

## 背景

[#13](https://github.com/Lambda-deep/markdive/issues/13) / PR #18 の対応により、
見出しなし文書の全文が `ParsedDocument.unsectionedContent` に格納されるようになった。
しかし CLI レイヤーはこの変化を完全には活かしておらず、以下の問題が残っていた。

1. `dive noheadings.md` 実行時、構造がない（見出し 0 件）かどうかが出力から読み取りにくい（※本対応では dive 側は現状維持とし、特別な出力は追加しない）
2. `read` コマンドは `--path` が必須なため、見出しなし文書に対して使用できない

本対応はパーサーへの変更を一切加えず、コマンド層のみで両問題を解決する。

## 対象改善

- [詳細設計](detailed-design.md)

## 変更ファイル一覧

| ファイル | 変更概要 |
|---|---|
| `src/commands/read.ts` | `ReadOptions.path` を optional に変更、`--path` 省略時は常に全文出力 |
| `src/cli.ts` | `requiredOption` → `option` に変更 |
| `tests/commands.test.ts` | `noheadings.md`・`sample.md` に対する `read` のテストケース追加 |

## 関連ドキュメント

- [#13 見出し未所属本文対応 設計ドキュメント](../20260411-unsectioned-content-design/index.md)
- [ADR-0004](../adr/0004-unsectioned-content-and-path-zero.md)
