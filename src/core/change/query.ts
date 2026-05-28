import path from "node:path";
import fs from "node:fs/promises";

import { FileSystemUtils } from "#utils/file-system.utils.js";
import { buildChangeDirPath, buildChangesDirPath } from "./paths.js";

export async function hasChangesDir(projectPath: string): Promise<boolean> {
  const dirPath = buildChangesDirPath(projectPath);
  return await FileSystemUtils.directoryExists(dirPath);
}

export async function doesChangeExist(projectPath: string, changeName: string): Promise<boolean> {
  const changeDirPath = path.join(buildChangesDirPath(projectPath), changeName);
  return await FileSystemUtils.directoryExists(changeDirPath);
}

export async function getAvailableChanges(projectPath: string): Promise<string[]> {
  const changesDirExists = await hasChangesDir(projectPath);
  if (!changesDirExists) {
    return [];
  }

  const changesDirPath = buildChangesDirPath(projectPath);
  const entries = await fs.readdir(changesDirPath, { withFileTypes: true });
  const changes = entries.filter((entry) => {
    if (!entry.isDirectory()) return false;
    if (entry.name === "archive") return false;
    if (entry.name.startsWith(".")) return false;
    return true;
  });
  const changeNames = changes.map((entry) => entry.name);
  return changeNames;
}

export async function getChangeLastModified(
  projectPath: string,
  changeName: string,
): Promise<Date> {
  let latest: Date | null = null;

  const traverseFiles = async (currentDirPath: string) => {
    const entries = await fs.readdir(currentDirPath, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(entry.parentPath, entry.name);
      if (entry.isDirectory()) {
        await traverseFiles(fullPath);
      } else {
        const stats = await fs.stat(fullPath);
        if (latest === null || stats.mtime > latest) {
          latest = stats.mtime;
        }
      }
    }
  };

  const changeDirPath = buildChangeDirPath(projectPath, changeName);
  await traverseFiles(changeDirPath);

  if (latest === null) {
    const stats = await fs.stat(changeDirPath);
    latest = stats.mtime;
  }

  return latest;
}
