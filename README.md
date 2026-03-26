# md-dive

A CLI tool for hierarchical, on-demand navigation of large Markdown files. Designed to help AI coding agents and humans explore lengthy documents without loading the entire content at once.

## Motivation

Most AI agents load files in their entirety, filling the context window with irrelevant content. `md-dive` mirrors the human approach of first scanning the table of contents and then drilling into only the relevant sections.

## Installation

```bash
npm install -g md-dive
```

Or use it via `npx`:

```bash
npx md-dive outline README.md
```

## Commands

### `outline <file>`

Print the first N heading levels (default: 2) as a structured overview.

```bash
md-dive outline README.md
md-dive outline README.md --depth 3
md-dive outline README.md --json
```

**Options:**

| Option | Default | Description |
|---|---|---|
| `--depth <n>` | `2` | Maximum heading depth to display |
| `--json` | `false` | Output as JSON |

### `inspect <file> --path <id>`

List the immediate sub-sections of the section identified by `<id>`.

```bash
md-dive inspect README.md --path "2"
md-dive inspect README.md --path "1.3" --json
```

**Options:**

| Option | Default | Description |
|---|---|---|
| `--path <id>` | *(required)* | Section ID to inspect, e.g. `"2"` or `"1.3"` |
| `--json` | `false` | Output as JSON |

### `read <file> --path <id>`

Output the full content of the specified section, prefixed with a metadata header containing the source file name, section path, and breadcrumb context.

```bash
md-dive read README.md --path "2.1"
```

**Options:**

| Option | Default | Description |
|---|---|---|
| `--path <id>` | *(required)* | Section ID to read, e.g. `"2.1"` |

**Output format:**

```
---
Source: README.md
Path: 2.1
Context: Chapter Two > Section 2.1
---

## Section 2.1

Section content here...
```

## Section IDs

Each heading is automatically assigned a hierarchical ID based on its position in the document:

| Heading | ID |
|---|---|
| `# Introduction` (first) | `1` |
| `## Setup` (first `##` under `#1`) | `1.1` |
| `### Install` (first `###` under `1.1`) | `1.1.1` |
| `# Usage` (second `#`) | `2` |

## Summaries

Add an HTML comment immediately after a heading to set a custom summary:

```markdown
## Setup
<!-- summary: How to install and configure the tool -->

Installation steps go here...
```

If no comment is present, the first ~50 characters of the section body are used as an automatic summary.

## Typical AI Agent Workflow

```bash
# 1. Get a high-level overview
md-dive outline large-spec.md --json

# 2. Drill into a chapter of interest
md-dive inspect large-spec.md --path "3" --json

# 3. Read only the relevant section
md-dive read large-spec.md --path "3.2"
```

## Development

```bash
npm install
npm run build   # compile TypeScript
npm test        # run Jest tests
npm run lint    # type-check without emitting
```

## Requirements

- Node.js 18+