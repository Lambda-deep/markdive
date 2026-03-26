#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const parser_1 = require("./parser");
const outline_1 = require("./commands/outline");
const inspect_1 = require("./commands/inspect");
const read_1 = require("./commands/read");
const program = new commander_1.Command();
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
    .action((file, options) => {
    const result = (0, parser_1.parseMarkdown)(file);
    (0, outline_1.runOutline)(result, {
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
    .action((file, options) => {
    const result = (0, parser_1.parseMarkdown)(file);
    (0, inspect_1.runInspect)(result, { path: options.path, json: options.json });
});
// ---------------------------------------------------------------------------
// read
// ---------------------------------------------------------------------------
program
    .command("read <file>")
    .description("指定したパスのセクション本文を全文出力する")
    .requiredOption("--path <id>", "読み込むセクションID（例: \"2.1\"）")
    .action((file, options) => {
    const result = (0, parser_1.parseMarkdown)(file);
    (0, read_1.runRead)(result, { path: options.path });
});
program.parse(process.argv);
//# sourceMappingURL=cli.js.map