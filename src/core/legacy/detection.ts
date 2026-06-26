import path from "node:path";
import fs from "node:fs/promises";
import type { Dirent } from "node:fs";

import { FileSystemUtils } from "#utils/file-system.utils.js";
import {
  LEGACY_SKILL_PREFIX,
  LEGACY_SKILL_DIRS,
  LEGACY_COMMAND_DIR,
  LEGACY_COMMAND_FILES_DIR,
  LEGACY_COMMAND_FILE_PREFIX,
  LEGACY_COMMAND_FILE_SUFFIX,
} from "./paths.js";
import type { LegacyDetectionResult } from "./types.js";

export async function detectLegacyArtifacts(projectPath: string): Promise<LegacyDetectionResult> {
  const skillDirs = await detectLegacySkillDirs(projectPath);
  const commandDirs = await detectLegacyCommandDirs(projectPath);
  const commandFiles = await detectLegacyCommandFiles(projectPath);

  return {
    skillDirs,
    commandDirs,
    commandFiles,
    hasLegacyArtifacts: skillDirs.length > 0 || commandDirs.length > 0 || commandFiles.length > 0,
  };
}

async function detectLegacySkillDirs(projectPath: string): Promise<string[]> {
  const found: string[] = [];

  for (const relativeDir of LEGACY_SKILL_DIRS) {
    const entries = await readDirEntries(path.join(projectPath, relativeDir));

    for (const entry of entries) {
      if (entry.isDirectory() && entry.name.startsWith(LEGACY_SKILL_PREFIX)) {
        found.push(`${relativeDir}/${entry.name}`);
      }
    }
  }

  return found;
}

async function detectLegacyCommandDirs(projectPath: string): Promise<string[]> {
  const exists = await FileSystemUtils.directoryExists(path.join(projectPath, LEGACY_COMMAND_DIR));
  return exists ? [LEGACY_COMMAND_DIR] : [];
}

async function detectLegacyCommandFiles(projectPath: string): Promise<string[]> {
  const entries = await readDirEntries(path.join(projectPath, LEGACY_COMMAND_FILES_DIR));

  return entries
    .filter(
      (entry) =>
        entry.isFile() &&
        entry.name.startsWith(LEGACY_COMMAND_FILE_PREFIX) &&
        entry.name.endsWith(LEGACY_COMMAND_FILE_SUFFIX),
    )
    .map((entry) => `${LEGACY_COMMAND_FILES_DIR}/${entry.name}`);
}

async function readDirEntries(dirPath: string): Promise<Dirent[]> {
  try {
    return await fs.readdir(dirPath, { withFileTypes: true });
  } catch {
    return [];
  }
}
