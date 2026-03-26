import * as path from "path";
import { ParseResult } from "../types";
import { findSection, buildBreadcrumb } from "../parser";

/** Options for the read command. */
export interface ReadOptions {
  path: string;
}

/**
 * Execute the `read` command.
 *
 * Outputs the full content of the specified section, prefixed with a metadata
 * block containing the source file name, section path, and breadcrumb context.
 */
export function runRead(result: ParseResult, options: ReadOptions): void {
  const section = findSection(result, options.path);
  if (!section) {
    console.error(`Error: Section "${options.path}" not found.`);
    process.exit(1);
  }

  const filename = path.basename(result.filePath);
  const breadcrumb = buildBreadcrumb(section);

  // Metadata header
  console.log("---");
  console.log(`Source: ${filename}`);
  console.log(`Path: ${section.id}`);
  console.log(`Context: ${breadcrumb}`);
  console.log("---");
  console.log("");

  // Section heading
  const hashes = "#".repeat(section.level);
  console.log(`${hashes} ${section.title}`);

  // Section body
  if (section.content) {
    console.log("");
    console.log(section.content);
  }
}
