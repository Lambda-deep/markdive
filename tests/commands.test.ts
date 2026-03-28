import * as path from "node:path";
import { runInspect } from "../src/commands/inspect";
import { runOutline } from "../src/commands/outline";
import { runRead } from "../src/commands/read";
import { parseMarkdown } from "../src/parser";

const fixturePath = (name: string) => path.join(__dirname, "fixtures", name);

// Capture console output helpers
function captureConsole(): { lines: string[]; restore: () => void } {
    const lines: string[] = [];
    const orig = console.log.bind(console);
    console.log = (...args: unknown[]) => {
        lines.push(args.map(String).join(" "));
    };
    return {
        lines,
        restore: () => {
            console.log = orig;
        },
    };
}

// ---------------------------------------------------------------------------
// outline
// ---------------------------------------------------------------------------
describe("runOutline – text", () => {
    const result = parseMarkdown(fixturePath("sample.md"));

    test("default depth 2 includes levels 1 and 2", () => {
        const cap = captureConsole();
        runOutline(result, { depth: 2, json: false });
        cap.restore();
        const output = cap.lines.join("\n");
        expect(output).toContain("1: Project Overview");
        expect(output).toContain("1.1: Getting Started");
        // Level-3 headings should NOT appear
        expect(output).not.toContain("1.1.1:");
    });

    test("depth 3 includes level 3", () => {
        const cap = captureConsole();
        runOutline(result, { depth: 3, json: false });
        cap.restore();
        const output = cap.lines.join("\n");
        expect(output).toContain("1.1.1: Installation");
    });

    test("summary is included in text output", () => {
        const cap = captureConsole();
        runOutline(result, { depth: 2, json: false });
        cap.restore();
        const output = cap.lines.join("\n");
        expect(output).toContain("High-level introduction to the project");
    });
});

describe("runOutline – orphan section indentation", () => {
    const result = parseMarkdown(fixturePath("skipped-level.md"));

    test("orphan section (level 3) is indented by 2 levels", () => {
        const cap = captureConsole();
        runOutline(result, { depth: 3, json: false });
        cap.restore();
        // level-3 orphan section should have 4 spaces (2 * (3-1)) of indent
        const orphanLine = cap.lines.find((l) => l.includes("Orphan Section"));
        expect(orphanLine).toBeDefined();
        expect(orphanLine).toMatch(/^ {4}/);
    });

    test("top-level section (level 1) has no indent", () => {
        const cap = captureConsole();
        runOutline(result, { depth: 3, json: false });
        cap.restore();
        const topLine = cap.lines.find((l) => l.includes("Top Level"));
        expect(topLine).toBeDefined();
        expect(topLine).toMatch(/^1:/);
    });
});

describe("runOutline – JSON", () => {
    const result = parseMarkdown(fixturePath("sample.md"));

    test("JSON output is parseable and has correct structure", () => {
        const cap = captureConsole();
        runOutline(result, { depth: 2, json: true });
        cap.restore();
        const parsed = JSON.parse(cap.lines.join("\n"));
        expect(Array.isArray(parsed)).toBe(true);
        expect(parsed[0].id).toBe("1");
        expect(parsed[0].title).toBe("Project Overview");
        expect(Array.isArray(parsed[0].children)).toBe(true);
        expect(parsed[0].children[0].id).toBe("1.1");
    });

    test("JSON depth=2 does not include level-3 children", () => {
        const cap = captureConsole();
        runOutline(result, { depth: 2, json: true });
        cap.restore();
        const parsed = JSON.parse(cap.lines.join("\n"));
        // children of level-2 sections should be empty arrays
        expect(parsed[0].children[0].children).toHaveLength(0);
    });

    test("JSON hasChildren is true when depth limit hides children", () => {
        const cap = captureConsole();
        runOutline(result, { depth: 2, json: true });
        cap.restore();
        const parsed = JSON.parse(cap.lines.join("\n"));
        // 1.1 (Getting Started) has children (1.1.1), but depth=2 hides them
        expect(parsed[0].children[0].hasChildren).toBe(true);
        expect(parsed[0].children[0].children).toHaveLength(0);
    });

    test("JSON hasChildren is false for leaf sections", () => {
        const cap = captureConsole();
        runOutline(result, { depth: 3, json: true });
        cap.restore();
        const parsed = JSON.parse(cap.lines.join("\n"));
        // 1.1.1 (Installation) has no children
        const installation = parsed[0].children[0].children[0];
        expect(installation.id).toBe("1.1.1");
        expect(installation.hasChildren).toBe(false);
        expect(installation.children).toHaveLength(0);
    });
});

// ---------------------------------------------------------------------------
// inspect
// ---------------------------------------------------------------------------
describe("runInspect – text", () => {
    const result = parseMarkdown(fixturePath("sample.md"));

    test("shows children of a section", () => {
        const cap = captureConsole();
        runInspect(result, { path: "1", json: false });
        cap.restore();
        const output = cap.lines.join("\n");
        expect(output).toContain("1.1: Getting Started");
        expect(output).toContain("1.2: Usage");
    });

    test("leaf section reports no sub-sections", () => {
        const cap = captureConsole();
        runInspect(result, { path: "1.1.1", json: false });
        cap.restore();
        const output = cap.lines.join("\n");
        expect(output).toContain("has no sub-sections");
    });
});

describe("runInspect – JSON", () => {
    const result = parseMarkdown(fixturePath("sample.md"));

    test("JSON includes parent and children", () => {
        const cap = captureConsole();
        runInspect(result, { path: "1", json: true });
        cap.restore();
        const parsed = JSON.parse(cap.lines.join("\n"));
        expect(parsed.id).toBe("1");
        expect(parsed.children).toHaveLength(2);
        expect(parsed.children[0].id).toBe("1.1");
    });
});

// ---------------------------------------------------------------------------
// read
// ---------------------------------------------------------------------------
describe("runRead", () => {
    const result = parseMarkdown(fixturePath("sample.md"));

    test("outputs metadata header with nested md-dive block", () => {
        const cap = captureConsole();
        runRead(result, { path: "1.1.1" });
        cap.restore();
        const output = cap.lines.join("\n");
        expect(output).toContain("md-dive:");
        expect(output).toContain("  source: sample.md");
        expect(output).toContain("  path: 1.1.1");
        expect(output).toContain("  context: Project Overview > Getting Started > Installation");
    });

    test("outputs section heading and content", () => {
        const cap = captureConsole();
        runRead(result, { path: "1.1.1" });
        cap.restore();
        const output = cap.lines.join("\n");
        expect(output).toContain("### Installation");
        expect(output).toContain("npm install");
    });

    test("top-level section breadcrumb is just its own title", () => {
        const cap = captureConsole();
        runRead(result, { path: "1" });
        cap.restore();
        const output = cap.lines.join("\n");
        expect(output).toContain("  context: Project Overview");
    });
});

// ---------------------------------------------------------------------------
// Front matter display
// ---------------------------------------------------------------------------
describe("runOutline – front matter display", () => {
    const result = parseMarkdown(fixturePath("frontmatter.md"));

    test("front matter block is printed before sections", () => {
        const cap = captureConsole();
        runOutline(result, { depth: 2, json: false });
        cap.restore();
        const output = cap.lines.join("\n");
        expect(output).toContain("title: Installation Guide");
        expect(output).toContain("author: Lambda-deep");
        expect(output).toContain("version: 2");
        expect(output).toContain("draft: false");
    });

    test("front matter delimiters are printed", () => {
        const cap = captureConsole();
        runOutline(result, { depth: 2, json: false });
        cap.restore();
        // First and last line of the front matter block should be ---
        const idx = cap.lines.indexOf("---");
        expect(idx).toBe(0);
    });

    test("sections are printed after front matter block", () => {
        const cap = captureConsole();
        runOutline(result, { depth: 2, json: false });
        cap.restore();
        const output = cap.lines.join("\n");
        expect(output).toContain("1: Installation Guide");
    });

    test("JSON output is not affected by front matter", () => {
        const cap = captureConsole();
        runOutline(result, { depth: 2, json: true });
        cap.restore();
        const parsed = JSON.parse(cap.lines.join("\n"));
        expect(Array.isArray(parsed)).toBe(true);
        expect(parsed[0].id).toBe("1");
    });
});

describe("runRead – front matter in metadata header", () => {
    const result = parseMarkdown(fixturePath("frontmatter.md"));

    test("front matter keys appear verbatim before md-dive block", () => {
        const cap = captureConsole();
        runRead(result, { path: "1" });
        cap.restore();
        const output = cap.lines.join("\n");
        expect(output).toContain("title: Installation Guide");
        expect(output).toContain("author: Lambda-deep");
    });

    test("md-dive nested block contains source/path/context", () => {
        const cap = captureConsole();
        runRead(result, { path: "1" });
        cap.restore();
        const output = cap.lines.join("\n");
        expect(output).toContain("md-dive:");
        expect(output).toContain("  source: frontmatter.md");
        expect(output).toContain("  path: 1");
        expect(output).toContain("  context: Installation Guide");
    });

    test("no collision: front matter keys do not duplicate md-dive fields", () => {
        const cap = captureConsole();
        runRead(result, { path: "1" });
        cap.restore();
        // "source:"/"path:"/"context:" at top-level should NOT appear (only indented under md-dive:)
        const topLevelConflicts = cap.lines.filter((l) => /^(source|path|context):/.test(l));
        expect(topLevelConflicts).toHaveLength(0);
    });

    test("no front matter section when file has none", () => {
        const sampleResult = parseMarkdown(fixturePath("sample.md"));
        const cap = captureConsole();
        runRead(sampleResult, { path: "1" });
        cap.restore();
        // Only md-dive: block and --- delimiters should appear before the section content
        const headerEnd = cap.lines.lastIndexOf("---");
        const headerContent = cap.lines.slice(1, headerEnd);
        // Should be exactly: "md-dive:", "  source: ...", "  path: ...", "  context: ..."
        expect(headerContent).toHaveLength(4);
        expect(headerContent[0]).toBe("md-dive:");
    });
});
