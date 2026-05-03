import path from "node:path";
import fs from "node:fs";

import { FileSystemUtils } from "#utils/file-system.utils.js";
import { isGlobPattern } from "#utils/glob.utils.js";
import type { Artifact } from "./schema/schema.js";
import { doesChangeExist } from "../query.js";
import { buildChangeDirPath } from "../paths.js";

export async function resolveArtifactOutput(
  projectPath: string,
  changeName: string,
  artifact: Artifact,
): Promise<string | undefined> {
  const changeDirExist = await doesChangeExist(projectPath, changeName);
  if (!changeDirExist) {
    return undefined;
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
    const hasMatch = entries.some((entry) => entry.isFile());
    return hasMatch ? path.join(changeDirPath, generates) : undefined;
  }

  const filePath = path.join(changeDirPath, generates);
  const stat = fs.statSync(filePath, { throwIfNoEntry: false });
  return stat && stat.isFile() ? filePath : undefined;
}

export async function resolveArtifactOutputs(
  projectPath: string,
  changeName: string,
  artifacts: Artifact[],
): Promise<Map<string, string>> {
  const map = new Map<string, string>();

  for (const artifact of artifacts) {
    const output = await resolveArtifactOutput(projectPath, changeName, artifact);
    if (output !== undefined) {
      map.set(artifact.id, output);
    }
  }

  return map;
}
