import path from "node:path";

import { buildDesignSpecDirPath } from "../paths.js";

export function buildStylesDirPath(projectPath: string): string {
  return path.join(buildDesignSpecDirPath(projectPath), "styles");
}
