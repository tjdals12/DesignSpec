import type { ArtifactGraph } from "./artifact/graph.js";

export interface ArtifactStatus {
  id: string;
  status: "ready" | "blocked" | "done";
  missingDeps: string[];
}

export interface ChangeContext {
  changeName: string;
  schemaName: string;
  artifactGraph: ArtifactGraph;
  completedArtifacts: Set<string>;
}

export interface ChangeStatus {
  changeName: string;
  schemaName: string;
  artifactStatuses: ArtifactStatus[];
  isComplete: boolean;
}
