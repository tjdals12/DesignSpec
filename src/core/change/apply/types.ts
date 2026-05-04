import type { TaskSummary } from "../artifact/types.js";

export type ApplyState = "blocked" | "all_done" | "ready";

export interface ApplyResult {
  missingArtifacts: string[];
  state: ApplyState;
  instruction: string;
}

export interface ApplyInstructions {
  changeName: string;
  schemaName: string;
  changeDirPath: string;
  apply: ApplyResult & {
    contextFiles: Map<string, string>;
    taskSummary: TaskSummary;
  };
}
