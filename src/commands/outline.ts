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
        // フロントマターが存在する場合は先頭に表示する
        if (result.frontMatter && Object.keys(result.frontMatter).length > 0) {
            console.log("---");
            for (const [key, value] of Object.entries(result.frontMatter)) {
                console.log(`${key}: ${value}`);
            }
            console.log("---");
        }
        printSections(result.sections, options.depth);
    }
}

// ---------------------------------------------------------------------------
// ユーティリティ関数
// ---------------------------------------------------------------------------

function printSections(sections: Section[], maxDepth: number): void {
    for (const section of sections) {
        if (section.level > maxDepth) {
            continue;
        }
        const prefix = "  ".repeat(section.level - 1);
        const summaryPart = section.summary ? ` — ${section.summary}` : "";
        console.log(`${prefix}${section.id}: ${section.title}${summaryPart}`);
        if (section.children.length > 0) {
            printSections(section.children, maxDepth);
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
