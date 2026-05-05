import path from "node:path";

import { buildDesignSpecDirPath } from "../paths.js";

export function buildSpecsDirPath(projectPath: string): string {
  return path.join(buildDesignSpecDirPath(projectPath), "specs");
}

export function buildPagesDirPath(projectPath: string): string {
  return path.join(buildSpecsDirPath(projectPath), "pages");
}

export function buildComponentsDirPath(projectPath: string): string {
  return path.join(buildSpecsDirPath(projectPath), "components");
}
