import path from "node:path";

import { DESIGN_SPEC_DIR_NAME } from "./config.js";

export function buildDesignSpecDirPath(projectPath: string): string {
  return path.join(projectPath, DESIGN_SPEC_DIR_NAME);
}
