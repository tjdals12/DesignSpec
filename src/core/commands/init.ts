import ora from "ora";
import chalk from "chalk";
import { isEmpty, isUndefined } from "es-toolkit/compat";

import path from "node:path";
import fs from "node:fs/promises";

import { DESIGN_SPEC_DIR_NAME, type AIToolInfo, type AIToolOption } from "../config.js";
import { FileSystemUtils } from "#utils/file-system.utils.js";
import {
  getInstalledTools,
  getSupportedToolIds,
  getToolById,
  getToolStates,
  type ToolSkillStatus,
} from "../tool-detection.js";
import { generateSkillContent, getSkillTemplates } from "../skills/skill-generation.js";
import { getSlashCommandTemplates } from "../slash-commands/slash-command-generation.js";
import { SlashCommandAdapterRegistry } from "../slash-commands/slash-command-adapter-registry.js";
import { buildArchivesDirPath, buildChangesDirPath } from "../change/paths.js";
import { buildSpecsDirPath } from "../spec/paths.js";
import { buildStylesDirPath } from "../styles/paths.js";
import { buildConfigPaths } from "../project-config/paths.js";
import { PALETTE, PROGRESS_SPINNER } from "../ui.js";
import { showWelcomeScreen } from "../welcome-screen.js";
import { isInteractive } from "#utils/interactive.utils.js";

const STARTER_CONFIG_CONTENT = `# DesignSpec project configuration.
#
# Both \`context\` and \`contextFiles\` are merged into a single <project_context>
# block that is injected into every artifact-instructions and apply-instructions
# output, so anything here is present every time the agent works on this project.
#
# \`context\` — inline notes written directly in this file.
# Use it for short, project-specific guidance.
#
# Examples of what to include:
# - Tech stack (framework, styling system, component library)
# - Visual personality (dense B2B vs airy SaaS, monochrome vs colorful)
# - Spacing / typography conventions
# - References to existing style sources (Tailwind config path, design tokens)
#
# context: |
#   Tech stack: React + Tailwind, shadcn/ui as base
#   Density: dense, scannable — this is a B2B admin tool
#   Color: monochrome with one accent (blue-600)
#   Spacing: 4px base, multiples of 4
#
# \`contextFiles\` — paths (relative to project root) to markdown files whose
# contents should be inlined into the <project_context> block. Useful for
# pulling in an existing design system file (e.g., interface-design's
# .interface-design/system.md) without duplicating its content here.
# Each file is labeled with \`[from <path>]\` in the output.
#
# contextFiles:
#   - .interface-design/system.md
#   - docs/ui-conventions.md
`;

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

    const hasPermissions = await FileSystemUtils.ensureWritePermissions(projectPath);
    if (!hasPermissions) {
      throw new Error(`Insufficient permissions to write to ${projectPath}`);
    }

    const extendMode = await FileSystemUtils.directoryExists(designSpecPath);

    const installedTools = await getInstalledTools(projectPath);

    const toolStates = getToolStates(projectPath);

    if (this.canPromptInteractively()) {
      await showWelcomeScreen();
    }

    const selectedToolIds = await this.getSelectedToolIds({
      projectPath,
      extendMode,
      installedTools,
      toolStates,
    });

    const validatedTools = this.validateTools(toolStates, selectedToolIds);

    await this.createDirectoryStructure(projectPath, extendMode);

    await this.scaffoldConfigFile(projectPath);

    const results = await this.generateSkillsAndCommands(projectPath, validatedTools);

    this.printResults(results);
  }

  private resolveTools(): string[] {
    const raw = isUndefined(this._tools) ? "" : this._tools.trim();
    if (isEmpty(raw)) {
      throw new Error(
        'The --tools option requires a value. Use "all", "none", or a comma-separated list of tool IDs',
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

    const hasAllOrNone = tokens.some((token) => token === "all" || token === "none");
    if (hasAllOrNone) {
      throw new Error('Cannot combine reserved values "all" or "none" with specific tool IDs.');
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

  private canPromptInteractively(): boolean {
    if (!isUndefined(this._tools)) return false;
    return isInteractive();
  }

  private async getSelectedToolIds(args: {
    projectPath: string;
    extendMode: boolean;
    installedTools: AIToolOption[];
    toolStates: Map<string, ToolSkillStatus>;
  }): Promise<string[]> {
    if (!isUndefined(this._tools)) {
      return this.resolveTools();
    }

    const { extendMode, installedTools, toolStates } = args;
    const supportedToolIds = getSupportedToolIds();
    const detectedToolIds = new Set(installedTools.map((tool) => tool.value));
    const configuredToolIds = new Set(
      [...toolStates.entries()].filter(([, status]) => status.configured).map(([toolId]) => toolId),
    );
    // Pre-check detected tools only on a fresh setup; on an extend/refresh run we
    // pre-check the already-configured ones instead.
    const shouldPreselectDetected = !extendMode && configuredToolIds.size === 0;

    if (!this.canPromptInteractively()) {
      if (detectedToolIds.size > 0) {
        return [...detectedToolIds];
      }
      const supportedList = ["all", "none", ...supportedToolIds].join(", ");
      throw new Error(
        `No --tools provided and no AI tool directories detected. Re-run with --tools <value>, where value is one of: ${supportedList}`,
      );
    }

    const { checkbox } = await import("@inquirer/prompts");

    const choices = supportedToolIds
      .map((toolId) => {
        const tool = getToolById(toolId)!;
        const configured = configuredToolIds.has(toolId);
        const detected = detectedToolIds.has(toolId) && !configured;
        const preSelected = configured || (shouldPreselectDetected && detected);
        const label = configured ? " (configured)" : detected ? " (detected)" : "";

        return {
          name: `${tool.name}${chalk.dim(label)}`,
          value: toolId,
          checked: preSelected,
          description: tool.description,
          configured,
          detected,
        };
      })
      .sort((a, b) => {
        if (a.configured !== b.configured) return a.configured ? -1 : 1;
        if (a.detected !== b.detected) return a.detected ? -1 : 1;
        return 0;
      });

    const selectedToolIds = await checkbox<string>({
      message: "Select the AI tools to set up",
      choices: choices.map(({ name, value, checked, description }) => ({
        name,
        value,
        checked,
        ...(isUndefined(description) ? {} : { description }),
      })),
      required: true,
    });

    return selectedToolIds;
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

  private async scaffoldConfigFile(projectPath: string): Promise<void> {
    const candidates = buildConfigPaths(projectPath);

    for (const candidate of candidates) {
      try {
        await fs.access(candidate);
        return;
      } catch {
        continue;
      }
    }

    const target = candidates[0];
    if (!target) return;
    await FileSystemUtils.writeFile(target, STARTER_CONFIG_CONTENT);
  }

  private async createDirectoryStructure(projectPath: string, extendMode: boolean): Promise<void> {
    const directories = [
      path.join(projectPath, DESIGN_SPEC_DIR_NAME),
      buildChangesDirPath(projectPath),
      buildArchivesDirPath(projectPath),
      buildSpecsDirPath(projectPath),
      buildStylesDirPath(projectPath),
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

            await FileSystemUtils.writeFile(slashCommandFile, slashCommandContent);
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

    const { createdTools, refreshedTools, failedTools, commandSkipped } = results;
    if (createdTools.length > 0) {
      console.log(`Created: ${createdTools.map((tool) => tool.name).join(", ")}`);
    }
    if (refreshedTools.length > 0) {
      console.log(`Refreshed: ${refreshedTools.map((tool) => tool.name).join(", ")}`);
    }

    const successfulTools = [...createdTools, ...refreshedTools];
    if (successfulTools.length > 0) {
      const toolDirs = [
        ...new Set(successfulTools.map((tool) => path.join(tool.skillsDir, "/"))),
      ].join(", ");
      const skillCount = getSkillTemplates().length;
      const commandCount = getSlashCommandTemplates().length;
      if (skillCount > 0 && commandCount > 0) {
        console.log(`${skillCount} skills and ${commandCount} commands in ${toolDirs}`);
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
      console.log(chalk.dim(`Commands skipped for: ${commandSkipped.join(", ")} (no adapter)`));
    }

    if (createdTools.length > 0 || refreshedTools.length > 0) {
      console.log();
      console.log(chalk.white("Restart your IDE for slash commands to take effect."));
    }

    console.log();
  }
}
