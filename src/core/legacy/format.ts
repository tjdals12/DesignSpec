import chalk from "chalk";

import type { CleanupResult } from "./types.js";

export function formatCleanupSummary(result: CleanupResult): string {
  const lines: string[] = [];

  if (result.removed.length > 0) {
    lines.push(
      chalk.bold(`Removed ${result.removed.length} legacy artifact(s) from a pre-2.0.0 setup:`),
    );
    for (const removedPath of result.removed) {
      lines.push(`  - ${removedPath}`);
    }
  }

  if (result.errors.length > 0) {
    if (lines.length > 0) lines.push("");
    lines.push(chalk.yellow("Could not remove:"));
    for (const { path: errorPath, message } of result.errors) {
      lines.push(`  - ${errorPath} (${message})`);
    }
  }

  return lines.join("\n");
}
