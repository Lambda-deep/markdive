/** 自動生成サマリーの最大文字数。 */
const AUTO_SUMMARY_LENGTH = 50;

/** Markdown本文から自動サマリーを生成する。 */
export function buildAutoSummary(contentLines: string[]): string {
    for (const line of contentLines) {
        const trimmed = line.trim();
        if (trimmed === "" || trimmed.startsWith("<!--")) {
            continue;
        }

        const plain = trimmed
            .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
            .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
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
