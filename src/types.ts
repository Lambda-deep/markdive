/**
 * Represents a single section parsed from a Markdown file.
 */
export interface Section {
  /** Hierarchical ID, e.g. "1", "1.2", "2.1.3" */
  id: string;
  /** Heading level (1–6) */
  level: number;
  /** Heading title text (without leading # characters) */
  title: string;
  /** Summary from <!-- summary: ... --> comment, or auto-generated from content */
  summary: string;
  /** Raw content lines belonging to this section (excluding sub-section content) */
  content: string;
  /** Child sections */
  children: Section[];
  /** Reference to parent section, or null for top-level sections */
  parent: Section | null;
}

/**
 * Result of parsing a Markdown file.
 */
export interface ParseResult {
  /** Absolute or relative path of the source file */
  filePath: string;
  /** Top-level sections */
  sections: Section[];
}

/**
 * JSON-serialisable representation of a section (without circular parent reference).
 */
export interface SectionJSON {
  id: string;
  level: number;
  title: string;
  summary: string;
  children: SectionJSON[];
}
