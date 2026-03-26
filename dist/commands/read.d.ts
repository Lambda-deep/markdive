import { ParseResult } from "../types";
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
export declare function runRead(result: ParseResult, options: ReadOptions): void;
//# sourceMappingURL=read.d.ts.map