#!/usr/bin/env node
import { Command } from "commander";
import { runDive } from "./commands/dive";
import { runRead } from "./commands/read";
import { parseMarkdown } from "./parser";

const program = new Command();

program
    .name("markdive")
    .description("AIエージェントと人間のための階層的Markdownナビゲーター")
    .version("0.2.0");

// ---------------------------------------------------------------------------
// dive
// ---------------------------------------------------------------------------
program
    .command("dive <file>")
    .description("ドキュメント構造を段階的に探索して出力する（デフォルト: 深さ2）")
    .option("--json", "JSON形式で出力する", false)
    .option("--path <id>", '探索を開始するセクションID（例: "2" または "1.3"）')
    .option("--depth <n>", "表示する見出しの最大深さ", "2")
    .action((file: string, options: { json: boolean; path?: string; depth: string }) => {
        const result = parseMarkdown(file);
        runDive(result, {
            depth: parseInt(options.depth, 10),
            json: options.json,
            path: options.path,
        });
    });

// ---------------------------------------------------------------------------
// read
// ---------------------------------------------------------------------------
program
    .command("read <file>")
    .description("指定したパスのセクション本文を全文出力する")
    .requiredOption("--path <id>", '読み込むセクションID（例: "2.1"）')
    .action((file: string, options: { path: string }) => {
        const result = parseMarkdown(file);
        runRead(result, { path: options.path });
    });

program.parse(process.argv);
