import { ParseResult } from "../types";
/** inspect コマンドのオプション。 */
export interface InspectOptions {
    path: string;
    json: boolean;
}
/**
 * `inspect` コマンドを実行します。
 *
 * `options.path` で指定されたセクションの直下の子セクション一覧を表示します。
 */
export declare function runInspect(result: ParseResult, options: InspectOptions): void;
//# sourceMappingURL=inspect.d.ts.map