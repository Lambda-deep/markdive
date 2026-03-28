import * as path from "node:path";
import { buildBreadcrumb, findSection, parseMarkdown } from "../src/parser";
import type { Section } from "../src/types";

const fixturePath = (name: string) => path.join(__dirname, "fixtures", name);

describe("parseMarkdown – sample.md", () => {
    const result = parseMarkdown(fixturePath("sample.md"));

    test("returns correct number of top-level sections", () => {
        expect(result.sections).toHaveLength(2);
    });

    test("assigns correct IDs to top-level sections", () => {
        expect(result.sections[0].id).toBe("1");
        expect(result.sections[1].id).toBe("2");
    });

    test("assigns correct level to top-level sections", () => {
        expect(result.sections[0].level).toBe(1);
        expect(result.sections[1].level).toBe(1);
    });

    test("extracts explicit summary comment", () => {
        expect(result.sections[0].summary).toBe("High-level introduction to the project");
    });

    test("extracts sub-section summary comment", () => {
        const gettingStarted = result.sections[0].children[0];
        expect(gettingStarted.id).toBe("1.1");
        expect(gettingStarted.summary).toBe("How to install and run");
    });

    test("assigns IDs to nested sections", () => {
        const installation = result.sections[0].children[0].children[0];
        expect(installation.id).toBe("1.1.1");
        expect(installation.title).toBe("Installation");
    });

    test("second top-level section has correct ID", () => {
        expect(result.sections[1].id).toBe("2");
        expect(result.sections[1].title).toBe("API Reference");
    });

    test("section content does not include summary comment line", () => {
        const gettingStarted = result.sections[0].children[0];
        expect(gettingStarted.content).not.toContain("<!-- summary:");
        expect(gettingStarted.content).toContain("Follow these steps");
    });

    test("parent references are set correctly", () => {
        const gettingStarted = result.sections[0].children[0];
        expect(gettingStarted.parent).toBe(result.sections[0]);
        const installation = gettingStarted.children[0];
        expect(installation.parent).toBe(gettingStarted);
    });
});

describe("parseMarkdown – deep.md (auto-summary)", () => {
    const result = parseMarkdown(fixturePath("deep.md"));

    test("auto-summary is truncated at 50 chars with ellipsis", () => {
        const section11 = findSection(result, "1.1");
        expect(section11).toBeDefined();
        const summary = section11?.summary ?? "";
        // Should be truncated (original content is > 50 chars)
        expect(summary.endsWith("...")).toBe(true);
        expect(summary.length).toBeLessThanOrEqual(53); // 50 + "..."
    });

    test("short content auto-summary has no ellipsis", () => {
        const section12 = findSection(result, "1.2");
        expect(section12).toBeDefined();
        expect(section12?.summary).toBe("Short content.");
        expect(section12?.summary.endsWith("...")).toBe(false);
    });

    test("deep nesting IDs are correct", () => {
        const deep = findSection(result, "2.1.1");
        expect(deep).toBeDefined();
        expect(deep?.title).toBe("Deep Section 2.1.1");
    });
});

describe("parseMarkdown – single.md", () => {
    const result = parseMarkdown(fixturePath("single.md"));

    test("single top-level section has ID 1", () => {
        expect(result.sections).toHaveLength(1);
        expect(result.sections[0].id).toBe("1");
    });

    test("single section has no children", () => {
        expect(result.sections[0].children).toHaveLength(0);
    });
});

describe("findSection", () => {
    const result = parseMarkdown(fixturePath("sample.md"));

    test("finds a top-level section", () => {
        const s = findSection(result, "1");
        expect(s).toBeDefined();
        expect(s?.title).toBe("Project Overview");
    });

    test("finds a deeply nested section", () => {
        const s = findSection(result, "1.1.1");
        expect(s).toBeDefined();
        expect(s?.title).toBe("Installation");
    });

    test("returns undefined for non-existent ID", () => {
        const s = findSection(result, "99.99");
        expect(s).toBeUndefined();
    });
});

describe("buildBreadcrumb", () => {
    const result = parseMarkdown(fixturePath("sample.md"));

    test("top-level section breadcrumb is just the title", () => {
        const s = findSection(result, "1") as Section;
        expect(buildBreadcrumb(s)).toBe("Project Overview");
    });

    test("nested section has full breadcrumb", () => {
        const s = findSection(result, "1.1.1") as Section;
        expect(buildBreadcrumb(s)).toBe("Project Overview > Getting Started > Installation");
    });
});

describe("Context-aware parsing: Code blocks", () => {
    const result = parseMarkdown(fixturePath("codeblock.md"));

    test("does not detect headings inside code blocks", () => {
        // Should only have 4 sections (Section 1-4), not additional sections from code block content
        expect(result.sections).toHaveLength(4);
        expect(result.sections[0].id).toBe("1");
        expect(result.sections[1].id).toBe("2");
        expect(result.sections[2].id).toBe("3");
        expect(result.sections[3].id).toBe("4");
    });

    test("assigns correct IDs when code blocks are present", () => {
        expect(result.sections[0].title).toBe("Section 1: Basic Code Block");
        expect(result.sections[1].title).toBe("Section 2: Code Block with Language");
        expect(result.sections[2].title).toBe("Section 3: TypeScript Example");
        expect(result.sections[3].title).toBe("Section 4: Multiple Code Blocks");
    });

    test("section content includes code block content", () => {
        const section1 = result.sections[0];
        // Content should include the code block lines (but not be parsed as subsections)
        expect(section1.content).toContain("# This is NOT a heading");
        expect(section1.content).toContain("## This is also NOT a heading");
    });

    test("handles language-specified code blocks correctly", () => {
        const section2 = result.sections[1];
        expect(section2.content).toContain("# Install dependencies");
        expect(section2.content).toContain("npm install");
    });

    test("no false subsections are created", () => {
        // Each section should have zero children
        expect(result.sections[0].children).toHaveLength(0);
        expect(result.sections[1].children).toHaveLength(0);
        expect(result.sections[2].children).toHaveLength(0);
        expect(result.sections[3].children).toHaveLength(0);
    });

    test("existing fixtures still parse correctly (regression test)", () => {
        const sampleResult = parseMarkdown(fixturePath("sample.md"));
        expect(sampleResult.sections).toHaveLength(2);
        expect(sampleResult.sections[0].id).toBe("1");

        const deepResult = parseMarkdown(fixturePath("deep.md"));
        expect(deepResult.sections.length).toBeGreaterThan(0);

        const singleResult = parseMarkdown(fixturePath("single.md"));
        expect(singleResult.sections).toHaveLength(1);
    });
});

describe("Context-aware parsing: Blockquotes", () => {
    const result = parseMarkdown(fixturePath("blockquote.md"));

    test("does not detect headings inside blockquotes", () => {
        // Should only have 4 top-level sections, not additional from blockquote content
        expect(result.sections).toHaveLength(4);
        expect(result.sections[0].id).toBe("1");
        expect(result.sections[1].id).toBe("2");
        expect(result.sections[2].id).toBe("3");
        expect(result.sections[3].id).toBe("4");
    });

    test("assigns correct titles to sections", () => {
        expect(result.sections[0].title).toBe("Section Before Blockquote");
        expect(result.sections[1].title).toBe("Section After Blockquote");
        expect(result.sections[2].title).toBe("Section With Mixed Blockquote and Code");
        expect(result.sections[3].title).toBe("Section After All");
    });

    test("blockquote content is included in the parent section content", () => {
        const section1 = result.sections[0];
        // The blockquote lines should be in the content of Section 1
        expect(section1.content).toContain("> # This is NOT a heading (blockquote level 1)");
    });

    test("ignores nested blockquote headings (>> and >>>)", () => {
        // Subsection should only have 0 children (the nested blockquotes are not parsed as sections)
        const section2 = result.sections[1];
        expect(section2.children).toHaveLength(1);
        const subsection = section2.children[0];
        expect(subsection.title).toBe("Subsection with Nested Blockquote");
        expect(subsection.children).toHaveLength(0);
    });

    test("IDs remain sequential after blockquotes", () => {
        // IDs should be 1, 2, 3, 4 without gaps caused by false blockquote headings
        expect(result.sections[0].id).toBe("1");
        expect(result.sections[1].id).toBe("2");
        expect(result.sections[2].id).toBe("3");
        expect(result.sections[3].id).toBe("4");
    });

    test("no false subsections created from blockquote lines", () => {
        // Section 1 should have no children (the > ## line is NOT a subsection)
        expect(result.sections[0].children).toHaveLength(0);
    });

    test("existing fixtures still parse correctly (regression test)", () => {
        const sampleResult = parseMarkdown(fixturePath("sample.md"));
        expect(sampleResult.sections).toHaveLength(2);
        expect(sampleResult.sections[0].id).toBe("1");

        const codeblockResult = parseMarkdown(fixturePath("codeblock.md"));
        expect(codeblockResult.sections).toHaveLength(4);
    });
});

// ---------------------------------------------------------------------------
// Front matter parsing
// ---------------------------------------------------------------------------
describe("parseMarkdown – frontmatter.md (YAML front matter)", () => {
    const result = parseMarkdown(fixturePath("frontmatter.md"));

    test("frontMatter is defined", () => {
        expect(result.frontMatter).toBeDefined();
    });

    test("parses string values", () => {
        expect(result.frontMatter?.title).toBe("Installation Guide");
        expect(result.frontMatter?.author).toBe("Lambda-deep");
    });

    test("parses numeric values", () => {
        expect(result.frontMatter?.version).toBe(2);
    });

    test("parses boolean values", () => {
        expect(result.frontMatter?.draft).toBe(false);
    });

    test("does not include front matter lines as section content", () => {
        // Sections should start after the front matter block
        expect(result.sections).toHaveLength(1);
        expect(result.sections[0].title).toBe("Installation Guide");
    });

    test("sections have correct IDs after front matter", () => {
        expect(result.sections[0].id).toBe("1");
        expect(result.sections[0].children[0].id).toBe("1.1");
    });
});

describe("parseMarkdown – sample.md (no front matter)", () => {
    test("frontMatter is undefined when file has no front matter", () => {
        const result = parseMarkdown(fixturePath("sample.md"));
        expect(result.frontMatter).toBeUndefined();
    });
});

// ---------------------------------------------------------------------------
// Edge case: empty file
// ---------------------------------------------------------------------------
describe("parseMarkdown – empty.md", () => {
    const result = parseMarkdown(fixturePath("empty.md"));

    test("returns empty sections array", () => {
        expect(result.sections).toHaveLength(0);
    });

    test("frontMatter is undefined", () => {
        expect(result.frontMatter).toBeUndefined();
    });
});

// ---------------------------------------------------------------------------
// Edge case: file with no headings (text only)
// ---------------------------------------------------------------------------
describe("parseMarkdown – noheadings.md", () => {
    const result = parseMarkdown(fixturePath("noheadings.md"));

    test("returns empty sections array when no headings are present", () => {
        expect(result.sections).toHaveLength(0);
    });

    test("frontMatter is undefined", () => {
        expect(result.frontMatter).toBeUndefined();
    });
});

// ---------------------------------------------------------------------------
// Edge case: skipped heading level (orphan section)
// ---------------------------------------------------------------------------
describe("parseMarkdown – skipped-level.md (orphan section)", () => {
    const result = parseMarkdown(fixturePath("skipped-level.md"));

    test("orphan section (h3 with no h2 parent) becomes a root section", () => {
        expect(result.sections).toHaveLength(2);
        expect(result.sections[1].id).toBe("1.0.1");
        expect(result.sections[1].parent).toBeNull();
    });

    test("orphan section retains its original level", () => {
        expect(result.sections[1].level).toBe(3);
        expect(result.sections[1].title).toBe("Orphan Section");
    });

    test("top-level section has no children due to skipped level", () => {
        expect(result.sections[0].children).toHaveLength(0);
    });

    test("orphan section has its own content", () => {
        expect(result.sections[1].content).toContain("Content of orphan section.");
    });
});

// ---------------------------------------------------------------------------
// Edge case: sections with no body content (adjacent headings)
// ---------------------------------------------------------------------------
describe("parseMarkdown – no-content.md (empty sections)", () => {
    const result = parseMarkdown(fixturePath("no-content.md"));

    test("sections with no body content have empty content string", () => {
        expect(result.sections[0].content).toBe("");
        expect(findSection(result, "1.1")?.content).toBe("");
        expect(findSection(result, "1.1.1")?.content).toBe("");
        expect(result.sections[1].content).toBe("");
    });

    test("sections with no body content have empty summary", () => {
        expect(result.sections[0].summary).toBe("");
        expect(result.sections[1].summary).toBe("");
    });

    test("hierarchy is preserved even with no body content", () => {
        expect(result.sections).toHaveLength(2);
        expect(result.sections[0].id).toBe("1");
        expect(result.sections[0].children[0].id).toBe("1.1");
        expect(result.sections[0].children[0].children[0].id).toBe("1.1.1");
        expect(result.sections[1].id).toBe("2");
    });
});

// ---------------------------------------------------------------------------
// Edge case: heading levels h4, h5, h6
// ---------------------------------------------------------------------------
describe("parseMarkdown – h456.md (heading levels 4-6)", () => {
    const result = parseMarkdown(fixturePath("h456.md"));

    test("h4 has correct id and level", () => {
        const s = findSection(result, "1.1.1.1");
        expect(s).toBeDefined();
        expect(s?.level).toBe(4);
        expect(s?.title).toBe("H4");
    });

    test("h5 has correct id and level", () => {
        const s = findSection(result, "1.1.1.1.1");
        expect(s).toBeDefined();
        expect(s?.level).toBe(5);
        expect(s?.title).toBe("H5");
    });

    test("h6 has correct id and level", () => {
        const s = findSection(result, "1.1.1.1.1.1");
        expect(s).toBeDefined();
        expect(s?.level).toBe(6);
        expect(s?.title).toBe("H6");
    });

    test("h6 parent is h5", () => {
        const h6 = findSection(result, "1.1.1.1.1.1");
        expect(h6?.parent?.id).toBe("1.1.1.1.1");
    });

    test("h4-h6 sections have no children", () => {
        expect(findSection(result, "1.1.1.1")?.children).toHaveLength(1);
        expect(findSection(result, "1.1.1.1.1")?.children).toHaveLength(1);
        expect(findSection(result, "1.1.1.1.1.1")?.children).toHaveLength(0);
    });
});

// ---------------------------------------------------------------------------
// Edge case: summary comment edge cases
// ---------------------------------------------------------------------------
describe("parseMarkdown – summary-edge.md", () => {
    const result = parseMarkdown(fixturePath("summary-edge.md"));

    test("empty summary comment results in empty string summary", () => {
        expect(result.sections[0].summary).toBe("");
    });

    test("content is still available when summary comment is empty", () => {
        expect(result.sections[0].content).toContain("Fallback text");
    });

    test("first of multiple summary comments is used", () => {
        expect(result.sections[1].summary).toBe("First summary here");
    });

    test("second summary comment is ignored", () => {
        expect(result.sections[1].summary).not.toBe("Second comment should be ignored");
    });
});

// ---------------------------------------------------------------------------
// Edge case: text before the first heading (pre-section text)
// ---------------------------------------------------------------------------
describe("parseMarkdown – presection.md (text before first heading)", () => {
    const result = parseMarkdown(fixturePath("presection.md"));

    test("only one section is created from the heading", () => {
        expect(result.sections).toHaveLength(1);
        expect(result.sections[0].title).toBe("First Section");
    });

    test("text before the first heading is not included in any section content", () => {
        expect(result.sections[0].content).not.toContain("before any heading");
        expect(result.sections[0].content).not.toContain("should not be included");
    });

    test("section content contains only post-heading text", () => {
        expect(result.sections[0].content).toContain("Content of first section.");
    });
});
