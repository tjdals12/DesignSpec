import path from "node:path";
import fs from "node:fs/promises";

import { FileSystemUtils } from "#utils/file-system.utils.js";
import { buildComponentsDirPath, buildPagesDirPath, buildSpecsDirPath } from "./paths.js";
import type { SpecInfo, SpecKind } from "./types.js";

export async function hasSpecsDir(projectPath: string): Promise<boolean> {
  const dirPath = buildSpecsDirPath(projectPath);
  return await FileSystemUtils.directoryExists(dirPath);
}

export async function getAvailableSpecs(projectPath: string): Promise<SpecInfo[]> {
  const specsDirExists = await hasSpecsDir(projectPath);
  if (!specsDirExists) {
    return [];
  }

  const pages = await readSpecsForKind(buildPagesDirPath(projectPath), "page");
  const components = await readSpecsForKind(buildComponentsDirPath(projectPath), "component");
  return [...pages, ...components];
}

async function readSpecsForKind(dirPath: string, kind: SpecKind): Promise<SpecInfo[]> {
  const exists = await FileSystemUtils.directoryExists(dirPath);
  if (!exists) {
    return [];
  }

  const entries = await fs.readdir(dirPath, { withFileTypes: true });
  const specs: SpecInfo[] = [];
  for (const entry of entries) {
    if (!entry.isFile()) continue;
    if (!entry.name.endsWith(".md")) continue;
    if (entry.name.startsWith(".")) continue;

    const fullPath = path.join(dirPath, entry.name);
    const stats = await fs.stat(fullPath);
    specs.push({
      specName: entry.name.replace(/\.md$/, ""),
      kind,
      lastModified: stats.mtime,
    });
  }
  return specs;
}
