"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runInspect = runInspect;
const parser_1 = require("../parser");
/**
 * `inspect` コマンドを実行します。
 *
 * `options.path` で指定されたセクションの直下の子セクション一覧を表示します。
 */
function runInspect(result, options) {
    const section = (0, parser_1.findSection)(result, options.path);
    if (!section) {
        console.error(`Error: Section "${options.path}" not found.`);
        process.exit(1);
    }
    if (options.json) {
        const output = {
            id: section.id,
            level: section.level,
            title: section.title,
            summary: section.summary,
            children: section.children.map(toJSON),
        };
        console.log(JSON.stringify(output, null, 2));
    }
    else {
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
function toJSON(section) {
    return {
        id: section.id,
        level: section.level,
        title: section.title,
        summary: section.summary,
        children: [],
    };
}
//# sourceMappingURL=inspect.js.map