import * as fs from "fs";
import * as path from "path";
import { Section, ParseResult } from "./types";

/** 自動生成サマリーの最大文字数。 */
const AUTO_SUMMARY_LENGTH = 50;

/** Markdown ATX形式の見出し行にマッチする正規表現（例: "## My Title"） */
const HEADING_RE = /^(#{1,6})\s+(.+)$/;

/** HTMLサマリーコメントにマッチする正規表現（例: "<!-- summary: text -->"） */
const SUMMARY_COMMENT_RE = /^<!--\s*summary:\s*(.*?)\s*-->$/;

/**
 * MarkdownファイルをSectionのツリーに解析します。
 *
 * @param filePath - 解析対象のMarkdownファイルのパス。
 * @returns ファイルパスとルートレベルのセクションを含むParseResult。
 */
export function parseMarkdown(filePath: string): ParseResult {
  const absolutePath = path.resolve(filePath);
  const raw = fs.readFileSync(absolutePath, "utf-8");
  const lines = raw.split("\n");

  // -----------------------------------------------------------------------
  // パス1: 見出しの位置と本文行を収集する
  // -----------------------------------------------------------------------
  interface RawSection {
    level: number;
    title: string;
    lineStart: number; // 見出し行のインデックス
    lineEnd: number;   // このセクションが終わる行のインデックス（exclusive）
    contentLines: string[];
  }

  const rawSections: RawSection[] = [];

  for (let i = 0; i < lines.length; i++) {
    const match = HEADING_RE.exec(lines[i]);
    if (match) {
      rawSections.push({
        level: match[1].length,
        title: match[2].trim(),
        lineStart: i,
        lineEnd: lines.length, // will be corrected below
        contentLines: [],
      });
    }
  }

  // lineEnd を設定: 各セクションは同レベルまたは上位レベルの次の見出しが始まる行で終わる。
  for (let i = 0; i < rawSections.length; i++) {
    const current = rawSections[i];
    for (let j = i + 1; j < rawSections.length; j++) {
      if (rawSections[j].level <= current.level) {
        current.lineEnd = rawSections[j].lineStart;
        break;
      }
    }
    // このセクションに属する行（見出しから最初の子セクションの直前まで）を収集する。
    let childStart = current.lineEnd;
    for (let j = i + 1; j < rawSections.length; j++) {
      if (rawSections[j].level === current.level + 1) {
        childStart = rawSections[j].lineStart;
        break;
      }
      if (rawSections[j].level <= current.level) {
        break;
      }
    }
    current.contentLines = lines.slice(current.lineStart + 1, childStart);
  }

  // -----------------------------------------------------------------------
  // パス2: 階層IDを付与する
  // -----------------------------------------------------------------------
  // counters[n] は、直近の level-(n-1) 見出し以降に出現した level-n 見出しの数を保持する。
  const counters: number[] = new Array(7).fill(0);

  interface IndexedRaw extends RawSection {
    id: string;
  }

  const indexed: IndexedRaw[] = rawSections.map((s) => {
    // 現在のレベルのカウンターをインクリメントし、それより深いレベルをすべてリセットする。
    counters[s.level]++;
    for (let d = s.level + 1; d <= 6; d++) {
      counters[d] = 0;
    }
    const id = counters.slice(1, s.level + 1).join(".");
    return { ...s, id };
  });

  // -----------------------------------------------------------------------
  // パス3: サマリーを抽出してSectionオブジェクトを構築する
  // -----------------------------------------------------------------------
  const sectionMap = new Map<string, Section>();

  for (const raw of indexed) {
    const summary = extractSummary(raw.contentLines);
    const section: Section = {
      id: raw.id,
      level: raw.level,
      title: raw.title,
      summary,
      content: buildContent(raw.contentLines),
      children: [],
      parent: null,
    };
    sectionMap.set(raw.id, section);
  }

  // -----------------------------------------------------------------------
  // パス4: 親子関係を構築する
  // -----------------------------------------------------------------------
  const roots: Section[] = [];

  for (const [, section] of sectionMap) {
    const parentId = getParentId(section.id);
    if (parentId === null) {
      roots.push(section);
    } else {
      const parent = sectionMap.get(parentId);
      if (parent) {
        section.parent = parent;
        parent.children.push(section);
      } else {
        // 孤立セクション（ソース内で親見出しがスキップされた場合）はルートとして扱う。
        roots.push(section);
      }
    }
  }

  return { filePath: absolutePath, sections: roots };
}

// ---------------------------------------------------------------------------
// ユーティリティ関数
// ---------------------------------------------------------------------------

/**
 * セクションIDから親IDを導出します。
 * トップレベルセクション（ドットなし）の場合は null を返します。
 */
function getParentId(id: string): string | null {
  const lastDot = id.lastIndexOf(".");
  return lastDot === -1 ? null : id.slice(0, lastDot);
}

/**
 * セクションのサマリーを抽出します。
 *
 * 優先順位:
 *   1. contentLines 内で最初に見つかる `<!-- summary: ... -->` コメント。
 *   2. 空行・コメント以外の最初の行の先頭 AUTO_SUMMARY_LENGTH 文字。
 */
function extractSummary(contentLines: string[]): string {
  // 1. 明示的なサマリーコメントを探す。
  for (const line of contentLines) {
    const trimmed = line.trim();
    const m = SUMMARY_COMMENT_RE.exec(trimmed);
    if (m) {
      return m[1].trim();
    }
  }

  // 2. 最初の実質的なテキスト行から自動生成する。
  for (const line of contentLines) {
    const trimmed = line.trim();
    if (trimmed === "" || trimmed.startsWith("<!--")) {
      continue;
    }
    // インラインMarkdown記法を除去してよりクリーンなサマリーにする。
    const plain = trimmed
      .replace(/!\[.*?\]\(.*?\)/g, "")  // 画像を除去
      .replace(/\[.*?\]\(.*?\)/g, "$&") // リンクテキストは保持
      .replace(/[`*_~]/g, "")
      .trim();
    if (plain.length === 0) {
      continue;
    }
    return plain.slice(0, AUTO_SUMMARY_LENGTH) + (plain.length > AUTO_SUMMARY_LENGTH ? "..." : "");
  }

  return "";
}

/**
 * コンテンツ行を結合して文字列にし、先頭・末尾の空行を除去します。
 */
function buildContent(contentLines: string[]): string {
  // サマリーコメント行を表示コンテンツから除外する。
  const filtered = contentLines.filter((l) => !SUMMARY_COMMENT_RE.test(l.trim()));
  // 先頭・末尾の空行を除去する。
  let start = 0;
  let end = filtered.length;
  while (start < end && filtered[start].trim() === "") start++;
  while (end > start && filtered[end - 1].trim() === "") end--;
  return filtered.slice(start, end).join("\n");
}

// ---------------------------------------------------------------------------
// 検索ユーティリティ（コマンドモジュールから使用）
// ---------------------------------------------------------------------------

/**
 * 解析結果の中からIDでセクションを検索します。
 * 見つからない場合は undefined を返します。
 */
export function findSection(result: ParseResult, id: string): Section | undefined {
  return findInList(result.sections, id);
}

function findInList(sections: Section[], id: string): Section | undefined {
  for (const s of sections) {
    if (s.id === id) return s;
    const found = findInList(s.children, id);
    if (found) return found;
  }
  return undefined;
}

/**
 * セクションのパンくずリスト文字列を構築します:
 *   "祖先 > 親 > 現在"
 */
export function buildBreadcrumb(section: Section): string {
  const parts: string[] = [];
  let current: Section | null = section;
  while (current !== null) {
    parts.unshift(current.title);
    current = current.parent;
  }
  return parts.join(" > ");
}
