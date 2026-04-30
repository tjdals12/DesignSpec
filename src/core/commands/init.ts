import ora from "ora";
import chalk from "chalk";
import { isEmpty, isUndefined } from "es-toolkit/compat";

import path from "node:path";

import {
  DESIGN_SPEC_DIR_NAME,
  type AIToolInfo,
  type AIToolOption,
} from "../config.js";
import { FileSystemUtils } from "../../utils/file-system.utils.js";
import {
  getInstalledTools,
  getSupportedToolIds,
  getToolById,
  getToolStates,
  type ToolSkillStatus,
} from "../tool-detection.js";
import {
  generateSkillContent,
  getSkillTemplates,
} from "../skills/skill-generation.js";
import { getSlashCommandTemplates } from "../slash-commands/slash-command-generation.js";
import { SlashCommandAdapterRegistry } from "../slash-commands/slash-command-adapter-registry.js";
import {
  buildArchivesDirPath,
  buildChangesDirPath,
} from "../change/paths.js";
import { buildSpecsDirPath } from "../spec/paths.js";
import { PALETTE, PROGRESS_SPINNER } from "../ui.js";

interface SetupResults {
  createdTools: Array<AIToolInfo>;
  refreshedTools: Array<AIToolInfo>;
  failedTools: Array<{ name: string; error: string }>;
  commandSkipped: Array<AIToolInfo["value"]>;
}

export class InitCommand {
  private readonly _tools?: string | undefined;

  constructor(options: { tools?: string }) {
    this._tools = options.tools;
  }

  async execute(targetPath: string): Promise<void> {
    const projectPath = path.resolve(targetPath);
    const designSpecPath = path.join(projectPath, DESIGN_SPEC_DIR_NAME);

    const hasPermissions =
      await FileSystemUtils.ensureWritePermissions(projectPath);
    if (!hasPermissions) {
      throw new Error(`Insufficient permissions to write to ${projectPath}`);
    }

    const extendMode = await FileSystemUtils.directoryExists(designSpecPath);

    const installedTools = await getInstalledTools(projectPath);

    const toolStates = getToolStates(projectPath);

    const selectedToolIds = await this.getSelectedToolIds({
      projectPath,
      extendMode,
      installedTools,
      toolStates,
    });

    const validatedTools = this.validateTools(toolStates, selectedToolIds);

    await this.createDirectoryStructure(projectPath, extendMode);

    const results = await this.generateSkillsAndCommands(
      projectPath,
      validatedTools,
    );

    this.printResults(results);
  }

  private resolveTools(): string[] {
    const raw = isUndefined(this._tools) ? "" : this._tools.trim();
    if (isEmpty(raw)) {
      throw new Error(
        'The --tools option requires a value. Use "all", "none", or a comma-seperated list of tool IDs',
      );
    }

    const supportedToolIds = getSupportedToolIds();
    const supportedSet = new Set(supportedToolIds);
    const supportedList = ["all", "none", ...supportedToolIds].join(", ");

    if (raw === "all") {
      return supportedToolIds;
    }

    if (raw === "none") {
      return [];
    }

    const tokens = raw
      .split(",")
      .map((token) => token.trim())
      .filter((token) => !isEmpty(token));

    if (isEmpty(tokens)) {
      throw new Error(
        'The --tools option requires at least one tool ID when not using "all" or "none".',
      );
    }

    const hasAllOrNone = tokens.some(
      (token) => token === "all" || token === "none",
    );
    if (hasAllOrNone) {
      throw new Error(
        'Cannot combine reserved values "all" or "none" with specific tool IDs.',
      );
    }

    const invalidTokens = tokens.filter((token) => !supportedSet.has(token));
    if (invalidTokens.length > 0) {
      throw new Error(
        `Invalid tool(s): ${invalidTokens.join(", ")}. Available values: ${supportedList}`,
      );
    }

    const deduped = [...new Set(tokens)];

    return deduped;
  }

  // TODO
  private async getSelectedToolIds(args: {
    projectPath: string;
    extendMode: boolean;
    installedTools: AIToolOption[];
    toolStates: Map<string, ToolSkillStatus>;
  }): Promise<string[]> {
    return this.resolveTools();
  }

  private validateTools(
    toolStates: Map<AIToolOption["value"], ToolSkillStatus>,
    toolIds: string[],
  ): Array<AIToolInfo> {
    const validatedTools: AIToolInfo[] = [];

    for (const toolId of toolIds) {
      const tool = getToolById(toolId)!;

      if (isUndefined(tool.skillsDir)) {
        const supportedToolIds = getSupportedToolIds();
        throw new Error(
          `Tool '${toolId}' does not support skill generation.\nTools with skill generation support:\n  ${supportedToolIds.join("\n  ")}`,
        );
      }

      const toolState = toolStates.get(tool.value);
      validatedTools.push({
        ...tool,
        wasConfigured: toolState?.configured ?? false,
      });
    }

    return validatedTools;
  }

  private async createDirectoryStructure(
    projectPath: string,
    extendMode: boolean,
  ): Promise<void> {
    const directories = [
      path.join(projectPath, DESIGN_SPEC_DIR_NAME),
      buildChangesDirPath(projectPath),
      buildArchivesDirPath(projectPath),
      buildSpecsDirPath(projectPath),
    ];

    const spinner = extendMode
      ? null
      : ora({
          text: "Creating DesignSpec structure...",
          stream: process.stdout,
          color: "gray",
          spinner: PROGRESS_SPINNER,
        }).start();

    for (const dir of directories) {
      await FileSystemUtils.createDirectory(dir);
    }

    spinner?.stopAndPersist({
      symbol: PALETTE.white("▌"),
      text: PALETTE.white("DesignSpec structure created"),
    });
  }

  private async generateSkillsAndCommands(
    projectPath: string,
    tools: Array<AIToolInfo>,
  ): Promise<SetupResults> {
    const createdTools: Array<AIToolInfo> = [];
    const refreshedTools: Array<AIToolInfo> = [];
    const failedTools: Array<{ name: string; error: string }> = [];
    const commandSkipped: Array<AIToolInfo["value"]> = [];

    const skillTemplates = getSkillTemplates();
    const slashCommandTemplates = getSlashCommandTemplates();

    for (const tool of tools) {
      const spinner = ora(`Setting up ${tool.name}...`).start();

      try {
        const skillsDir = path.join(projectPath, tool.skillsDir, "skills");

        for (const { id, template } of skillTemplates) {
          const skillDir = path.join(skillsDir, id);
          const skillFile = path.join(skillDir, "SKILL.md");
          const skillContent = generateSkillContent(template);

          await FileSystemUtils.writeFile(skillFile, skillContent);
        }

        const adapter = SlashCommandAdapterRegistry.get(tool.value);
        if (adapter) {
          for (const { id, template } of slashCommandTemplates) {
            const slashCommandFilePath = adapter.getFilePath(id);
            const slashCommandFile = path.isAbsolute(slashCommandFilePath)
              ? slashCommandFilePath
              : path.join(projectPath, slashCommandFilePath);
            const slashCommandContent = adapter.formatFile(template);

            await FileSystemUtils.writeFile(
              slashCommandFile,
              slashCommandContent,
            );
          }
        } else {
          commandSkipped.push(tool.value);
        }

        spinner.succeed(`Setup complete for ${tool.name}`);

        if (tool.wasConfigured) {
          refreshedTools.push(tool);
        } else {
          createdTools.push(tool);
        }
      } catch (error) {
        spinner.fail(`Failed for ${tool.name}`);
        const message = error instanceof Error ? error.message : String(error);
        failedTools.push({ name: tool.name, error: message });
      }
    }

    return {
      createdTools,
      refreshedTools,
      failedTools,
      commandSkipped,
    };
  }

  private printResults(results: SetupResults) {
    console.log();
    console.log(chalk.bold("DesignSpec Setup Complete"));
    console.log();

    const { createdTools, refreshedTools, failedTools, commandSkipped } =
      results;
    if (createdTools.length > 0) {
      console.log(
        `Created: ${createdTools.map((tool) => tool.name).join(", ")}`,
      );
    }
    if (refreshedTools.length > 0) {
      console.log(
        `Refreshed: ${refreshedTools.map((tool) => tool.name).join(", ")}`,
      );
    }

    const successfulTools = [...createdTools, ...refreshedTools];
    if (successfulTools.length > 0) {
      const toolDirs = [
        ...new Set(
          successfulTools.map((tool) => path.join(tool.skillsDir, "/")),
        ),
      ].join(", ");
      const skillCount = getSkillTemplates().length;
      const commandCount = getSlashCommandTemplates().length;
      if (skillCount > 0 && commandCount > 0) {
        console.log(
          `${skillCount} skills and ${commandCount} commands in ${toolDirs}`,
        );
      } else if (skillCount > 0) {
        console.log(`${skillCount} skills in ${toolDirs}`);
      } else if (commandCount > 0) {
        console.log(`${commandCount} commands in ${toolDirs}`);
      }
    }

    if (failedTools.length > 0) {
      console.log(
        chalk.red(
          `Failed: ${failedTools.map((tool) => `${tool.name} (${tool.error})`).join(", ")}`,
        ),
      );
    }

    if (commandSkipped.length > 0) {
      console.log(
        chalk.dim(
          `Commands skipped for: ${commandSkipped.join(", ")} (no adapter)`,
        ),
      );
    }

    if (createdTools.length > 0 || refreshedTools.length > 0) {
      console.log();
      console.log(
        chalk.white("Restart your IDE for slash commands to take effect."),
      );
    }

    console.log();
  }
}
