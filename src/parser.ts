import * as fs from "fs";
import * as path from "path";
import { Section, ParseResult } from "./types";

/** Maximum characters used for the auto-generated summary fallback. */
const AUTO_SUMMARY_LENGTH = 50;

/** Regex matching a Markdown ATX heading line, e.g. "## My Title" */
const HEADING_RE = /^(#{1,6})\s+(.+)$/;

/** Regex matching an HTML summary comment, e.g. "<!-- summary: text -->" */
const SUMMARY_COMMENT_RE = /^<!--\s*summary:\s*(.*?)\s*-->$/;

/**
 * Parse a Markdown file into a tree of Sections.
 *
 * @param filePath - Path to the Markdown file to parse.
 * @returns ParseResult containing the file path and root-level sections.
 */
export function parseMarkdown(filePath: string): ParseResult {
  const absolutePath = path.resolve(filePath);
  const raw = fs.readFileSync(absolutePath, "utf-8");
  const lines = raw.split("\n");

  // -----------------------------------------------------------------------
  // Pass 1: collect heading positions and their raw content lines
  // -----------------------------------------------------------------------
  interface RawSection {
    level: number;
    title: string;
    lineStart: number; // index of the heading line itself
    lineEnd: number;   // index of the last line belonging to this section (exclusive)
    contentLines: string[];
  }

  const rawSections: RawSection[] = [];

  for (let i = 0; i < lines.length; i++) {
    const match = HEADING_RE.exec(lines[i]);
    if (match) {
      rawSections.push({
        level: match[1].length,
        title: match[2].trim(),
        lineStart: i,
        lineEnd: lines.length, // will be corrected below
        contentLines: [],
      });
    }
  }

  // Set lineEnd: each section ends where the next same-or-higher-level heading starts.
  for (let i = 0; i < rawSections.length; i++) {
    const current = rawSections[i];
    for (let j = i + 1; j < rawSections.length; j++) {
      if (rawSections[j].level <= current.level) {
        current.lineEnd = rawSections[j].lineStart;
        break;
      }
    }
    // Collect the lines that belong to this section (everything between the
    // heading and the start of its first child, if any).
    let childStart = current.lineEnd;
    for (let j = i + 1; j < rawSections.length; j++) {
      if (rawSections[j].level === current.level + 1) {
        childStart = rawSections[j].lineStart;
        break;
      }
      if (rawSections[j].level <= current.level) {
        break;
      }
    }
    current.contentLines = lines.slice(current.lineStart + 1, childStart);
  }

  // -----------------------------------------------------------------------
  // Pass 2: assign hierarchical IDs
  // -----------------------------------------------------------------------
  // counters[n] holds the number of level-n headings seen since the last
  // level-(n-1) heading.
  const counters: number[] = new Array(7).fill(0);

  interface IndexedRaw extends RawSection {
    id: string;
  }

  const indexed: IndexedRaw[] = rawSections.map((s) => {
    // Increment counter at the current level and reset all deeper levels.
    counters[s.level]++;
    for (let d = s.level + 1; d <= 6; d++) {
      counters[d] = 0;
    }
    const id = counters.slice(1, s.level + 1).join(".");
    return { ...s, id };
  });

  // -----------------------------------------------------------------------
  // Pass 3: extract summary and build Section objects
  // -----------------------------------------------------------------------
  const sectionMap = new Map<string, Section>();

  for (const raw of indexed) {
    const summary = extractSummary(raw.contentLines);
    const section: Section = {
      id: raw.id,
      level: raw.level,
      title: raw.title,
      summary,
      content: buildContent(raw.contentLines),
      children: [],
      parent: null,
    };
    sectionMap.set(raw.id, section);
  }

  // -----------------------------------------------------------------------
  // Pass 4: wire parent–child relationships
  // -----------------------------------------------------------------------
  const roots: Section[] = [];

  for (const [, section] of sectionMap) {
    const parentId = getParentId(section.id);
    if (parentId === null) {
      roots.push(section);
    } else {
      const parent = sectionMap.get(parentId);
      if (parent) {
        section.parent = parent;
        parent.children.push(section);
      } else {
        // Orphaned section (parent heading was skipped in source) – treat as root.
        roots.push(section);
      }
    }
  }

  return { filePath: absolutePath, sections: roots };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Derive the parent ID from a section ID string.
 * Returns null for top-level sections (no dot).
 */
function getParentId(id: string): string | null {
  const lastDot = id.lastIndexOf(".");
  return lastDot === -1 ? null : id.slice(0, lastDot);
}

/**
 * Extract the summary for a section.
 *
 * Priority:
 *   1. First `<!-- summary: ... -->` comment found in contentLines.
 *   2. First AUTO_SUMMARY_LENGTH characters of the first non-empty, non-comment line.
 */
function extractSummary(contentLines: string[]): string {
  // 1. Look for explicit summary comment.
  for (const line of contentLines) {
    const trimmed = line.trim();
    const m = SUMMARY_COMMENT_RE.exec(trimmed);
    if (m) {
      return m[1].trim();
    }
  }

  // 2. Auto-generate from the first substantial text line.
  for (const line of contentLines) {
    const trimmed = line.trim();
    if (trimmed === "" || trimmed.startsWith("<!--")) {
      continue;
    }
    // Strip inline Markdown formatting for a cleaner summary.
    const plain = trimmed
      .replace(/!\[.*?\]\(.*?\)/g, "")  // images
      .replace(/\[.*?\]\(.*?\)/g, "$&") // keep link text
      .replace(/[`*_~]/g, "")
      .trim();
    if (plain.length === 0) {
      continue;
    }
    return plain.slice(0, AUTO_SUMMARY_LENGTH) + (plain.length > AUTO_SUMMARY_LENGTH ? "..." : "");
  }

  return "";
}

/**
 * Join content lines into a single string, trimming leading/trailing blank lines.
 */
function buildContent(contentLines: string[]): string {
  // Remove the summary comment line from displayed content.
  const filtered = contentLines.filter((l) => !SUMMARY_COMMENT_RE.test(l.trim()));
  // Trim leading/trailing blank lines.
  let start = 0;
  let end = filtered.length;
  while (start < end && filtered[start].trim() === "") start++;
  while (end > start && filtered[end - 1].trim() === "") end--;
  return filtered.slice(start, end).join("\n");
}

// ---------------------------------------------------------------------------
// Lookup helpers (exported for use by command modules)
// ---------------------------------------------------------------------------

/**
 * Find a section by its ID within a parsed result.
 * Returns undefined if not found.
 */
export function findSection(result: ParseResult, id: string): Section | undefined {
  return findInList(result.sections, id);
}

function findInList(sections: Section[], id: string): Section | undefined {
  for (const s of sections) {
    if (s.id === id) return s;
    const found = findInList(s.children, id);
    if (found) return found;
  }
  return undefined;
}

/**
 * Build the breadcrumb context string for a section:
 *   "Grandparent > Parent > Current"
 */
export function buildBreadcrumb(section: Section): string {
  const parts: string[] = [];
  let current: Section | null = section;
  while (current !== null) {
    parts.unshift(current.title);
    current = current.parent;
  }
  return parts.join(" > ");
}
