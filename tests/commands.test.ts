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

    test("outputs metadata header", () => {
        const cap = captureConsole();
        runRead(result, { path: "1.1.1" });
        cap.restore();
        const output = cap.lines.join("\n");
        expect(output).toContain("Source: sample.md");
        expect(output).toContain("Path: 1.1.1");
        expect(output).toContain("Context: Project Overview > Getting Started > Installation");
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
        expect(output).toContain("Context: Project Overview");
    });
});
