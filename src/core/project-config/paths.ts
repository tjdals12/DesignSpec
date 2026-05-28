import path from "node:path";

import { CONFIG_FILENAMES } from "../config.js";
import { buildDesignSpecDirPath } from "../paths.js";

export function buildConfigPaths(projectPath: string): string[] {
  const dir = buildDesignSpecDirPath(projectPath);
  return CONFIG_FILENAMES.map((filename) => path.join(dir, filename));
}
