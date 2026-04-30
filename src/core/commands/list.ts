import { isBoolean } from "es-toolkit";

import path from "node:path";

import { getAvailableChanges, getChangeLastModified } from "../change/query.js";
import type { ChangeInfo } from "../change/types.js";
import { getTaskProgress, type TaskProgress } from "../change/artifact/tasks.js";
import { validateChangesDir } from "../change/validation.js";

export class ListCommand {
  private readonly _json: boolean;

  constructor(options: { json: boolean }) {
    this._json = isBoolean(options.json) ? options.json : false;
  }

  async execute(targetPath: string) {
    const projectPath = path.resolve(targetPath);
    await validateChangesDir(projectPath);

    const availableChanges = await getAvailableChanges(projectPath);
    if (availableChanges.length === 0) {
      if (this._json) {
        console.log(JSON.stringify({ changes: [], message: "No active changes." }, null, 2));
      } else {
        console.log("No active changes found.");
      }
      return;
    }

    const changeInfos: Array<ChangeInfo> = [];

    for (const availableChange of availableChanges) {
      const taskProgress = await getTaskProgress(projectPath, availableChange);
      const lastModified = await getChangeLastModified(projectPath, availableChange);
      changeInfos.push({
        changeName: availableChange,
        totalTask: taskProgress.total,
        completedTask: taskProgress.completed,
        lastModified,
      });
    }

    this.printList(changeInfos);
  }

  printList(changeInfos: Array<ChangeInfo>) {
    if (this._json) {
      console.log(
        JSON.stringify(
          {
            changes: changeInfos.map(({ changeName, totalTask, completedTask, lastModified }) => ({
              changeName: changeName,
              totalTask: totalTask,
              completedTask: completedTask,
              lastModified: lastModified.toISOString(),
              status:
                totalTask === 0
                  ? "no-tasks"
                  : totalTask === completedTask
                    ? "complete"
                    : "in-progress",
            })),
          },
          null,
          2,
        ),
      );
      return;
    }

    console.log("Changes:");
    const width = Math.max(...changeInfos.map((changeInfo) => changeInfo.changeName.length));
    for (const changeInfo of changeInfos) {
      const changeName = changeInfo.changeName.padEnd(width);
      const taskProgress = this.formatTaskProgress({
        total: changeInfo.totalTask,
        completed: changeInfo.completedTask,
      }).padEnd(12);
      const lastModified = this.formatLastModified(changeInfo.lastModified);
      console.log(`  ${changeName}     ${taskProgress}  ${lastModified}`);
    }
  }

  private formatTaskProgress(taskProgress: TaskProgress): string {
    const { total, completed } = taskProgress;
    if (total === 0) return "No tasks";
    if (total === completed) return "✓ Complete";
    return `${completed}/${total} tasks`;
  }

  private formatLastModified(lastModified: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - lastModified.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 30) {
      return lastModified.toLocaleDateString();
    } else if (diffDays > 0) {
      return `${diffDays}d ago`;
    } else if (diffHours > 0) {
      return `${diffHours}h ago`;
    } else if (diffMins > 0) {
      return `${diffMins}m ago`;
    } else {
      return "just now";
    }
  }
}
