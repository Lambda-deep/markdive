# 見出し未所属本文対応 設計ドキュメント

## 概要

このディレクトリは、見出しに属さない Markdown 本文を `markdive` で lossless に扱うための具体設計をまとめたものです。

対象は以下です。

- 文書モデルの更新
- `dive` / `read` の CLI 仕様更新
- JSON 出力型の更新
- テスト、README、公開 API の更新方針

方針の意思決定そのものは [ADR-0004](../adr/0004-unsectioned-content-and-path-zero.md) に記録しています。本ドキュメントは、その ADR を実装可能な粒度に分解した詳細設計です。

## 目次

- [詳細設計](detailed-design.md)

## 設計サマリー

今回の設計で採用する中心方針は次のとおりです。

1. 文書全体の返り値型を `ParsedDocument` に改名する。
2. 見出しに属さない本文は `unsectionedContent?: string` で保持する。
3. `sections` は見出しセクションだけを持ち、仮想 level 0 section は内部に追加しない。
4. CLI 外部仕様では `0` を予約パスとして公開する。
5. `dive --json` は `DiveNodeJSON` の kind 付き union を返す。

## スコープ

含むもの:

- 型定義の改名と拡張
- パーサーの未所属本文抽出
- `dive` / `read` 出力の仕様更新
- テストケースと README の更新方針

含まないもの:

- document root object への全面移行
- `Section` 自体の意味変更
- 構文解析アルゴリズム全体の刷新

## 関連ドキュメント

- [ADR-0004](../adr/0004-unsectioned-content-and-path-zero.md)
- [ADR-0002](../adr/0002-cli-api-redesign.md)
- [ADR-0003](../adr/0003-agent-skill-integration.md)
