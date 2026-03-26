import { Section, ParseResult } from "./types";
/**
 * MarkdownファイルをSectionのツリーに解析します。
 *
 * @param filePath - 解析対象のMarkdownファイルのパス。
 * @returns ファイルパスとルートレベルのセクションを含むParseResult。
 */
export declare function parseMarkdown(filePath: string): ParseResult;
/**
 * 解析結果の中からIDでセクションを検索します。
 * 見つからない場合は undefined を返します。
 */
export declare function findSection(result: ParseResult, id: string): Section | undefined;
/**
 * セクションのパンくずリスト文字列を構築します:
 *   "祖先 > 親 > 現在"
 */
export declare function buildBreadcrumb(section: Section): string;
//# sourceMappingURL=parser.d.ts.map