# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.3.1] - 2026-03-29

### Added

- ADR: added `0003-agent-skill-integration.md` and linked it from ADR index
- Agent skill guide: added `skills/markdive/SKILL.md`

### Changed

- Build setup: refreshed package metadata and lockfile generation behavior
- Version update flow: `--version` handling improved in CLI for release operations
- Frontmatter fixture and command tests updated to cover recent behavior and prevent regressions
- Documentation updates in `README.md` and `AGENTS.md`

## [0.3.0] - 2026-03-28

### Changed

- Breaking: npm package name changed from `md-dive` to `markdive`
- Breaking: CLI command name changed from `md-dive` to `markdive`
- Breaking: command set changed from `outline`/`inspect`/`read` to `dive`/`read`

### Removed

- `outline` command (merged into `dive`)
- `inspect` command (merged into `dive`)

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

[Unreleased]: https://github.com/Lambda-deep/markdive/compare/v0.3.1...HEAD
[0.3.1]: https://github.com/Lambda-deep/markdive/compare/v0.3.0...v0.3.1
[0.3.0]: https://github.com/Lambda-deep/markdive/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/Lambda-deep/markdive/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/Lambda-deep/markdive/releases/tag/v0.1.0
