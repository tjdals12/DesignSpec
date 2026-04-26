import { Command } from "commander";

import { createRequire } from "node:module";
import path from "node:path";
import fs from "node:fs/promises";

import { getSupportedToolIds } from "../core/tool-detection.js";

const program = new Command();
const require = createRequire(import.meta.url);
const { version } = require("../../package.json");

program.name("design-spec").version(version);

const availableToolIds = getSupportedToolIds();
const toolsOptionDescription = `Configure AI tools non-interactively. Use "all", "none", or a comma-separated list of: ${availableToolIds.join(", ")}`;

program
  .command("init [path]")
  .description("Initialize DesignSpec in your project")
  .option("--tools <tools>", toolsOptionDescription)
  .addHelpText(
    "after",
    `
Examples:
  $ design-spec init
  $ design-spec init ./path/to
  $ design-spec init --tools=codex,claude
  `,
  )
  .action(async (targetPath = ".", options: { tools?: string }) => {
    try {
      const resolvedPath = path.resolve(targetPath);

      // TODO
      try {
        const stats = await fs.stat(resolvedPath);
        if (!stats.isDirectory()) {
          throw new Error(`Path "${targetPath}" is not a directory`);
        }
      } catch (error) {
        if (error instanceof Error && "code" in error) {
          if (error.code === "ENOENT") {
            console.log(
              `Directory "${targetPath}" doesn't exist, it will be created.`,
            );
          } else {
            throw error;
          }
        } else {
          throw error;
        }
      }

      const { InitCommand } = await import("../core/commands/init.js");
      const initCommand = new InitCommand(options);
      await initCommand.execute(targetPath);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`Error: ${message}`);
      process.exit(1);
    }
  });

program.parse();
