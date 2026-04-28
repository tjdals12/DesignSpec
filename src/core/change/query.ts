import path from "node:path";
import fs from "node:fs/promises";

import { DESIGN_SPEC_DIR_NAME } from "../config.js";
import { FileSystemUtils } from "../../utils/file-system.utils.js";
import { resolveSchema } from "./artifact/schema/resolver.js";
import type { ChangeContext } from "./types.js";
import { ArtifactGraph } from "./artifact/graph.js";
import { getCompletedArtifacts } from "./artifact/completion.js";

export async function getAvailableChanges(
  projectPath: string,
): Promise<string[]> {
  const changesDirPath = path.join(
    projectPath,
    DESIGN_SPEC_DIR_NAME,
    "changes",
  );

  const changesDirExists =
    await FileSystemUtils.directoryExists(changesDirPath);
  if (!changesDirExists) {
    return [];
  }

  const entries = await fs.readdir(changesDirPath, { withFileTypes: true });
  const changes = entries.filter((entry) => {
    if (!entry.isDirectory()) return false;
    if (entry.name === "archive") return false;
    if (entry.name.startsWith(".")) return false;
    return true;
  });
  const changeNames = changes.map((entry) => entry.name);
  return changeNames;
}

export async function doesChangeExist(
  projectPath: string,
  changeName: string,
): Promise<boolean> {
  const changeDirPath = path.join(
    projectPath,
    DESIGN_SPEC_DIR_NAME,
    "changes",
    changeName,
  );
  const changeDirExists = await FileSystemUtils.directoryExists(changeDirPath);
  return changeDirExists;
}

export async function loadChangeContext(
  projectPath: string,
  changeName: string,
): Promise<ChangeContext> {
  const schema = await resolveSchema();

  const artifactGraph = new ArtifactGraph(schema);
  const schemaName = artifactGraph.getName();
  const artifacts = artifactGraph.getAllArtifacts();

  const completedArtifacts = await getCompletedArtifacts(
    projectPath,
    changeName,
    artifacts,
  );

  return {
    changeName,
    schemaName,
    artifactGraph,
    completedArtifacts,
  };
}
