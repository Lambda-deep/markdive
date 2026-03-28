# md-dive

[![npm version](https://img.shields.io/npm/v/md-dive.svg)](https://www.npmjs.com/package/md-dive)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

大規模なMarkdownファイルを階層的・オンデマンドにナビゲートするためのCLIツールです。AIコーディングエージェントや開発者が、ファイル全体を一度に読み込むことなく、必要なセクションだけを効率的に参照できるよう設計されています。

## 背景・動機

多くのAIエージェントはファイルを丸ごと読み込むため、コンテキストウィンドウが無関係なコンテンツで埋まってしまいます。`md-dive` は、まず目次（構造）を把握してから必要な箇所だけを精読するという、人間らしいアプローチをCLIとして提供します。

### 設計思想

- **段階的開示（Progressive Disclosure）**: AIエージェントが必要な情報だけを段階的に取得できるようにする
- **コンテキストの節約（Context Saving）**: 不要な情報を表示せず、AIのコンテキストを節約する

## インストール

```bash
npm install -g md-dive
```

`npx` 経由での利用:

```bash
npx md-dive outline README.md
```

## コマンド

### `outline <file>`

ドキュメント全体の最初のN階層（デフォルト: 2）を構造化して出力します。

```bash
md-dive outline README.md
md-dive outline README.md --depth 3
md-dive outline README.md --json
```

**オプション:**

| オプション | デフォルト | 説明 |
|---|---|---|
| `--depth <n>` | `2` | 表示する見出しの最大深さ |
| `--json` | `false` | JSON形式で出力する |

**出力例（テキスト）:**

```
$ md-dive outline spec.md
1: Project Overview — High-level introduction to the project
  1.1: Getting Started — How to install and run
  1.2: Usage — Basic usage instructions.
2: API Reference — The complete API reference.
  2.1: Methods — List of available methods.
```

**出力例（`--depth 3`）:**

```
$ md-dive outline spec.md --depth 3
1: Project Overview — High-level introduction to the project
  1.1: Getting Started — How to install and run
    1.1.1: Installation — Run npm install to install dependencies.
    1.1.2: Configuration — Edit the config file as needed.
  1.2: Usage — Basic usage instructions.
    1.2.1: Basic Example — Here is a simple example.
    1.2.2: Advanced Example — Here is a more advanced example.
2: API Reference — The complete API reference.
  2.1: Methods — List of available methods.
    2.1.1: methodOne — Does something useful.
    2.1.2: methodTwo — Does something else.
```

**出力例（`--json`）:**

```json
$ md-dive outline spec.md --json
[
  {
    "id": "1",
    "level": 1,
    "title": "Project Overview",
    "summary": "High-level introduction to the project",
    "children": [
      { "id": "1.1", "level": 2, "title": "Getting Started", "summary": "How to install and run", "hasChildren": true, "children": [] },
      { "id": "1.2", "level": 2, "title": "Usage", "summary": "Basic usage instructions.", "hasChildren": false, "children": [] }
    ]
  },
  {
    "id": "2",
    "level": 1,
    "title": "API Reference",
    "summary": "The complete API reference.",
    "children": [
      { "id": "2.1", "level": 2, "title": "Methods", "summary": "List of available methods.", "hasChildren": false, "children": [] }
    ]
  }
]
```

### `inspect <file> --path <id>`

指定したIDのセクション直下のサブセクション一覧を表示します。

```bash
md-dive inspect README.md --path "2"
md-dive inspect README.md --path "1.3" --json
```

**オプション:**

| オプション | デフォルト | 説明 |
|---|---|---|
| `--path <id>` | *(必須)* | 参照するセクションID（例: `"2"` または `"1.3"`） |
| `--json` | `false` | JSON形式で出力する |

**出力例（テキスト）:**

```
$ md-dive inspect spec.md --path "1"
1: Project Overview
  1.1: Getting Started — How to install and run
  1.2: Usage — Basic usage instructions.
```

**出力例（`--json`）:**

```json
$ md-dive inspect spec.md --path "1" --json
{
  "id": "1",
  "level": 1,
  "title": "Project Overview",
  "summary": "High-level introduction to the project",
  "children": [
    {
      "id": "1.1",
      "level": 2,
      "title": "Getting Started",
      "summary": "How to install and run",
      "hasChildren": true,
      "children": []
    },
    {
      "id": "1.2",
      "level": 2,
      "title": "Usage",
      "summary": "Basic usage instructions.",
      "hasChildren": false,
      "children": []
    }
  ]
}
```

### `read <file> --path <id>`

指定したIDのセクションとその子孫セクションすべての本文を、ソースファイル名・セクションパス・パンくずリストを含むメタデータヘッダーとともに出力します。

```bash
md-dive read README.md --path "2.1"
```

**オプション:**

| オプション | デフォルト | 説明 |
|---|---|---|
| `--path <id>` | *(必須)* | 読み込むセクションID（例: `"2.1"`） |

**出力形式:**

```
---
md-dive:
  source: README.md
  path: 2.1
  context: 第2章 > セクション2.1
---

## セクション2.1

セクションの本文...

### サブセクション2.1.1

サブセクションの本文...
```

## セクションID

各見出しには、ドキュメント内での位置に基づいて階層IDが自動付与されます。

| 見出し | ID |
|---|---|
| `# はじめに`（1つ目の`#`） | `1` |
| `## セットアップ`（`#1` 直下の1つ目の`##`） | `1.1` |
| `### インストール`（`1.1` 直下の1つ目の`###`） | `1.1.1` |
| `# 使い方`（2つ目の`#`） | `2` |

## サマリー

見出しの直後にHTMLコメントを記述することで、そのセクションのサマリーを設定できます。

```markdown
## セットアップ
<!-- summary: ツールのインストールと設定方法 -->

インストール手順はこちら...
```

コメントがない場合は、セクション本文の先頭50文字程度が自動的にサマリーとして使用されます。

## AIエージェントの典型的な利用フロー

```bash
# 1. ドキュメント全体の概要を把握する
md-dive outline large-spec.md --json

# 2. 関心のある章をさらに掘り下げる
md-dive inspect large-spec.md --path "3" --json

# 3. 必要なセクションだけを読み込む
md-dive read large-spec.md --path "3.2"
```

## 開発

```bash
npm install
npm run build   # TypeScriptをコンパイル
npm test        # Jestテストを実行
npm run lint    # 型チェックのみ（出力なし）
```

## 動作要件

- Node.js 18以上

## ライセンス

[MIT](LICENSE) © 2026 Lambda-deep
