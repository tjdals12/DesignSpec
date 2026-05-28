import type { ChangeContext } from "../types.js";
import { resolveProjectContext } from "../../project-config/resolver.js";
import { resolveTemplate } from "./template/resolver.js";
import type { ArtifactInstructions } from "./types.js";
import { buildChangeDirPath } from "../paths.js";

export async function resolveArtifactInstructions(
  projectPath: string,
  changeContext: ChangeContext,
  artifactName: string,
): Promise<ArtifactInstructions> {
  const { schemaName, changeName, artifactGraph, completedArtifacts } = changeContext;

  const changeDirPath = buildChangeDirPath(projectPath, changeName);

  const artifact = artifactGraph.getArtifact(artifactName);
  if (!artifact) {
    throw new Error(`Artifact '${artifactName}' not found in schema '${schemaName}'`);
  }

  const template = await resolveTemplate(artifact.template);

  const dependencies = artifactGraph.getArtifactDependencies(artifact.id, completedArtifacts);

  const dependents = artifactGraph.getArtifactDependents(artifact.id);

  const projectContext = await resolveProjectContext(projectPath);

  return {
    schemaName,
    changeName,
    changeDirPath,
    ...(projectContext ? { projectContext } : {}),
    artifact: {
      ...artifact,
      template,
      dependencies,
      dependents,
    },
  };
}
