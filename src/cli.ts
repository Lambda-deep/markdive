#!/usr/bin/env node
import { Command } from "commander";
import { parseMarkdown } from "./parser";
import { runOutline } from "./commands/outline";
import { runInspect } from "./commands/inspect";
import { runRead } from "./commands/read";

const program = new Command();

program
  .name("md-dive")
  .description("AIエージェントと人間のための階層的Markdownナビゲーター")
  .version("0.1.0");

// ---------------------------------------------------------------------------
// outline
// ---------------------------------------------------------------------------
program
  .command("outline <file>")
  .description("ドキュメント構造の最初のN階層を出力する（デフォルト: 深さ2）")
  .option("--json", "JSON形式で出力する", false)
  .option("--depth <n>", "表示する見出しの最大深さ", "2")
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
  .description("指定したパスのセクション直下のサブセクション一覧を表示する")
  .requiredOption("--path <id>", "参照するセクションID（例: \"2\" または \"1.3\"）")
  .option("--json", "JSON形式で出力する", false)
  .action((file: string, options: { path: string; json: boolean }) => {
    const result = parseMarkdown(file);
    runInspect(result, { path: options.path, json: options.json });
  });

// ---------------------------------------------------------------------------
// read
// ---------------------------------------------------------------------------
program
  .command("read <file>")
  .description("指定したパスのセクション本文を全文出力する")
  .requiredOption("--path <id>", "読み込むセクションID（例: \"2.1\"）")
  .action((file: string, options: { path: string }) => {
    const result = parseMarkdown(file);
    runRead(result, { path: options.path });
  });

program.parse(process.argv);
