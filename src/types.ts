/**
 * Markdownファイルから解析された1つのセクションを表します。
 */
export interface Section {
    /** 階層ID（例: "1"、"1.2"、"2.1.3"） */
    id: string;
    /** 見出しレベル（1〜6） */
    level: number;
    /** 見出しのタイトルテキスト（先頭の # 記号を除く） */
    title: string;
    /** <!-- summary: ... --> コメントから取得したサマリー、またはコンテンツから自動生成したサマリー */
    summary: string;
    /** このセクションに属する本文（サブセクションのコンテンツは含まない） */
    content: string;
    /** 子セクションの配列 */
    children: Section[];
    /** 親セクションへの参照（トップレベルセクションの場合は null） */
    parent: Section | null;
}

/**
 * Markdownファイルの解析結果。
 */
export interface ParseResult {
    /** ソースファイルの絶対パスまたは相対パス */
    filePath: string;
    /** トップレベルセクションの配列 */
    sections: Section[];
}

/**
 * セクションのJSON直列化可能な表現（循環参照となる parent を含まない）。
 */
export interface SectionJSON {
    id: string;
    level: number;
    title: string;
    summary: string;
    children: SectionJSON[];
}
