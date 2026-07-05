# read 行番号出力対応 設計ドキュメント

## 概要

このディレクトリは、`markdive read` の出力に元Markdownファイルの行番号を付与する機能（Issue [#17](https://github.com/Lambda-deep/markdive/issues/17)）の設計をまとめたものです。

編集ツールで再取得・再参照する際に、出力テキストと元ファイルの対応を取りやすくすることを目的とします。

## 方針

- `read` に明示オプション `--number`（短縮 `-n`）を追加する
- 行番号は「出力行番号」ではなく「元Markdownファイルの正確な行番号（1-based）」を表示する
- 番号対象はソース由来の本文行のみとし、メタデータヘッダーは従来どおり非番号で出力する
- `--number` 未指定時の既存出力は変更しない

## 目次

- [詳細設計](detailed-design.md)

## スコープ

含むもの:

- `read` コマンドのCLIオプション追加（`--number` / `-n`）
- `read` テキスト出力の行番号表示
- 行番号算出に必要なパース結果メタデータの拡張
- テスト・README更新

含まないもの:

- `dive` の表示仕様変更
- JSON出力の仕様変更
- 行番号表示のデフォルト有効化

## 変更対象ファイル

| ファイル | 変更概要 |
|---|---|
| `src/types.ts` | `Section` / `ParsedDocument` に行位置メタデータを追加 |
| `src/parser.ts` | セクション・未所属本文・本文開始位置の行番号を算出 |
| `src/commands/read.ts` | `--number` 指定時の番号付き出力経路を追加 |
| `src/cli.ts` | `read` サブコマンドに `--number, -n` を追加 |
| `tests/commands.test.ts` | `runRead` の番号付き出力テスト追加 |
| `tests/parser.test.ts` | 行位置メタデータの検証追加 |
| `README.md` | `read` セクションにオプション・使用例・出力例を追記 |

## 関連ドキュメント

- [見出し未所属本文対応 設計ドキュメント](../20260411-unsectioned-content-design/index.md)
- [見出しなし文書の操作改善 設計ドキュメント](../20260418-issue-14-noheadings-improvement/index.md)
- [ADR-0004](../adr/0004-unsectioned-content-and-path-zero.md)
