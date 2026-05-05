import { resolveProjectConfig } from "../../project-config/resolver.js";
import { getTaskSummary } from "../artifact/tasks.js";
import { buildChangeDirPath } from "../paths.js";
import type { ChangeContext } from "../types.js";
import type { ApplyInstructions } from "./types.js";

export async function resolveApplyInstructions(
  projectPath: string,
  changeContext: ChangeContext,
): Promise<ApplyInstructions> {
  const { schemaName, changeName, completedArtifacts, artifactGraph, applyContext } = changeContext;

  const changeDirPath = buildChangeDirPath(projectPath, changeName);

  const contextFiles = new Map<string, string>();
  for (const artifact of artifactGraph.getAllArtifacts()) {
    if (completedArtifacts.has(artifact.id)) {
      contextFiles.set(artifact.id, artifact.generates);
    }
  }

  const taskSummary = await getTaskSummary(projectPath, changeName);
  const applyResult = applyContext.resolve(completedArtifacts, taskSummary);

  const projectConfig = await resolveProjectConfig(projectPath);
  const projectContext = projectConfig?.context?.trim();

  return {
    changeName,
    schemaName,
    changeDirPath,
    ...(projectContext ? { projectContext } : {}),
    apply: {
      ...applyResult,
      contextFiles,
      taskSummary,
    },
  };
}
