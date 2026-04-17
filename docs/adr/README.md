# Architecture Decision Records

このディレクトリには、markdive プロジェクトのアーキテクチャ決定記録（ADR）が格納されています。

## インデックス

| ADR | タイトル | ステータス | 日付 |
|-----|---------|-----------|------|
| [0001](0001-use-custom-markdown-parser.md) | 軽量な自前Markdownパーサーの採用 | Accepted | 2026-03-28 |
| [0002](0002-cli-api-redesign.md) | パッケージ名を markdive に変更し、dive/read の2コマンドに統合 | Accepted | 2026-03-28 |
| [0003](0003-agent-skill-integration.md) | Agent Skill統合による構造的探索の標準化 | Accepted | 2026-03-29 |
| [0004](0004-unsectioned-content-and-path-zero.md) | 見出し未所属本文を文書レベルで保持し、予約パス 0 で公開する | Accepted | 2026-04-11 |

## 新しいADRの作成方法

1. `template.md` を `NNNN-title-with-dashes.md` としてコピー
2. テンプレートを埋める
3. PRを提出してレビュー
4. 承認後、このインデックスを更新

## ADRステータス

- **Proposed**: 議論中
- **Accepted**: 決定済み、実装中
- **Deprecated**: もはや関連性がない
- **Superseded**: 別のADRに置き換えられた
- **Rejected**: 検討されたが採用されなかった
