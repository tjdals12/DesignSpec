import path from "node:path";
import fs from "node:fs";

import { DESIGN_SPEC_DIR_NAME } from "../../config.js";
import { FileSystemUtils } from "../../../utils/file-system.utils.js";
import { isGlobPattern } from "../../../utils/glob.utils.js";
import type { Artifact } from "./schema/schema.js";

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

  const changeDirPath = await FileSystemUtils.toCanonicalPath(
    path.join(projectPath, DESIGN_SPEC_DIR_NAME, "changes", changeName),
  );
  const changeDirExists = await FileSystemUtils.directoryExists(changeDirPath);
  if (changeDirExists) {
    artifacts.forEach(({ id, generates }) => {
      const exists = hasArtifactOutput(changeDirPath, generates);
      if (exists) {
        completedArtifacts.add(id);
      }
    });
  }

  return completedArtifacts;
}
