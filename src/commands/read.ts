import * as path from "node:path";
import { buildBreadcrumb, findSection } from "../parser";
import type { ParseResult } from "../types";

/** read コマンドのオプション。 */
export interface ReadOptions {
    path: string;
}

/**
 * `read` コマンドを実行します。
 *
 * 指定されたセクションの全コンテンツを、ソースファイル名・セクションパス・
 * パンくずリストを含むメタデータブロックとともに出力します。
 */
export function runRead(result: ParseResult, options: ReadOptions): void {
    const section = findSection(result, options.path);
    if (!section) {
        console.error(`Error: Section "${options.path}" not found.`);
        process.exit(1);
    }

    const filename = path.basename(result.filePath);
    const breadcrumb = buildBreadcrumb(section);

    // メタデータヘッダー
    console.log("---");
    // フロントマターのキーと値をそのまま表示する
    if (result.frontMatter && Object.keys(result.frontMatter).length > 0) {
        for (const [key, value] of Object.entries(result.frontMatter)) {
            console.log(`${key}: ${value}`);
        }
    }
    // md-dive の固定フィールドはネストして表示する（フロントマターキーとの衝突を避ける）
    console.log("md-dive:");
    console.log(`  source: ${filename}`);
    console.log(`  path: ${section.id}`);
    console.log(`  context: ${breadcrumb}`);
    console.log("---");
    console.log("");

    // セクション見出し
    const hashes = "#".repeat(section.level);
    console.log(`${hashes} ${section.title}`);

    // セクション本文
    if (section.content) {
        console.log("");
        console.log(section.content);
    }
}
