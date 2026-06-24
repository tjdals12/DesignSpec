import type { ArtifactGraph } from "./artifact/graph.js";
import type { DesignContext } from "./design/context.js";
import type { ApplyContext } from "./apply/context.js";

export interface ArtifactStatus {
  id: string;
  status: "ready" | "blocked" | "done";
  missingDeps: string[];
}

export interface ChangeContext {
  changeName: string;
  schemaName: string;
  artifactGraph: ArtifactGraph;
  designContext: DesignContext;
  applyContext: ApplyContext;
  completedArtifacts: Set<string>;
}

export interface ChangeStatus {
  changeName: string;
  schemaName: string;
  artifactStatuses: ArtifactStatus[];
  applyRequires: string[];
  isComplete: boolean;
}

export interface ChangeInfo {
  changeName: string;
  totalTask: number;
  completedTask: number;
  lastModified: Date;
}
