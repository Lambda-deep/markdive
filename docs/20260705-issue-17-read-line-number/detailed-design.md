# 詳細設計: read のソース行番号表示

## 1. 要件

1. `read` に `--number`（`-n`）を追加する。
2. `--number` 指定時は、元Markdownファイルの1-based行番号を表示する。
3. 番号はソース本文行にのみ付与し、メタデータヘッダー（`---`, `markdive:` 等）は非番号とする。
4. `--number` 未指定時は既存挙動を維持する。

## 2. 出力仕様

### 2.1 番号フォーマット

- `cat -n` 風に右寄せ固定幅で表示する。
- 幅は表示対象範囲の最大行番号桁数に合わせる（例: 最大999行なら幅3）。
- 区切りはタブまたは等価の固定区切りを用いる。

出力イメージ:

```text
---
markdive:
  source: spec.md
  path: 2.1
  context: API Reference > Methods
---

 42 ## Methods
 43 
 44 GET /users
```

### 2.2 `--path` ごとの対象範囲

- `--path <id>`（通常セクション）:
  - 対象セクション見出し行から、子孫セクションを含むセクション終端行までを出力する。
- `--path 0`（未所属本文）:
  - 最初の見出しより前の未所属本文範囲を出力する。
- `--path` 省略（全文）:
  - front matter 終端の次行（本文開始）からEOFまでを出力する。

## 3. データモデル変更

### 3.1 `Section` への追加

- `startLine: number`（1-based, inclusive）
- `endLine: number`（1-based, inclusive）

### 3.2 `ParsedDocument` への追加

- `contentStartLine: number`（front matter 後の本文開始行。front matter 無しなら1）
- `unsectionedStartLine?: number`（未所属本文が存在する場合のみ）
- `unsectionedEndLine?: number`（未所属本文が存在する場合のみ）

## 4. パーサー実装方針

1. 既存 `RawSection.lineStart`（0-based）を `startLine = lineStart + 1` として公開値に変換。
2. 既存 `RawSection.lineEnd` は exclusive なので、`endLine = lineEnd`（1-based inclusive相当）に変換。
3. `contentStartLine` は front matter がある場合は閉じ区切り行の次行、無い場合は1。
4. `unsectionedContent` が存在する場合に、`unsectionedStartLine` / `unsectionedEndLine` を設定。

## 5. `read` 実装方針

1. `ReadOptions` に `number?: boolean` を追加。
2. `number` が `false`/未指定の場合は既存ロジックを維持。
3. `number` が `true` の場合:
   - 元ファイルを行配列として読み込み
   - `path` に応じて `[startLine, endLine]` を決定
   - 対象行を `lineNo + separator + line` で出力
4. メタデータヘッダーは共通ロジックで非番号のまま出力。

## 6. CLI変更

- `read <file>` に `.option("-n, --number", "元ファイルの行番号を表示する", false)` を追加。
- `runRead(result, { path: options.path, number: options.number })` を渡す。

## 7. テスト計画

### 7.1 `tests/commands.test.ts`

- `runRead(result, { path: "1.1.1", number: true })`:
  - 既知の見出し行番号が付与されること
- `runRead(result, { path: "0", number: true })`:
  - 未所属本文の行番号が正しいこと
- `runRead(result, { number: true })`:
  - 本文開始行からEOFまで連続番号であること
- 既存の `number` 未指定テストが維持されること

### 7.2 `tests/parser.test.ts`

- `sample.md` の特定セクション `startLine/endLine` を固定値検証
- `presection.md` の `unsectionedStartLine/unsectionedEndLine` を検証
- `frontmatter.md` の `contentStartLine` を検証

## 8. 互換性とリスク

- `read` の既定出力は非変更のため、既存ユーザー影響は限定的。
- 公開型（`Section` / `ParsedDocument`）へのフィールド追加は0.x方針で許容。
- 行番号仕様変更が将来必要な場合は、`--number=source|output` のような拡張余地を残す。

## 9. 検証コマンド

```bash
npx jest tests/parser.test.ts tests/commands.test.ts
npm test
npm run lint
npm run build
```
