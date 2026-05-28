import path from "node:path";
import fs from "node:fs/promises";

import { DESIGN_SPEC_DIR_NAME } from "../../config.js";
import type { TaskItem, TaskSummary, TaskProgress } from "./types.js";

export type { TaskSummary, TaskItem, TaskProgress } from "./types.js";

const TASK_PATTERN = /^[-*]\s+\[[\sx]\]/i;
const COMPLETED_TASK_PATTERN = /^[-*]\s+\[x\]/i;
const TASK_TEXT_PATTERN = /^[-*]\s+\[[\sx]\]\s*/i;
const INDENTED_LINE_PATTERN = /^[ \t]+\S/;

export async function getTaskSummary(
  projectPath: string,
  changeName: string,
): Promise<TaskSummary> {
  const tasksPath = path.join(projectPath, DESIGN_SPEC_DIR_NAME, "changes", changeName, "tasks.md");
  try {
    const content = await fs.readFile(tasksPath, "utf-8");
    const lines = content.split("\n");

    let total = 0;
    let completed = 0;
    const items: TaskItem[] = [];
    let currentItem: TaskItem | null = null;

    for (const line of lines) {
      if (line.match(TASK_PATTERN)) {
        total++;
        const isCompleted = !!line.match(COMPLETED_TASK_PATTERN);
        if (isCompleted) completed++;
        currentItem = {
          text: line.replace(TASK_TEXT_PATTERN, ""),
          completed: isCompleted,
        };
        items.push(currentItem);
      } else if (currentItem && INDENTED_LINE_PATTERN.test(line)) {
        currentItem.text += "\n" + line;
      } else {
        currentItem = null;
      }
    }

    return { progress: { total, completed }, items };
  } catch {
    return { progress: { total: 0, completed: 0 }, items: [] };
  }
}

export async function getTaskProgress(
  projectPath: string,
  changeName: string,
): Promise<TaskProgress> {
  const { progress } = await getTaskSummary(projectPath, changeName);
  return progress;
}
