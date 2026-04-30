import path from "node:path";

import type { ChangeContext } from "../types.js";
import { resolveTemplate } from "./template/resolver.js";
import { DESIGN_SPEC_DIR_NAME } from "../../config.js";
import type { ArtifactInstructions } from "./types.js";

export type { ArtifactInstructions };

export async function resolveArtifactInstructions(
  projectPath: string,
  changeContext: ChangeContext,
  artifactName: string,
): Promise<ArtifactInstructions> {
  const { schemaName, changeName, artifactGraph, completedArtifacts } = changeContext;

  const changeDirPath = path.join(projectPath, DESIGN_SPEC_DIR_NAME, "changes", changeName);

  const artifact = artifactGraph.getArtifact(artifactName);
  if (!artifact) {
    throw new Error(`Artifact '${artifactName}' not found in schema '${schemaName}'`);
  }

  const template = await resolveTemplate(artifact.template);

  const dependencies = artifactGraph.getArtifactDependencies(artifact.id, completedArtifacts);

  const dependents = artifactGraph.getArtifactDependents(artifact.id);

  return {
    schemaName,
    changeName,
    changeDirPath,
    artifact: {
      ...artifact,
      template,
      dependencies,
      dependents,
    },
  };
}
