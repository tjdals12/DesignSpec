import { Command } from "commander";

import { createRequire } from "node:module";
import path from "node:path";
import fs from "node:fs/promises";

import { getSupportedToolIds } from "../core/tool-detection.js";
import dedent from "dedent";
import ora from "ora";

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
    dedent`
    Examples:
      $ design-spec init
      $ design-spec init ./path/to
      $ design-spec init --tools=codex,claude
  `,
  )
  .action(async (targetPath = ".", options: { tools?: string }) => {
    try {
      const resolvedPath = path.resolve(targetPath);

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
            await fs.mkdir(resolvedPath, { recursive: true });
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
      ora().fail(`Error: ${message}`);
      process.exit(1);
    }
  });

program
  .command("status [path]")
  .description("Display artifact completion status for a change")
  .option("--change <id>", "Change name to show status for")
  .option("--json", "Output as JSON")
  .action(
    async (targetPath = ".", options: { change: string; json: boolean }) => {
      try {
        const resolvedPath = path.resolve(targetPath);

        try {
          const stats = await fs.stat(resolvedPath);
          if (!stats.isDirectory()) {
            throw new Error(`Path "${targetPath}" is not directory`);
          }
        } catch (error) {
          if (
            error instanceof Error &&
            "code" in error &&
            error.code === "ENOENT"
          ) {
            throw new Error(
              "DesignSpec is not initialized. Run: design-spec init",
            );
          }
          throw error;
        }

        const { StatusCommand } =
          await import("../workflows/commands/status.js");
        const statusCommand = new StatusCommand(options);
        await statusCommand.execute(targetPath);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        ora().fail(`Error: ${message}`);
        process.exit(1);
      }
    },
  );

program
  .command("new [path]")
  .description("Create a new change directory")
  .option("--change <id>", "Name for new change")
  .action(async (targetPath: string = ".", options: { change: string }) => {
    try {
      const resolvedPath = path.resolve(targetPath);

      try {
        const stats = await fs.stat(resolvedPath);
        if (!stats.isDirectory()) {
          throw new Error(`Path "${targetPath}" is not directory`);
        }
      } catch (error) {
        if (
          error instanceof Error &&
          "code" in error &&
          error.code === "ENOENT"
        ) {
          throw new Error(
            "DesignSpec is not initialized. Run: design-spec init",
          );
        }
        throw error;
      }

      const { NewChangeCommand } =
        await import("../workflows/commands/new-change.js");
      const newChangeCommand = new NewChangeCommand(options);
      await newChangeCommand.execute(targetPath);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      ora().fail(`Error: ${message}`);
      process.exit(1);
    }
  });

program
  .command("instructions [path]")
  .option("--change <id>", "Change name")
  .option("--artifact <id>", "Artifact name")
  .option("--json", "Output as JSON")
  .action(
    async (
      targetPath: string = ".",
      options: { change: string; artifact: string; json: boolean },
    ) => {
      try {
        const resolvedPath = path.resolve(targetPath);

        try {
          const stats = await fs.stat(resolvedPath);
          if (!stats.isDirectory()) {
            throw new Error(`Path "${targetPath}" is not directory`);
          }
        } catch (error) {
          if (
            error instanceof Error &&
            "code" in error &&
            error.code === "ENOENT"
          ) {
            throw new Error(
              "DesignSpec is not initialized. Run: design-spec init",
            );
          }
          throw error;
        }

        const { InstructionsCommand } =
          await import("../workflows/commands/instructions.js");
        const instructionsCommand = new InstructionsCommand(options);
        await instructionsCommand.execute(targetPath);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        ora().fail(`Error: ${message}`);
        process.exit(1);
      }
    },
  );

program.parse();
