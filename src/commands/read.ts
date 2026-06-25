import * as path from "node:path";
import { buildBreadcrumb, findSection } from "../parser";
import type { ParsedDocument } from "../types";

/** read コマンドのオプション。 */
export interface ReadOptions {
    path?: string;
}

/**
 * `read` コマンドを実行します。
 *
 * 指定されたセクションの全コンテンツを、ソースファイル名・セクションパス・
 * パンくずリストを含むメタデータブロックとともに出力します。
 */
export function runRead(result: ParsedDocument, options: ReadOptions): void {
    // --path 指定時は従来通り
    if (options.path) {
        if (options.path === "0") {
            if (!result.unsectionedContent) {
                console.error('Error: Unsectioned content "0" not found.');
                process.exit(1);
            }
            printMetadataHeader(result, "0", "unsectioned");
            console.log(result.unsectionedContent);
            return;
        }
        const section = findSection(result, options.path);
        if (!section) {
            console.error(`Error: Section "${options.path}" not found.`);
            process.exit(1);
        }
        const breadcrumb = buildBreadcrumb(section);
        printMetadataHeader(result, section.id, breadcrumb);
        printSection(section);
        return;
    }

    // --path 省略時: ファイル全文を出力
    printMetadataHeader(result, "(full)", "(full document)");
    let printed = false;
    // 見出しがある場合は全セクションを順に出力
    if (result.sections.length > 0) {
        for (const section of result.sections) {
            printSection(section);
            printed = true;
        }
    }
    // 見出しがない場合や未所属本文がある場合は unsectionedContent
    if (result.unsectionedContent) {
        if (printed) {
            console.log("");
        }
        console.log(result.unsectionedContent);
        printed = true;
    }
    // 完全空ファイルはメタデータヘッダーのみ
}

function printMetadataHeader(result: ParsedDocument, pathId: string, context: string): void {
    const filename = path.basename(result.filePath);

    // メタデータヘッダー
    console.log("---");
    // フロントマターのキーと値をそのまま表示する
    if (result.frontMatter && Object.keys(result.frontMatter).length > 0) {
        for (const [key, value] of Object.entries(result.frontMatter)) {
            console.log(`${key}: ${value}`);
        }
    }
    // markdive の固定フィールドはネストして表示する（フロントマターキーとの衝突を避ける）
    console.log("markdive:");
    console.log(`  source: ${filename}`);
    console.log(`  path: ${pathId}`);
    console.log(`  context: ${context}`);
    console.log("---");
    console.log("");
}

/** セクションとその子孫を再帰的に出力するヘルパー。 */
function printSection(section: import("../types").Section): void {
    const hashes = "#".repeat(section.level);
    console.log(`${hashes} ${section.title}`);

    if (section.content) {
        console.log("");
        console.log(section.content);
    }

    for (const child of section.children) {
        console.log("");
        printSection(child);
    }
}
