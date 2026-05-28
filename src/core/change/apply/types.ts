import type { TaskSummary } from "../artifact/types.js";
import type { ProjectContext } from "../../project-config/types.js";

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
  projectContext?: ProjectContext;
  apply: ApplyResult & {
    contextFiles: Map<string, string>;
    taskSummary: TaskSummary;
  };
}
