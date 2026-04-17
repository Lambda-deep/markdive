import { findSection } from "../parser";
import type { DiveNodeJSON, ParsedDocument, Section, SectionDiveNodeJSON } from "../types";

const AUTO_SUMMARY_LENGTH = 50;

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
export function runDive(result: ParsedDocument, options: DiveOptions): void {
    if (options.path) {
        if (options.path === "0") {
            const unsectionedNode = toUnsectionedNode(result.unsectionedContent);
            if (!unsectionedNode) {
                console.error('Error: Unsectioned content "0" not found.');
                process.exit(1);
            }

            if (options.json) {
                console.log(JSON.stringify(unsectionedNode, null, 2));
            } else {
                printUnsectioned(unsectionedNode);
            }
            return;
        }

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
        const output: DiveNodeJSON[] = [];
        const unsectionedNode = toUnsectionedNode(result.unsectionedContent);
        if (unsectionedNode) {
            output.push(unsectionedNode);
        }
        output.push(...result.sections.map((section) => toJSON(section, options.depth)));
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
        const unsectionedNode = toUnsectionedNode(result.unsectionedContent);
        if (unsectionedNode) {
            printUnsectioned(unsectionedNode);
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

function printUnsectioned(node: Extract<DiveNodeJSON, { kind: "unsectioned" }>): void {
    const summaryPart = node.summary ? `: ${node.summary}` : ":";
    console.log(`${node.id}${summaryPart}`);
}

function toJSON(section: Section, maxLevel: number): SectionDiveNodeJSON {
    return {
        kind: "section",
        id: section.id,
        level: section.level,
        title: section.title,
        summary: section.summary,
        hasChildren: section.children.length > 0,
        children: section.level < maxLevel ? section.children.map((c) => toJSON(c, maxLevel)) : [],
    };
}

function toUnsectionedNode(
    content: string | undefined,
): Extract<DiveNodeJSON, { kind: "unsectioned" }> | null {
    if (!content) {
        return null;
    }

    return {
        kind: "unsectioned",
        id: "0",
        summary: createAutoSummary(content),
    };
}

function createAutoSummary(content: string): string {
    for (const line of content.split("\n")) {
        const trimmed = line.trim();
        if (trimmed === "" || trimmed.startsWith("<!--")) {
            continue;
        }

        const plain = trimmed
            .replace(/!\[.*?\]\(.*?\)/g, "")
            .replace(/\[.*?\]\(.*?\)/g, "$&")
            .replace(/[`*_~]/g, "")
            .trim();
        if (plain.length === 0) {
            continue;
        }

        return plain.length > AUTO_SUMMARY_LENGTH
            ? `${plain.slice(0, AUTO_SUMMARY_LENGTH)}...`
            : plain;
    }

    return "";
}
