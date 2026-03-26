import * as path from "path";
import { ParseResult } from "../types";
import { findSection, buildBreadcrumb } from "../parser";

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
  console.log(`Source: ${filename}`);
  console.log(`Path: ${section.id}`);
  console.log(`Context: ${breadcrumb}`);
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
