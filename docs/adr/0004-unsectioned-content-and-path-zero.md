# ADR-0004: 見出し未所属本文を文書レベルで保持し、予約パス 0 で公開する

**Status**: Accepted  
**Date**: 2026-04-11  
**Context**: Issue #13 「設計検討: 最初の見出し前テキスト（preamble）の扱い」および、CLI の操作思想を維持したまま見出し未所属本文を lossless に扱うための設計見直し

## Context（背景）

Markdown ファイルでは、最初の見出しより前に本文テキストが存在することがある。たとえば README 冒頭の説明文、バッジ直下の導入、見出しを持たない短文書などが該当する。

従来の `markdive` は見出し行を起点にセクションを構築するため、最初の見出し前にある本文をサイレントに破棄していた。見出しが一つも存在しない文書では、本文全体が `sections` に現れず、CLI からもアクセスできない。

一方で、本プロジェクトでは以下の設計思想を維持する必要がある。

- `dive` は探索可能な構造を提示し、`read` はその対象を読めること
- `Section` は見出しに対応する単位として意味を保つこと
- 0.x の間は breaking change を許容しつつ、外部仕様の一貫性を優先すること

このため、「見出し未所属本文を保持したい」という要件と、「`Section` の意味を壊したくない」という要件を両立する表現が必要になった。

## Decision（決定内容）

以下を採用する。

1. 文書全体の返り値型は `ParsedDocument` とし、旧 `ParseResult` から改名する。
2. 見出しに属さない本文は `ParsedDocument.unsectionedContent?: string` として文書レベルで保持する。
3. `ParsedDocument.sections` は従来どおり見出しセクションのみを保持し、仮想 level 0 section は内部モデルに追加しない。
4. CLI の外部仕様では `0` を予約パスとし、見出し未所属本文を指すものとして扱う。
5. `read --path 0` を正式サポートする。
6. `dive` のテキスト出力および JSON 出力でも、見出し未所属本文が存在する場合は `id: "0"` のノードとして可視化する。
7. `dive --json` の出力型は `DiveNodeJSON` とし、`kind` を持つ discriminated union で表現する。
8. `kind: "unsectioned"` のノードは `title` を持たない。
9. この変更は 0.x 系における breaking change として受け入れ、型定義、CLI、README、テストを一括更新する。

## Rationale（理由）

- **データロスを防げる**: 見出し前本文と見出しなし文書を lossless に保持できる。
- **`Section` の意味を維持できる**: `sections` に仮想 level 0 section を混ぜないため、「見出しに対応する単位」という定義を崩さない。
- **CLI の思想に合う**: `dive` で見えるものが `read` で読める、という一貫性を `path 0` で保てる。
- **ユーザー体験が直感的**: 見出し未所属本文を特別な内部表現ではなく、外部仕様として明示的にアクセスできる。
- **JSON 表現が明快**: `kind` 付き union にすることで、`section` ノードと `unsectioned` ノードを曖昧に混在させずに済む。
- **変更タイミングが適切**: まだ 0.x であり、仕様の整理と命名の見直しを同時に行いやすい。

## Consequences（結果）

**Good（良い影響）**:

- 見出し未所属本文を CLI と API の両方から参照できる。
- 見出しなし文書でも `markdive` の導線 (`dive` -> `read`) を維持できる。
- `ParsedDocument` / `unsectionedContent` / `DiveNodeJSON` という名前により、責務が読み取りやすくなる。
- `dive --json` でも `0` を含む一貫した構造を返せる。

**Bad（悪い影響）**:

- 既存の `ParseResult` / `SectionJSON` を参照するコードは更新が必要になる。
- `dive --json` の出力形状が変わるため、既存の利用者コードには breaking change になる。
- `0` という予約パスの意味を README とヘルプで明示しないと、初見では分かりにくい場合がある。

**Mitigation（緩和策）**:

- README とコマンド出力例を同時に更新し、`path 0` の意味と使用例を明記する。
- `DiveNodeJSON` を discriminated union にし、型レベルでノード種別の判定を容易にする。
- テストを一括更新し、`presection.md` と `noheadings.md` を代表ケースとして固定する。

## Alternatives Considered（検討した代替案）

### 案1: 現状維持して見出し前本文を破棄する

- **Pros**: 実装が最も単純。
- **Cons**: データロスが継続し、CLI からアクセス不能な本文が発生する。
- **判断**: lossless で扱う方針に反するため不採用。

### 案2: `preamble` を file-level metadata として追加する

- **Pros**: `frontMatter` と同様の file-level 情報として実装しやすい。
- **Cons**: 見出しなし文書では本文全体が「メタデータ風」に見えてしまい、責務が曖昧になる。
- **判断**: `unsectionedContent` の方が意味が正確なため不採用。

### 案3: `sections` に仮想 level 0 section を追加する

- **Pros**: `read 0` が直感的で、見た目は統一しやすい。
- **Cons**: `Section` が見出し単位であるという意味が崩れ、内部モデルが濁る。
- **判断**: 外部仕様としての `path 0` は採用するが、内部モデルへの混入は避ける。

### 案4: document root object に全面移行する

- **Pros**: 文書全体をひとつの木構造として表現でき、概念的には最も整っている。
- **Cons**: 現行 API と CLI の説明を大きく組み替える必要があり、今回の問題に対しては変更範囲が広い。
- **判断**: 将来の拡張候補として残しつつ、今回は `ParsedDocument + unsectionedContent + path 0` で解決する。

## Related（関連）

- [ADR-0001: 軽量な自前Markdownパーサーの採用](0001-use-custom-markdown-parser.md)
- [ADR-0002: パッケージ名を markdive に変更し、`dive`/`read` の2コマンドに統合](0002-cli-api-redesign.md)
- [ADR-0003: Agent Skill統合による構造的探索の標準化](0003-agent-skill-integration.md)
- Issue #13: 設計検討: 最初の見出し前テキスト（preamble）の扱い
