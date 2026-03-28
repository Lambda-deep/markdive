# ADR-0002: パッケージ名を markdive に変更し、`dive`/`read` の2コマンドに統合

**Status**: Accepted  
**Date**: 2026-03-28  
**Context**: `outline` と `inspect` の機能重複解消、およびAI向けメンタルモデルの明確化

## Context（背景）

従来のCLIは `outline`、`inspect`、`read` の3コマンド構成だったが、`outline` と `inspect` は本質的に同じ操作を別名で提供していた。

```
outline file.md --depth N   ≒ tree(root, depth=N)
inspect file.md --path X    ≒ tree(nodeX, depth=1)
```

また、利用主体をAIエージェントとした場合、ファイル探索の「モード」を明示的に切り替えられるサブコマンド方式の方が、推論時のメンタルモデルとプロンプト記述に一貫性がある。

## Decision（決定内容）

以下を採用する。

1. npmパッケージ名を `md-dive` から `markdive` に変更する。  
2. CLIコマンド名を `markdive` に変更する（`bin` 名を更新）。  
3. 構造探索コマンドは `dive` に統一し、`outline` と `inspect` は廃止する。  
4. 本文取得コマンドは `read` を維持する。  
5. 目標インターフェースを以下とする。

```bash
markdive dive file.md
markdive dive file.md --path 1.2
markdive dive file.md --path 1.2 --depth 3
markdive read file.md --path 1.2
```

## Rationale（理由）

- AIが操作意図を明示できる: `dive`（構造探索）と `read`（本文取得）の責務分離が明快。
- 機能重複を解消できる: `outline`/`inspect` を1コマンドに統合し、学習コストを下げられる。
- ブランド整合性が高い: 「Markdownに潜る」操作を `markdive dive` として一貫表現できる。
- 破壊的変更を受け入れやすい: 現時点では公開直後で宣伝もしていないため利用者影響がほぼ無い。

## Consequences（結果）

**Good（良い影響）**:

- CLIの責務が単純化され、ドキュメントとプロンプト記述が短くなる。
- AIエージェント向けに再現性の高い操作手順（`dive`→`read`）を提供できる。
- 新しいパッケージ名でブランドを再定義できる。

**Bad（悪い影響）**:

- 既存の `md-dive` 利用手順はそのままでは更新されない。
- リポジトリ名、README、公開情報、コマンド例の全面更新が必要。

**Mitigation（緩和策）**:

- 旧パッケージに deprecate メッセージを設定し、新パッケージ名へ誘導する。
- CHANGELOG と README の先頭に移行手順を明記する。

## 実装変更前チェックリスト（短縮版）

1. npm上の `markdive` 名称空き状況を再確認する。
2. npm公開権限（2FA含む）で新規公開可能な状態か確認する。
3. 変更対象を確定する（`package.json`, `src/cli.ts`, `README.md`, `CHANGELOG.md`, テスト）。
4. 旧名互換方針を決める（完全廃止 or 一時エイリアス）。
5. 公開手順を決める（`markdive` publish → `md-dive` deprecate）。

## Alternatives Considered（検討した代替案）

- `md-dive` のまま `ls`/`read` に統合: 実用性は高いが、名称再設計の意図を満たさない。
- `md-dive` のまま `outline --path` へ寄せる: 変更量は少ないが、重複概念の解消が不十分。
- サブコマンドを廃止し、`file + option` 方式へ統合: 単純だが、AI向けにモード切り替えが明示されない。

## Related（関連）

- ADR-0001: 軽量な自前Markdownパーサーの採用
