import path from "node:path";

import { DESIGN_SPEC_DIR_NAME } from "../config.js";

export function buildChangesDirPath(projectPath: string): string {
  return path.join(projectPath, DESIGN_SPEC_DIR_NAME, "changes");
}

export function buildChangeDirPath(
  projectPath: string,
  changeName: string,
): string {
  return path.join(buildChangesDirPath(projectPath), changeName);
}
