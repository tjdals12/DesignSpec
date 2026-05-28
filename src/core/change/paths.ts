import path from "node:path";

import { METADATA_FILENAME } from "../config.js";
import { buildDesignSpecDirPath } from "../paths.js";

export function buildChangesDirPath(projectPath: string): string {
  return path.join(buildDesignSpecDirPath(projectPath), "changes");
}

export function buildArchivesDirPath(projectPath: string): string {
  return path.join(buildChangesDirPath(projectPath), "archive");
}

export function buildChangeDirPath(projectPath: string, changeName: string): string {
  return path.join(buildChangesDirPath(projectPath), changeName);
}

export function buildMetadataPath(projectPath: string, changeName: string): string {
  return path.join(buildChangeDirPath(projectPath, changeName), METADATA_FILENAME);
}
