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
 * フロントマターのキーと値のマップ。
 * 値は文字列・数値・真偽値のいずれか。
 */
export interface FrontMatter {
    [key: string]: string | number | boolean;
}

/**
 * Markdownファイルの解析結果。
 */
export interface ParsedDocument {
    /** ソースファイルの絶対パスまたは相対パス */
    filePath: string;
    /** トップレベルセクションの配列 */
    sections: Section[];
    /** YAMLまたはTOMLフロントマター（存在する場合） */
    frontMatter?: FrontMatter;
    /** どの見出しにも属さない本文（存在する場合） */
    unsectionedContent?: string;
}

/**
 * セクションのJSON直列化可能な表現（循環参照となる parent を含まない）。
 */
export type DiveNodeJSON = SectionDiveNodeJSON | UnsectionedDiveNodeJSON;

export interface SectionDiveNodeJSON {
    kind: "section";
    id: string;
    level: number;
    title: string;
    summary: string;
    /** 子セクションが存在するかどうか。depth制限で children が空配列でも true になる場合がある。 */
    hasChildren: boolean;
    children: DiveNodeJSON[];
}

export interface UnsectionedDiveNodeJSON {
    kind: "unsectioned";
    id: "0";
    summary: string;
}
