# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.2.0] - 2026-03-28

### Added

- `outline` / `inspect` JSON output: added `hasChildren` field to distinguish depth-limited truncation from truly leaf sections

### Changed

- `read` command: now recursively outputs the target section and all its descendant sections

## [0.1.0] - 2026-03-28

### Added

- `outline` command: display the top-N levels of a Markdown document structure
- `inspect` command: drill into a specific section and list its children
- `read` command: output the full content of a section with breadcrumb metadata
- Hierarchical section IDs (e.g. `1.2.3`) auto-assigned from heading structure
- `--json` option for `outline` and `inspect` to emit machine-readable output
- `--depth` option for `outline` to control how many heading levels to display
- Summary extraction: `<!-- summary: text -->` comment or first 50 chars fallback
- Fenced code block detection: headings inside ` ``` ` blocks are not parsed as sections
- Blockquote detection: headings inside `>` blocks are not parsed as sections
- TypeScript library API re-exported from `src/index.ts`

[Unreleased]: https://github.com/Lambda-deep/md-dive/compare/v0.2.0...HEAD
[0.2.0]: https://github.com/Lambda-deep/md-dive/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/Lambda-deep/md-dive/releases/tag/v0.1.0
