import { findSection } from "../parser";
import type { ParseResult, Section, SectionJSON } from "../types";

/** dive コマンドのオプション。 */
export interface DiveOptions {
    depth: number;
    json: boolean;
    path?: string;
}

/**
 * `dive` コマンドを実行します。
 *
 * ルート全体、または `options.path` で指定されたセクションを起点に、
 * `depth` で指定された階層まで構造を出力します。
 */
export function runDive(result: ParseResult, options: DiveOptions): void {
    if (options.path) {
        const section = findSection(result, options.path);
        if (!section) {
            console.error(`Error: Section "${options.path}" not found.`);
            process.exit(1);
        }

        const maxLevel = section.level + options.depth;
        if (options.json) {
            console.log(JSON.stringify(toJSON(section, maxLevel), null, 2));
            return;
        }

        printSection(section, maxLevel);
        return;
    }

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
        for (const section of result.sections) {
            printSection(section, options.depth);
        }
    }
}

// ---------------------------------------------------------------------------
// ユーティリティ関数
// ---------------------------------------------------------------------------

function printSection(section: Section, maxLevel: number): void {
    if (section.level > maxLevel) {
        return;
    }

    const prefix = "  ".repeat(section.level - 1);
    const summaryPart = section.summary ? ` — ${section.summary}` : "";
    console.log(`${prefix}${section.id}: ${section.title}${summaryPart}`);

    for (const child of section.children) {
        printSection(child, maxLevel);
    }
}

function toJSON(section: Section, maxLevel: number): SectionJSON {
    return {
        id: section.id,
        level: section.level,
        title: section.title,
        summary: section.summary,
        hasChildren: section.children.length > 0,
        children: section.level < maxLevel ? section.children.map((c) => toJSON(c, maxLevel)) : [],
    };
}
