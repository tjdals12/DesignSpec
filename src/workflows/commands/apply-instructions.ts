import { resolveArtifactOutputs } from "#core/change/artifact/outputs.js";
import { getTaskSummary } from "#core/change/artifact/tasks.js";
import type { TaskSummary } from "#core/change/artifact/types.js";
import { loadChangeContext } from "#core/change/context.js";
import { doesChangeExist, getAvailableChanges } from "#core/change/query.js";
import type { ChangeContext } from "#core/change/types.js";
import { isBoolean, isUndefined } from "es-toolkit";

import path from "node:path";
import ora from "ora";

type ApplyState = "blocked" | "all_done" | "ready";

interface ApplyInstructions {
  changeName: string;
  schemaName: string;
  state: ApplyState;
  missingArtifacts: string[];
  contextFiles: Map<string, string>;
  taskSummary: TaskSummary;
  instruction: string;
}

function resolveState(missingArtifacts: string[], taskSummary: TaskSummary): ApplyState {
  if (missingArtifacts.length > 0) return "blocked";
  if (taskSummary.items.length === 0) return "blocked";
  if (taskSummary.progress.completed === taskSummary.progress.total) return "all_done";
  return "ready";
}

function resolveInstruction(
  state: ApplyState,
  missingArtifacts: string[],
  schemaInstruction: string,
): string {
  if (state === "blocked" && missingArtifacts.length > 0) {
    return `Cannot apply this change yet. Missing artifacts: ${missingArtifacts.join(", ")}.\nUse the desx:continue skill to create the missing artifacts first.`;
  }
  if (state === "blocked") {
    return "tasks.md has no tasks. Use the desx:continue skill to regenerate the tasks artifact.";
  }
  if (state === "all_done") {
    return "All tasks are complete. This change is ready to be archived.";
  }
  return schemaInstruction;
}

async function resolveApplyInstructions(
  projectPath: string,
  changeContext: ChangeContext,
): Promise<ApplyInstructions> {
  const { schemaName, changeName, artifactGraph, apply } = changeContext;

  const artifacts = artifactGraph.getAllArtifacts();

  const outputByArtifact = await resolveArtifactOutputs(projectPath, changeName, artifacts);

  const missingArtifacts: string[] = [];
  const contextFiles = new Map<string, string>();
  for (const require of apply.requires) {
    const output = outputByArtifact.get(require);
    if (output !== undefined) {
      contextFiles.set(require, output);
    } else {
      missingArtifacts.push(require);
    }
  }

  const taskSummary = await getTaskSummary(projectPath, changeName);
  const state = resolveState(missingArtifacts, taskSummary);
  const instruction = resolveInstruction(state, missingArtifacts, apply.instruction);

  return {
    changeName,
    schemaName,
    state,
    missingArtifacts,
    contextFiles,
    taskSummary,
    instruction,
  };
}

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
    const {
      changeName,
      schemaName,
      state,
      missingArtifacts,
      contextFiles,
      taskSummary,
      instruction,
    } = applyInstructions;

    console.log(`## Apply: ${changeName}`);
    console.log(`Schema: ${schemaName}`);
    console.log();

    // Blocked
    if (missingArtifacts.length > 0) {
      console.log("### ⚠️ Blocked");
      console.log();
      console.log(`Missing artifacts: ${missingArtifacts.join(", ")}`);
      console.log("Use the openspec-continue-change skill to create these first.");
      console.log();
    }

    // Context Files
    if (contextFiles.size > 0) {
      console.log("### Context Files");
      for (const [artifactId, output] of contextFiles.entries()) {
        console.log(`- ${artifactId}: ${output}`);
      }
      console.log();
    }

    // Tasks
    if (state === "ready" || state === "all_done") {
      const { progress, items } = taskSummary;

      console.log("### Progress");
      if (state === "all_done") {
        console.log(`${progress.completed}/${progress.total} complete ✓`);
      } else {
        console.log(`${progress.completed}/${progress.total} complete`);
      }
      console.log();

      console.log("### Tasks");
      for (const item of items) {
        const checkbox = item.completed ? "[x]" : "[ ]";
        console.log(`- ${checkbox} ${item.text}`);
      }
      console.log();
    }

    // Instruction
    console.log("### Instruction");
    console.log(instruction);
  }
}
