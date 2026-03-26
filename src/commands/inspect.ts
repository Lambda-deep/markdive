import { ParseResult, Section, SectionJSON } from "../types";
import { findSection } from "../parser";

/** inspect コマンドのオプション。 */
export interface InspectOptions {
  path: string;
  json: boolean;
}

/**
 * `inspect` コマンドを実行します。
 *
 * `options.path` で指定されたセクションの直下の子セクション一覧を表示します。
 */
export function runInspect(result: ParseResult, options: InspectOptions): void {
  const section = findSection(result, options.path);
  if (!section) {
    console.error(`Error: Section "${options.path}" not found.`);
    process.exit(1);
  }

  if (options.json) {
    const output: SectionJSON = {
      id: section.id,
      level: section.level,
      title: section.title,
      summary: section.summary,
      children: section.children.map(toJSON),
    };
    console.log(JSON.stringify(output, null, 2));
  } else {
    if (section.children.length === 0) {
      console.log(`Section "${section.id}: ${section.title}" has no sub-sections.`);
      return;
    }
    console.log(`${section.id}: ${section.title}`);
    for (const child of section.children) {
      const summaryPart = child.summary ? ` — ${child.summary}` : "";
      console.log(`  ${child.id}: ${child.title}${summaryPart}`);
    }
  }
}

// ---------------------------------------------------------------------------
// ユーティリティ関数
// ---------------------------------------------------------------------------

function toJSON(section: Section): SectionJSON {
  return {
    id: section.id,
    level: section.level,
    title: section.title,
    summary: section.summary,
    children: [],
  };
}
