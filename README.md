# markdive

[![npm version](https://img.shields.io/npm/v/markdive.svg)](https://www.npmjs.com/package/markdive)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

大規模なMarkdownファイルを階層的・オンデマンドに探索するためのCLIツールです。
AIコーディングエージェントや開発者が、ファイル全体を一度に読み込まず、必要なセクションだけを効率よく参照できます。

## 設計思想

- **段階的開示（Progressive Disclosure）**: まず構造を把握し、必要な箇所だけ掘り下げる
- **コンテキストの節約（Context Saving）**: 不要な情報を表示せず、トークン消費を抑える

## インストール

```bash
npm install -g markdive
```

`npx` 経由:

```bash
npx markdive dive README.md
```

## コマンド

### `dive <file>`

ドキュメント構造を段階的に探索します。

```bash
# ルートから depth=2（デフォルト）
markdive dive README.md

# ルートから depth=3
markdive dive README.md --depth 3

# セクション 1.2 から探索（相対 depth）
markdive dive README.md --path 1.2 --depth 2

# JSON出力
markdive dive README.md --json
markdive dive README.md --path 1 --depth 1 --json
```

**オプション:**

| オプション | デフォルト | 説明 |
|---|---|---|
| `--depth <n>` | `2` | 探索する深さ |
| `--path <id>` | なし | 探索起点のセクションID |
| `--json` | `false` | JSON形式で出力する |

`--path` を指定した場合、`--depth` は「起点からの相対深さ」として扱われます。

**出力例（テキスト）:**

```
$ markdive dive spec.md
1: Project Overview — High-level introduction to the project
  1.1: Getting Started — How to install and run
  1.2: Usage — Basic usage instructions.
2: API Reference — The complete API reference.
  2.1: Methods — List of available methods.
```

**出力例（`--path 1`）:**

```
$ markdive dive spec.md --path 1
1: Project Overview — High-level introduction to the project
  1.1: Getting Started — How to install and run
    1.1.1: Installation — Run npm install to install dependencies.
    1.1.2: Configuration — Edit the config file as needed.
  1.2: Usage — Basic usage instructions.
    1.2.1: Basic Example — Here is a simple example.
    1.2.2: Advanced Example — Here is a more advanced example.
```

**出力例（`--json`）:**

```json
$ markdive dive spec.md --json
[
  {
    "id": "1",
    "level": 1,
    "title": "Project Overview",
    "summary": "High-level introduction to the project",
    "hasChildren": true,
    "children": [
      { "id": "1.1", "level": 2, "title": "Getting Started", "summary": "How to install and run", "hasChildren": true, "children": [] },
      { "id": "1.2", "level": 2, "title": "Usage", "summary": "Basic usage instructions.", "hasChildren": true, "children": [] }
    ]
  },
  {
    "id": "2",
    "level": 1,
    "title": "API Reference",
    "summary": "The complete API reference.",
    "hasChildren": true,
    "children": [
      { "id": "2.1", "level": 2, "title": "Methods", "summary": "List of available methods.", "hasChildren": true, "children": [] }
    ]
  }
]
```

**出力例（`--path 1 --json`）:**

```json
$ markdive dive spec.md --path 1 --json
{
  "id": "1",
  "level": 1,
  "title": "Project Overview",
  "summary": "High-level introduction to the project",
  "hasChildren": true,
  "children": [
    {
      "id": "1.1",
      "level": 2,
      "title": "Getting Started",
      "summary": "How to install and run",
      "hasChildren": true,
      "children": [
        { "id": "1.1.1", "level": 3, "title": "Installation", "summary": "Run npm install to install dependencies.", "hasChildren": false, "children": [] },
        { "id": "1.1.2", "level": 3, "title": "Configuration", "summary": "Edit the config file as needed.", "hasChildren": false, "children": [] }
      ]
    },
    {
      "id": "1.2",
      "level": 2,
      "title": "Usage",
      "summary": "Basic usage instructions.",
      "hasChildren": true,
      "children": [
        { "id": "1.2.1", "level": 3, "title": "Basic Example", "summary": "Here is a simple example.", "hasChildren": false, "children": [] },
        { "id": "1.2.2", "level": 3, "title": "Advanced Example", "summary": "Here is a more advanced example.", "hasChildren": false, "children": [] }
      ]
    }
  ]
}
```

### `read <file> --path <id>`

指定セクションとその子孫セクションの本文を、メタデータヘッダー付きで出力します。

```bash
markdive read README.md --path 2.1
```

**出力形式（例）:**

```
---
markdive:
  source: README.md
  path: 2.1
  context: 第2章 > セクション2.1
---

## セクション2.1

本文...
```

## セクションID

各見出しには、ドキュメント内の位置に応じて階層IDが自動付与されます。

| 見出し | ID |
|---|---|
| `# はじめに`（1つ目の`#`） | `1` |
| `## セットアップ`（`#1` 直下の1つ目の`##`） | `1.1` |
| `### インストール`（`1.1` 直下の1つ目の`###`） | `1.1.1` |
| `# 使い方`（2つ目の`#`） | `2` |

## サマリー

見出しの直後にHTMLコメントを置くと、セクションサマリーとして利用されます。

```markdown
## セットアップ
<!-- summary: ツールのインストールと設定方法 -->
```

コメントがない場合は本文先頭（最大50文字）から自動生成されます。

## AIエージェントの典型的な利用フロー

```bash
# 1. 全体を把握
markdive dive large-spec.md --json

# 2. 関心章を掘り下げ
markdive dive large-spec.md --path 3 --depth 2 --json

# 3. 必要箇所を精読
markdive read large-spec.md --path 3.2
```

## 開発

```bash
npm install
npm run build
npm test
npm run lint
```

## 動作要件

- Node.js 16以上

## ライセンス

[MIT](LICENSE) © 2026 Lambda-deep
