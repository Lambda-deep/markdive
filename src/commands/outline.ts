import type { ParseResult, Section, SectionJSON } from "../types";

/** outline コマンドのオプション。 */
export interface OutlineOptions {
    depth: number;
    json: boolean;
}

/**
 * `outline` コマンドを実行します。
 *
 * ドキュメント構造の最初の `depth` レベルを標準出力に出力します。
 */
export function runOutline(result: ParseResult, options: OutlineOptions): void {
    if (options.json) {
        const output = result.sections.map((s) => toJSON(s, options.depth));
        console.log(JSON.stringify(output, null, 2));
    } else {
        printSections(result.sections, options.depth, 0);
    }
}

// ---------------------------------------------------------------------------
// ユーティリティ関数
// ---------------------------------------------------------------------------

function printSections(sections: Section[], maxDepth: number, indent: number): void {
    for (const section of sections) {
        if (section.level > maxDepth) {
            continue;
        }
        const prefix = "  ".repeat(indent);
        const summaryPart = section.summary ? ` — ${section.summary}` : "";
        console.log(`${prefix}${section.id}: ${section.title}${summaryPart}`);
        if (section.children.length > 0) {
            printSections(section.children, maxDepth, indent + 1);
        }
    }
}

function toJSON(section: Section, maxDepth: number): SectionJSON {
    return {
        id: section.id,
        level: section.level,
        title: section.title,
        summary: section.summary,
        children: section.level < maxDepth ? section.children.map((c) => toJSON(c, maxDepth)) : [],
    };
}
