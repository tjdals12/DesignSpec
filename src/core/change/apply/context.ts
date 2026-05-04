import type { SchemaYaml } from "../artifact/schema/schema.js";
import type { TaskSummary } from "../artifact/types.js";
import type { ApplyResult, ApplyState } from "./types.js";

export class ApplyContext {
  private _schema: SchemaYaml;
  private _requires: Set<string>;
  private _instruction: string;

  constructor(schema: SchemaYaml) {
    this._schema = schema;
    this._requires = new Set(schema.apply.requires);
    this._instruction = schema.apply.instruction;
  }

  getName(): string {
    return this._schema.name;
  }

  resolve(completedArtifacts: Set<string>, taskSummary: TaskSummary): ApplyResult {
    const missingArtifacts = [...this._requires].filter((r) => !completedArtifacts.has(r));

    let state: ApplyState = "ready";
    if (missingArtifacts.length > 0 || taskSummary.items.length === 0) {
      state = "blocked";
    } else if (taskSummary.progress.total === taskSummary.progress.completed) {
      state = "all_done";
    }

    let instruction = this._instruction;
    if (state === "blocked") {
      if (missingArtifacts.length > 0) {
        instruction = `Cannot apply this change yet. Missing artifacts: ${missingArtifacts.join(", ")}.\nUse the desx:continue skill to create the missing artifacts first.`;
      } else {
        instruction =
          "tasks.md has no tasks. Use the desx:continue skill to regenerate the tasks artifact.";
      }
    } else if (state === "all_done") {
      instruction = "All tasks are complete. This change is ready to be archived.";
    }

    return {
      missingArtifacts,
      state,
      instruction,
    };
  }
}
