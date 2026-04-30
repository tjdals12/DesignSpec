import path from "node:path";

import { DESIGN_SPEC_DIR_NAME, METADATA_FILENAME } from "../config.js";

export function buildChangesDirPath(projectPath: string): string {
  return path.join(projectPath, DESIGN_SPEC_DIR_NAME, "changes");
}

export function buildArchivesDirPath(projectPath: string): string {
  return path.join(buildChangesDirPath(projectPath), "archive");
}

export function buildChangeDirPath(
  projectPath: string,
  changeName: string,
): string {
  return path.join(buildChangesDirPath(projectPath), changeName);
}

export function buildMetadataPath(
  projectPath: string,
  changeName: string,
): string {
  return path.join(buildChangeDirPath(projectPath, changeName), METADATA_FILENAME);
}
