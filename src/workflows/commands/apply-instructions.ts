import { isBoolean, isUndefined } from "es-toolkit";

import path from "node:path";
import ora from "ora";

import { resolveApplyInstructions } from "#core/change/apply/instructions.js";
import type { ApplyInstructions } from "#core/change/apply/types.js";
import { loadChangeContext } from "#core/change/context.js";
import { doesChangeExist, getAvailableChanges } from "#core/change/query.js";

export class ApplyInstructionsCommand {
  private readonly _change?: string | undefined;
  private readonly _json: boolean;

  constructor(options: { change?: string; artifact?: string; json?: boolean }) {
    this._change = options.change;
    this._json = isBoolean(options.json) ? options.json : false;
  }

  async execute(targetPath: string) {
    const projectPath = path.resolve(targetPath);
    const changeName = this._change;

    const spinner = this._json ? undefined : ora("Generating instructions...").start();

    try {
      const hasChangeName = !isUndefined(changeName);

      if (!hasChangeName) {
        await this.handleNoChange(projectPath);
        return;
      }

      const changeExists = await doesChangeExist(projectPath, changeName);
      if (!changeExists) {
        await this.handleChangeNotFound(projectPath, changeName);
        return;
      }

      const changeContext = await loadChangeContext(projectPath, changeName);
      const applyInstructions = await resolveApplyInstructions(projectPath, changeContext);

      spinner?.stop();

      this.printApplyInstructions(applyInstructions);
    } catch (error) {
      spinner?.stop();
      throw error;
    }
  }

  private async handleNoChange(projectPath: string): Promise<void> {
    const availableChanges = await getAvailableChanges(projectPath);
    if (availableChanges.length === 0) {
      if (this._json) {
        console.log(JSON.stringify({ changes: [], message: "No active changes." }, null, 2));
      } else {
        console.log("No active changes. Create one with: design-spec new change <name>");
      }
      return;
    }
    throw new Error(
      `Missing required option --change. Available changes:\n  ${availableChanges.join("\n  ")}`,
    );
  }

  private async handleChangeNotFound(projectPath: string, changeName: string): Promise<void> {
    const availableChanges = await getAvailableChanges(projectPath);
    if (this._json) {
      console.log(
        JSON.stringify(
          {
            error: `Change '${changeName}' not found.`,
            availableChanges,
          },
          null,
          2,
        ),
      );
      return;
    }
    if (availableChanges.length === 0) {
      throw new Error(`Change '${changeName}' not found. No available changes.`);
    }
    throw new Error(
      `Change '${changeName}' not found. Available changes:\n  ${availableChanges.join("\n  ")}`,
    );
  }

  private printApplyInstructions(applyInstructions: ApplyInstructions): void {
    const { changeName, schemaName, changeDirPath, projectContext, apply } = applyInstructions;
    const { state, missingArtifacts, contextFiles, taskSummary, instruction } = apply;
    const { progress, items } = taskSummary;

    if (this._json) {
      console.log(
        JSON.stringify(
          {
            change: changeName,
            schema: schemaName,
            state,
            projectContext,
            warning:
              missingArtifacts.length > 0
                ? {
                    message: "Cannot apply this change yet. Complete missing artifacts first.",
                    missingArtifacts,
                  }
                : undefined,
            contextFiles: [...contextFiles.entries()].map(([id, generates]) => ({
              id,
              path: path.join(changeDirPath, generates),
            })),
            progress,
            tasks: items.map((item) => ({ text: item.text, completed: item.completed })),
            instruction: instruction.trim(),
          },
          null,
          2,
        ),
      );
      return;
    }

    // Project context (precedes <apply> so the agent reads it first)
    if (projectContext) {
      console.log("<project_context>");
      console.log(projectContext);
      console.log("</project_context>");
      console.log();
    }

    // Opening tag
    console.log(`<apply change="${changeName}" schema="${schemaName}">`);
    console.log();

    // Warning
    if (missingArtifacts.length > 0) {
      console.log("<warning>");
      console.log("Cannot apply this change yet. Complete missing artifacts first.");
      console.log(`Missing: ${missingArtifacts.join(", ")}`);
      console.log("</warning>");
      console.log();
    }

    // Context Files
    if (contextFiles.size > 0) {
      console.log("<context-files>");
      console.log("Read these files for context before applying:");
      console.log();
      for (const [artifactId, generates] of contextFiles.entries()) {
        console.log(`<file id="${artifactId}">`);
        console.log(`<path>${path.join(changeDirPath, generates)}</path>`);
        console.log(`</file>`);
      }
      console.log("</context-files>");
      console.log();
    }

    // Progress + Tasks
    if (state === "ready" || state === "all_done") {
      const { progress, items } = taskSummary;

      console.log("<progress>");
      if (state === "all_done") {
        console.log(`${progress.completed}/${progress.total} complete ✓`);
      } else {
        console.log(`${progress.completed}/${progress.total} complete`);
      }
      console.log("</progress>");
      console.log();

      console.log("<tasks>");
      for (const item of items) {
        const checkbox = item.completed ? "[x]" : "[ ]";
        console.log(`- ${checkbox} ${item.text}`);
      }
      console.log("</tasks>");
      console.log();
    }

    // Instruction
    console.log("<instruction>");
    console.log(instruction.trim());
    console.log("</instruction>");
    console.log();

    // Closing tag
    console.log("</apply>");
  }
}
