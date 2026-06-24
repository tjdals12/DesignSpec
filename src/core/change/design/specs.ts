import fs from "node:fs";
import path from "node:path";

import { FileSystemUtils } from "#utils/file-system.utils.js";

import type { SpecFile } from "./types.js";

export function readSpec(changeDirPath: string, generates: string): string | null {
  const filePath = path.join(changeDirPath, generates);
  const stat = fs.statSync(filePath, { throwIfNoEntry: false });
  if (!stat || !stat.isFile()) {
    return null;
  }

  const content = fs.readFileSync(filePath, "utf-8").trim();

  return content;
}

export function collectSpecs(changeDirPath: string, generates: string): SpecFile[] {
  const posixPath = FileSystemUtils.toPoxisPath(generates);
  const matches = fs.globSync(posixPath, { cwd: changeDirPath }).sort();

  const specFiles: SpecFile[] = [];
  for (const relativePath of matches) {
    const spec = readSpec(changeDirPath, relativePath);
    if (spec === null) {
      continue;
    }

    const name = path.basename(relativePath, ".md");

    specFiles.push({ name, spec });
  }

  return specFiles;
}
