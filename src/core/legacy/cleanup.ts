import path from "node:path";
import fs from "node:fs/promises";

import type { CleanupError, CleanupResult, LegacyDetectionResult } from "./types.js";

export async function cleanupLegacyArtifacts(
  projectPath: string,
  detection: LegacyDetectionResult,
): Promise<CleanupResult> {
  const removed: string[] = [];
  const errors: CleanupError[] = [];

  const root = path.resolve(projectPath);
  const targets = [...detection.skillDirs, ...detection.commandDirs, ...detection.commandFiles];

  for (const relativePath of targets) {
    const resolved = path.resolve(root, relativePath);

    if (resolved === root || !resolved.startsWith(root + path.sep)) {
      errors.push({ path: relativePath, message: "refused: resolves outside the project root" });
      continue;
    }

    try {
      await fs.rm(resolved, { recursive: true, force: true });
      removed.push(relativePath);
    } catch (error) {
      errors.push({
        path: relativePath,
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return { removed, errors };
}
