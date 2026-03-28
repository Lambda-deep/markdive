import * as path from "path";
import { parseMarkdown, findSection, buildBreadcrumb } from "../src/parser";
import { Section } from "../src/types";

const fixturePath = (name: string) =>
  path.join(__dirname, "fixtures", name);

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
    const summary = section11!.summary;
    // Should be truncated (original content is > 50 chars)
    expect(summary.endsWith("...")).toBe(true);
    expect(summary.length).toBeLessThanOrEqual(53); // 50 + "..."
  });

  test("short content auto-summary has no ellipsis", () => {
    const section12 = findSection(result, "1.2");
    expect(section12).toBeDefined();
    expect(section12!.summary).toBe("Short content.");
    expect(section12!.summary.endsWith("...")).toBe(false);
  });

  test("deep nesting IDs are correct", () => {
    const deep = findSection(result, "2.1.1");
    expect(deep).toBeDefined();
    expect(deep!.title).toBe("Deep Section 2.1.1");
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
    expect(s!.title).toBe("Project Overview");
  });

  test("finds a deeply nested section", () => {
    const s = findSection(result, "1.1.1");
    expect(s).toBeDefined();
    expect(s!.title).toBe("Installation");
  });

  test("returns undefined for non-existent ID", () => {
    const s = findSection(result, "99.99");
    expect(s).toBeUndefined();
  });
});

describe("buildBreadcrumb", () => {
  const result = parseMarkdown(fixturePath("sample.md"));

  test("top-level section breadcrumb is just the title", () => {
    const s = findSection(result, "1")!;
    expect(buildBreadcrumb(s)).toBe("Project Overview");
  });

  test("nested section has full breadcrumb", () => {
    const s = findSection(result, "1.1.1")!;
    expect(buildBreadcrumb(s)).toBe(
      "Project Overview > Getting Started > Installation"
    );
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
