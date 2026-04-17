# AGENTS.md — markdive コーディングエージェント向けガイド

このファイルはエージェント（および人間の開発者）が本リポジトリで作業する際の
参照ドキュメントです。`.github/copilot-instructions.md` の内容を統合・拡充しています。

**このツールはnpmパッケージとして公開済みですが、まだバージョンが0.xであり、仕様の破壊的変更が可能です。**

---

## プロジェクト概要

**markdive** は大規模 Markdown ファイルを階層的にナビゲートするための TypeScript 製 CLI ツールです。
AIエージェントと人間の双方が大きな文書を効率よく閲覧することを目的としています。

### 設計思想

- **段階的開示（Progressive Disclosure）**: AIエージェントが必要な情報だけを段階的に取得できるようにする
- **構造的アドレッシング（Structured Addressing）**: 見出し階層とセクションID（`1.2.3`）を軸に現在地を追跡する
- **文脈保全（Context Preservation）**: 行単位の断片抽出ではなく、セクション単位で周辺文脈を保持して読む
- **軽量・可搬性（Lightweight & Portable）**: 重い依存（埋め込みモデルや検索基盤）を導入せず、CLI単体の再現性を優先する
- **役割分離（Separation of Concerns）**: 本ツールは読み取り・探索に特化し、編集責務は他ツールに委譲する

判断の背景とトレードオフは `docs/adr/0003-agent-skill-integration.md` を参照すること。

---

## ビルド・Lint・テストコマンド

```bash
# 依存関係インストール（初回のみ）
npm install

# TypeScript → CommonJS ビルド（出力先: dist/）
npm run build

# 型チェック（tsc --noEmit）+ Biome lint チェック
npm run lint

# コードフォーマット（Biome）
npm run format

# 全テスト実行
npm test

# 単一テストファイルを実行する
npx jest tests/parser.test.ts

# 特定の describe / test 名にマッチするテストだけ実行する（-t フラグ）
npx jest --testPathPattern="parser" -t "assigns correct IDs"

# ウォッチモードで開発しながらテスト
npx jest --watch
```

> **注意**: テストは `tests/` ディレクトリのみ対象（`tsconfig.json` では `tests/` を exclude しているため、
> テストファイルを `src/` 以下に置いてはいけません）。

---

## アーキテクチャ

### モジュール構成

| ファイル                  | 責務                                                              |
| ------------------------- | ----------------------------------------------------------------- |
| `src/types.ts`            | 共有 TypeScript 型定義（`Section`, `ParseResult`, `SectionJSON`）|
| `src/parser.ts`           | 解析ロジック（`parseMarkdown`, `findSection`, `buildBreadcrumb`） |
| `src/commands/dive.ts`    | `dive` コマンドの出力フォーマッタ（`outline`/`inspect` を統合）    |
| `src/commands/read.ts`    | `read` コマンドの出力フォーマッタ                                 |
| `src/cli.ts`              | Commander.js による CLI エントリーポイント                        |
| `src/index.ts`            | 公開 API の再エクスポート（ライブラリとして使う場合のエントリー） |
| `tests/`                  | Jest テスト（`tests/fixtures/` に `.md` フィクスチャを配置）      |

### パーサーパイプライン（4パス処理）

`src/parser.ts` の `parseMarkdown()` は以下の順で処理します:

1. **見出し収集** — 正規表現 `/^(#{1,6})\s+(.+)$/` でヘッダーと本文行を抽出
2. **階層ID割り当て** — カウンター配列で `"1.2.3"` 形式の ID を生成（深さリセットあり）
3. **サマリー抽出** — `<!-- summary: text -->` コメント優先、フォールバック = 最初の実質テキスト行（50文字）
4. **親子ツリー構築** — `Section` オブジェクトに双方向ポインタ（`parent` / `children`）を設定

**重要**: `Section.content` はそのセクション固有の本文のみを保持し、子セクションの内容は含みません。

---

## コードスタイルガイドライン

### TypeScript 設定

- **strict モード有効** (`"strict": true`) — `null` チェック・型安全を徹底する
- **ターゲット**: ES2020 / CommonJS モジュール
- **`any` 型は使用禁止** — 型が不明な場合は `unknown` を使い、適切に絞り込む
- 型推論が自明な場合は型注釈を省略してよいが、公開関数の引数・戻り値には必ず型注釈を付ける

### インポート

```typescript
// Node.js 標準モジュールは * as ... 形式でインポート
import * as fs from "fs";
import * as path from "path";

// 同プロジェクト内の型定義は named import
import { Section, ParseResult } from "../types";

// 外部ライブラリ
import { Command } from "commander";
```

- インポート順: 標準モジュール → 外部ライブラリ → 内部モジュール
- 相対パスを使用（`"../types"` など）。絶対パスエイリアスは使用しない

### 命名規則

| 対象               | 規則                           | 例                          |
| ------------------ | ------------------------------ | --------------------------- |
| 関数・変数         | camelCase                      | `parseMarkdown`, `rawSections` |
| インターフェース   | PascalCase（`I` プレフィックスなし） | `Section`, `ParseResult`  |
| 定数（モジュールスコープ） | UPPER_SNAKE_CASE          | `AUTO_SUMMARY_LENGTH`       |
| 型エイリアス       | PascalCase                     | `SectionJSON`               |
| ファイル名         | camelCase または kebab-case    | `parser.ts`, `dive.ts`      |
| CLIコマンド名      | kebab-case                     | `markdive dive`             |

### フォーマット

- **インデント**: スペース4文字
- **クォート**: ダブルクォート `"` を使用（テンプレートリテラルは必要な場合のみ）
- **セミコロン**: あり
- **末尾カンマ**: オブジェクト・配列の末尾要素に付ける
- 1行の長さに厳密な制限はないが、80〜100文字を目安に折り返す

### 関数・クラス設計

- **クラスは使用しない** — すべてのロジックは純粋関数として実装する
- ファイル内ユーティリティは `function` キーワードで宣言し、`export` しない
- 公開 API はすべて `src/index.ts` から再エクスポートする
- コマンド関数は `run<CommandName>(result: ParseResult, options: XxxOptions): void` の形式に統一

### コメント・ドキュメント

```typescript
/**
 * JSDoc スタイルで公開関数にドキュメントコメントを書く。
 *
 * @param filePath - 解析対象ファイルのパス
 * @returns ファイルパスとセクションツリーを含む ParseResult
 */
export function parseMarkdown(filePath: string): ParseResult { ... }

/** 短い説明は一行 JSDoc で書く。 */
const AUTO_SUMMARY_LENGTH = 50;
```

- セクション区切りには `// ---` ラインとセクション名コメントを使用する
- インラインコメントは処理の「なぜ」を説明する（「何をしているか」はコードから自明）

### エラーハンドリング

- セクションが見つからない場合: `console.error(...)` + `process.exit(1)`
- 孤立セクション（親見出しがスキップされた場合）: ルートセクションとして扱う
- 例外を `throw` するのは、回復不能なプログラムエラーの場合のみ
- CLI 層でエラーを捕捉して終了コードを制御する（コマンド実装関数は `process.exit` を直接呼んでよい）

---

## テストガイドライン

### 構成

- テストファイルは `tests/*.test.ts`（Jest パターン: `**/tests/**/*.test.ts`）
- フィクスチャ Markdown は `tests/fixtures/` に配置
- フレームワーク: Jest + ts-jest（TypeScript をトランスパイルなしで実行）

### テストの書き方

```typescript
// コンソール出力をキャプチャするヘルパーパターン（commands.test.ts 参照）
function captureConsole(): { lines: string[]; restore: () => void } {
  const lines: string[] = [];
  const orig = console.log.bind(console);
  console.log = (...args: unknown[]) => {
    lines.push(args.map(String).join(" "));
  };
  return { lines, restore: () => { console.log = orig; } };
}

// フィクスチャパスヘルパー
const fixturePath = (name: string) => path.join(__dirname, "fixtures", name);
```

- `describe` でテスト対象（関数名 + フィクスチャ名）をグループ化する
- `test` の説明は「何をすべきか」を英語で簡潔に書く
- テスト後は必ず `cap.restore()` で `console.log` を元に戻す
- 新しい Markdown パターンをテストする場合は `tests/fixtures/` に専用フィクスチャを追加する

---

## Markdown 入力の前提条件

- **ATX 形式のヘッダー**（`# Title` 構文）のみサポート。Setext 形式（`===` / `---` の下線）は非対応
- セクションは正しく入れ子になっている（親が子より先に現れる）
- `<!-- summary: テキスト -->` コメントは対応する見出しの直後に配置する
- **フェンスコードブロック** (` ``` `) 内のヘッダー記法は見出しとして検出されない（対応済み）
- **引用ブロック** (`>`) 内のヘッダー記法は見出しとして検出されない（対応済み）。ネストされた引用（`>>`, `>>>` 等）も同様に無視される。引用行の内容はセクションのコンテンツとして保持される
- **インデントコードブロック**（4スペース）内のヘッダー記法は誤検知する可能性がある（未対応）

---

## 新機能を追加する際のチェックリスト

1. `src/types.ts` に必要な型を追加する
2. コア処理は `src/parser.ts` のユーティリティ関数として実装する
3. CLIコマンドは `src/commands/<name>.ts` に `run<Name>` 関数として実装する
4. `src/cli.ts` に Commander.js コマンドを登録する
5. `src/index.ts` に公開 API を再エクスポートする
6. `tests/` にテストを追加し、必要なら `tests/fixtures/` にフィクスチャを追加する
7. `npm run lint` で型エラーがないことを確認する
8. `npm test` で全テストが通ることを確認する
9. `npm run build` でビルドが成功することを確認する

## ドキュメントについて
- ドキュメントは Markdown 形式で `docs/` ディレクトリに配置する。`YYYYMMDD-<title>/` のサブディレクトリを作成し、その中に `index.md` と関連ドキュメントを置くこと。
- プロジェクトのアーキテクチャに関する議論があった際にはADR（Architectural Decision Records）を `docs/adr/` に配置する。作成にあたってはSkill:`/architecture-decision-records`を利用すること。
