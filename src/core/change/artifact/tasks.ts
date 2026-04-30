import path from "node:path";
import fs from "node:fs/promises";

import { DESIGN_SPEC_DIR_NAME } from "../../config.js";
import type { TaskProgress } from "./types.js";

export type { TaskProgress };

const TASK_PATTERN = /^[-*]\s+\[[\sx]\]/i;
const COMPLETED_TASK_PATTERN = /^[-*]\s+\[x\]/i;

export async function getTaskProgress(
  projectPath: string,
  changeName: string,
): Promise<TaskProgress> {
  const tasksPath = path.join(
    projectPath,
    DESIGN_SPEC_DIR_NAME,
    "changes",
    changeName,
    "tasks.md",
  );
  try {
    const content = await fs.readFile(tasksPath, "utf-8");

    const lines = content.split("\n");

    let total = 0;
    let completed = 0;

    for (const line of lines) {
      if (line.match(TASK_PATTERN)) {
        total++;
        if (line.match(COMPLETED_TASK_PATTERN)) {
          completed++;
        }
      }
    }

    return { total, completed };
  } catch {
    return { total: 0, completed: 0 };
  }
}
