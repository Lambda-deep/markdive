#!/usr/bin/env node
import { Command } from "commander";
import { parseMarkdown } from "./parser";
import { runOutline } from "./commands/outline";
import { runInspect } from "./commands/inspect";
import { runRead } from "./commands/read";

const program = new Command();

program
  .name("md-dive")
  .description("Hierarchical Markdown Structure Navigator for AI agents and humans")
  .version("0.1.0");

// ---------------------------------------------------------------------------
// outline
// ---------------------------------------------------------------------------
program
  .command("outline <file>")
  .description("Print the first N levels of the document structure (default: depth 2)")
  .option("--json", "Output as JSON", false)
  .option("--depth <n>", "Maximum heading depth to display", "2")
  .action((file: string, options: { json: boolean; depth: string }) => {
    const result = parseMarkdown(file);
    runOutline(result, {
      depth: parseInt(options.depth, 10),
      json: options.json,
    });
  });

// ---------------------------------------------------------------------------
// inspect
// ---------------------------------------------------------------------------
program
  .command("inspect <file>")
  .description("List the immediate sub-sections of the section at the given path")
  .requiredOption("--path <id>", "Section ID to inspect, e.g. \"2\" or \"1.3\"")
  .option("--json", "Output as JSON", false)
  .action((file: string, options: { path: string; json: boolean }) => {
    const result = parseMarkdown(file);
    runInspect(result, { path: options.path, json: options.json });
  });

// ---------------------------------------------------------------------------
// read
// ---------------------------------------------------------------------------
program
  .command("read <file>")
  .description("Output the full content of the section at the given path")
  .requiredOption("--path <id>", "Section ID to read, e.g. \"2.1\"")
  .action((file: string, options: { path: string }) => {
    const result = parseMarkdown(file);
    runRead(result, { path: options.path });
  });

program.parse(process.argv);
