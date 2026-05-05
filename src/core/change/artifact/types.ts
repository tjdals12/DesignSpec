import type { Artifact } from "./schema/schema.js";

export interface ArtifactDependency {
  id: string;
  description: string | undefined;
  generates: string;
  done: boolean;
}

export interface ArtifactInstructions {
  schemaName: string;
  changeName: string;
  changeDirPath: string;
  projectContext?: string;
  artifact: Artifact & {
    dependencies: ArtifactDependency[];
    dependents: string[];
  };
}

export interface TaskProgress {
  total: number;
  completed: number;
}

export interface TaskItem {
  text: string;
  completed: boolean;
}

export interface TaskSummary {
  progress: TaskProgress;
  items: TaskItem[];
}
