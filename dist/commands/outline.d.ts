import { ParseResult } from "../types";
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
export declare function runOutline(result: ParseResult, options: OutlineOptions): void;
//# sourceMappingURL=outline.d.ts.map