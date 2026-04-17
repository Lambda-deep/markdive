# 見出し未所属本文対応 詳細設計

## 目的

見出し未所属本文を破棄せず保持し、`markdive` の基本導線である `dive -> read` から一貫してアクセス可能にする。

今回の設計では、次の 2 つを同時に満たすことを目的とする。

1. `Section` は見出しに対応する単位として意味を維持する。
2. 見出し未所属本文は CLI と JSON の両方で探索可能にする。

## 背景と問題

現行実装では `parseMarkdown()` が見出し行を起点にセクションを構築するため、最初の見出し前の本文はどのセクションにも属さず破棄される。

この影響は次の 2 ケースで顕著に表れる。

1. README 先頭の導入文やバッジ下の説明文が失われる。
2. 見出しを持たない短い Markdown 文書が `dive` / `read` から参照不能になる。

## 採用方針

### 内部モデル

- 文書全体の返り値型は `ParsedDocument` とする。
- `ParsedDocument.sections` は従来どおりトップレベル見出しセクションのみを保持する。
- `ParsedDocument.unsectionedContent?: string` に、どの見出しにも属さない本文を保持する。
- 仮想 section は内部に追加しない。

### 外部仕様

- `0` を見出し未所属本文に対応する予約パスとする。
- `read --path 0` を正式サポートする。
- `dive` では、`unsectionedContent` が存在する場合に `id: "0"` のノードを表示する。
- `dive --json` では `DiveNodeJSON` の配列を返し、`kind: "unsectioned"` ノードを含める。

## 型設計

### ParsedDocument

```ts
export interface ParsedDocument {
    filePath: string;
    sections: Section[];
    frontMatter?: FrontMatter;
    unsectionedContent?: string;
}
```

設計意図:

- `filePath` と `frontMatter` を含むため、返り値は単なる「解析途中の結果」ではなく文書モデルである。
- `unsectionedContent` はメタデータではなく本文なので、`frontMatter` と別フィールドに分離する。
- `sections` を見出しセクション専用に保つことで、既存の木構造操作を維持する。

### DiveNodeJSON

```ts
export type DiveNodeJSON = SectionDiveNodeJSON | UnsectionedDiveNodeJSON;

export interface SectionDiveNodeJSON {
    kind: "section";
    id: string;
    level: number;
    title: string;
    summary: string;
    hasChildren: boolean;
    children: DiveNodeJSON[];
}

export interface UnsectionedDiveNodeJSON {
    kind: "unsectioned";
    id: "0";
    summary: string;
}
```

設計意図:

- `kind` によって JSON 利用側が分岐しやすくなる。
- `unsectioned` ノードに `title` を持たせず、見出しセクションとの意味差を残す。
- `children` は `section` ノードにのみ存在させ、未所属本文を木構造上の擬似セクションとして扱わない。

## パーサー設計

### 抽出範囲

`unsectionedContent` は次の範囲を対象とする。

- 開始位置: front matter の直後、またはファイル先頭
- 終了位置: 最初の見出し行の直前

見出しが一つも存在しない場合は、本文全体を `unsectionedContent` とする。

### 正規化ルール

- `buildContent()` と同等の trim ルールを適用し、先頭末尾の空行を除去する。
- 空文字列になった場合は `undefined` として扱う。
- front matter の行は含めない。
- サマリーコメント専用の除去は行わない。未所属本文ではコメントも本文の一部として保持する。

### サマリー生成

`dive` で表示する `id: "0"` の summary は、`Section.summary` と同じ自動要約ロジックを再利用する。

ただし、`unsectionedContent` は title を持たないため、summary のみを表示に用いる。

## CLI 設計

### dive のテキスト出力

`unsectionedContent` が存在する場合、front matter の直後、トップレベルセクションより前に `0` の行を表示する。

出力例:

```text
0: This text appears before any heading.
1: First Section — Content of first section.
```

表示方針:

- `0` に title は付けない。
- summary のみを表示する。
- `0` は level を持たないため、インデントは付けない。

### dive --path 0

`--path 0` は、見出し未所属本文だけを対象とする。

テキスト出力例:

```text
0: This text appears before any heading.
```

JSON 出力例:

```json
{
  "kind": "unsectioned",
  "id": "0",
  "summary": "This text appears before any heading."
}
```

`unsectionedContent` が存在しない場合は not found エラーとする。

### dive --json

ルート出力では、`unsectionedContent` が存在する場合に先頭へ `kind: "unsectioned"` ノードを追加する。

出力例:

```json
[
  {
    "kind": "unsectioned",
    "id": "0",
    "summary": "This text appears before any heading."
  },
  {
    "kind": "section",
    "id": "1",
    "level": 1,
    "title": "First Section",
    "summary": "Content of first section.",
    "hasChildren": false,
    "children": []
  }
]
```

### read --path 0

`read --path 0` は `unsectionedContent` の全文を出力する。

出力例:

```text
---
markdive:
  source: presection.md
  path: 0
  context: unsectioned
---

This text appears before any heading.
It should not be included in any section.
```

設計上の注意:

- `context` はパンくずではなく固定値 `unsectioned` とする。
- 見出し再構成は行わない。
- front matter が存在する場合は、現行 `read` と同様にヘッダーへ併記する。

## 実装変更点

### 型定義

対象:

- `src/types.ts`
- `src/index.ts`

変更内容:

- `ParseResult` を `ParsedDocument` に改名する。
- `SectionJSON` を `DiveNodeJSON` とその構成型へ置き換える。
- `index.ts` の再エクスポートを更新する。

### パーサー

対象:

- `src/parser.ts`

変更内容:

- front matter 終端から最初の見出し直前までを抽出する。
- `unsectionedContent` を組み立てて `ParsedDocument` に含める。
- `findSection()` は `0` を扱わず、従来どおり section のみを探索する。
- `0` の解決は CLI 層で行う。

### コマンド

対象:

- `src/commands/dive.ts`
- `src/commands/read.ts`

変更内容:

- `dive` に `0` 用のテキスト表示と JSON 生成を追加する。
- `read` に `path 0` の特例処理を追加する。
- not found 判定は section と unsectioned で分けて扱う。

## テスト設計

### parser.test.ts

更新する期待値:

- `presection.md`
  - `sections[0].content` に先頭本文が混ざらないこと
  - `unsectionedContent` に先頭本文が入ること
- `noheadings.md`
  - `sections` が空であること
  - `unsectionedContent` に全文が入ること
- `frontmatter.md`
  - `frontMatter` と `unsectionedContent` が混ざらないこと

### commands.test.ts

追加または更新する期待値:

- `dive` テキスト出力で `0:` 行が表示されること
- `dive --json` に `kind: "unsectioned"` ノードが含まれること
- `dive --path 0` が単独ノードを返すこと
- `read --path 0` が本文をそのまま出力すること
- `unsectionedContent` がない文書で `path 0` がエラーになること

## README 更新方針

README では次を更新する。

1. `dive --json` の型と例
2. `read --path 0` の例
3. `0` が見出し未所属本文を指すことの説明
4. `ParsedDocument` / `DiveNodeJSON` を利用するライブラリ API の記述

## breaking change の扱い

今回の変更は以下の点で breaking change になる。

- TypeScript 公開型名の変更
- `dive --json` の出力 shape の変更
- `0` という新しい予約パスの導入

ただし本プロジェクトは 0.x 系であり、CLI の思想と API の意味を揃える利益の方を優先する。

## 実装順序

1. `src/types.ts` と `src/index.ts` の型更新
2. `src/parser.ts` で `unsectionedContent` を抽出
3. `src/commands/read.ts` で `path 0` を実装
4. `src/commands/dive.ts` で `0` のテキスト表示と JSON 出力を実装
5. `tests/` の期待値更新
6. README 更新

## 非目標

今回の設計では次は扱わない。

- document root object 化
- 見出しなし本文への独自 title 付与
- `Section` に `kind` を導入すること
- `findSection()` を `0` 対応に拡張すること
