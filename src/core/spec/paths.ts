import path from "node:path";

import { buildDesignSpecDirPath } from "../paths.js";

export function buildSpecsDirPath(projectPath: string): string {
  return path.join(buildDesignSpecDirPath(projectPath), "specs");
}
