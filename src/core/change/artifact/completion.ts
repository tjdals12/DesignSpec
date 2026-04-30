import path from "node:path";
import fs from "node:fs";

import { FileSystemUtils } from "../../../utils/file-system.utils.js";
import { isGlobPattern } from "../../../utils/glob.utils.js";
import type { Artifact } from "./schema/schema.js";
import { doesChangeExist } from "../query.js";
import { buildChangeDirPath } from "../paths.js";

function hasArtifactOutput(changeDirPath: string, generates: string) {
  if (isGlobPattern(generates)) {
    const posixPath = FileSystemUtils.toPoxisPath(generates);

    const entries = fs.globSync(posixPath, {
      cwd: changeDirPath,
      withFileTypes: true,
    });

    const exists = entries.some((entry) => entry.isFile());
    return exists;
  }

  const filePath = path.join(changeDirPath, generates);
  const stat = fs.statSync(filePath, { throwIfNoEntry: false });
  return stat && stat.isFile() ? true : false;
}

export async function getCompletedArtifacts(
  projectPath: string,
  changeName: string,
  artifacts: Artifact[],
): Promise<Set<string>> {
  const completedArtifacts = new Set<string>();

  const changeDirExist = await doesChangeExist(projectPath, changeName);
  if (changeDirExist) {
    const changeDirPath = await FileSystemUtils.toCanonicalPath(
      buildChangeDirPath(projectPath, changeName),
    );
    artifacts.forEach(({ id, generates }) => {
      const exists = hasArtifactOutput(changeDirPath, generates);
      if (exists) {
        completedArtifacts.add(id);
      }
    });
  }

  return completedArtifacts;
}
