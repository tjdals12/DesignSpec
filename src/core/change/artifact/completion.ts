import path from "node:path";
import fs from "node:fs";

import { FileSystemUtils } from "#utils/file-system.utils.js";
import { isGlobPattern } from "#utils/glob.utils.js";
import type { Artifact } from "./schema/schema.js";
import { doesChangeExist } from "../query.js";
import { buildChangeDirPath } from "../paths.js";

export async function hasArtifactOutput(
  projectPath: string,
  changeName: string,
  artifact: Artifact,
): Promise<boolean> {
  const changeDirExist = await doesChangeExist(projectPath, changeName);
  if (!changeDirExist) {
    return false;
  }

  const changeDirPath = await FileSystemUtils.toCanonicalPath(
    buildChangeDirPath(projectPath, changeName),
  );

  const { generates } = artifact;

  if (isGlobPattern(generates)) {
    const posixPath = FileSystemUtils.toPoxisPath(generates);
    const entries = fs.globSync(posixPath, {
      cwd: changeDirPath,
      withFileTypes: true,
    });
    return entries.some((entry) => entry.isFile());
  }

  const filePath = path.join(changeDirPath, generates);
  const stat = fs.statSync(filePath, { throwIfNoEntry: false });
  return stat ? stat.isFile() : false;
}

export async function getCompletedArtifacts(
  projectPath: string,
  changeName: string,
  artifacts: Artifact[],
): Promise<Set<string>> {
  const completedArtifacts = new Set<string>();

  for (const artifact of artifacts) {
    if (await hasArtifactOutput(projectPath, changeName, artifact)) {
      completedArtifacts.add(artifact.id);
    }
  }

  return completedArtifacts;
}
