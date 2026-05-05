import { isBoolean } from "es-toolkit";

import path from "node:path";

import { getAvailableChanges, getChangeLastModified } from "../change/query.js";
import type { ChangeInfo } from "../change/types.js";
import { getTaskProgress, type TaskProgress } from "../change/artifact/tasks.js";
import { validateChangesDir } from "../change/validation.js";
import { getAvailableSpecs } from "../spec/query.js";
import type { SpecInfo, SpecKind } from "../spec/types.js";

interface ListOptions {
  json: boolean;
  changes?: boolean;
  specs?: boolean;
}

export class ListCommand {
  private readonly _json: boolean;
  private readonly _showChanges: boolean;
  private readonly _showSpecs: boolean;

  constructor(options: ListOptions) {
    this._json = isBoolean(options.json) ? options.json : false;

    const changesFlag = isBoolean(options.changes) ? options.changes : false;
    const specsFlag = isBoolean(options.specs) ? options.specs : false;

    if (!changesFlag && !specsFlag) {
      this._showChanges = true;
      this._showSpecs = false;
    } else {
      this._showChanges = changesFlag;
      this._showSpecs = specsFlag;
    }
  }

  async execute(targetPath: string) {
    const projectPath = path.resolve(targetPath);
    await validateChangesDir(projectPath);

    const changeInfos = this._showChanges ? await this.collectChangeInfos(projectPath) : [];
    const specInfos = this._showSpecs ? await getAvailableSpecs(projectPath) : [];

    if (this._json) {
      this.printJson(changeInfos, specInfos);
      return;
    }

    this.printText(changeInfos, specInfos);
  }

  private async collectChangeInfos(projectPath: string): Promise<Array<ChangeInfo>> {
    const availableChanges = await getAvailableChanges(projectPath);
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
    return changeInfos;
  }

  private printJson(changeInfos: Array<ChangeInfo>, specInfos: Array<SpecInfo>) {
    const payload: Record<string, unknown> = {};

    if (this._showChanges) {
      payload.changes = changeInfos.map(
        ({ changeName, totalTask, completedTask, lastModified }) => ({
          changeName,
          totalTask,
          completedTask,
          lastModified: lastModified.toISOString(),
          status:
            totalTask === 0 ? "no-tasks" : totalTask === completedTask ? "complete" : "in-progress",
        }),
      );
    }

    if (this._showSpecs) {
      payload.specs = specInfos.map(({ specName, kind, lastModified }) => ({
        specName,
        kind,
        lastModified: lastModified.toISOString(),
      }));
    }

    if (this._showChanges && changeInfos.length === 0) {
      payload.message = "No active changes.";
    }

    console.log(JSON.stringify(payload, null, 2));
  }

  private printText(changeInfos: Array<ChangeInfo>, specInfos: Array<SpecInfo>) {
    const sections: string[] = [];

    if (this._showChanges) {
      sections.push(this.formatChanges(changeInfos));
    }

    if (this._showSpecs) {
      sections.push(this.formatSpecs(specInfos));
    }

    console.log(sections.join("\n\n"));
  }

  private formatChanges(changeInfos: Array<ChangeInfo>): string {
    if (changeInfos.length === 0) {
      return "No active changes found.";
    }

    const lines: string[] = ["Changes:"];
    const width = Math.max(...changeInfos.map((changeInfo) => changeInfo.changeName.length));
    for (const changeInfo of changeInfos) {
      const changeName = changeInfo.changeName.padEnd(width);
      const taskProgress = this.formatTaskProgress({
        total: changeInfo.totalTask,
        completed: changeInfo.completedTask,
      }).padEnd(12);
      const lastModified = this.formatLastModified(changeInfo.lastModified);
      lines.push(`  ${changeName}     ${taskProgress}  ${lastModified}`);
    }
    return lines.join("\n");
  }

  private formatSpecs(specInfos: Array<SpecInfo>): string {
    if (specInfos.length === 0) {
      return "No specs found.";
    }

    const lines: string[] = ["Specs:"];
    const groupOrder: Array<{ kind: SpecKind; label: string }> = [
      { kind: "page", label: "Pages" },
      { kind: "component", label: "Components" },
    ];

    const sections: string[] = [];
    for (const { kind, label } of groupOrder) {
      const items = specInfos.filter((spec) => spec.kind === kind);
      if (items.length === 0) continue;

      const sectionLines: string[] = [`  ${label}`];
      const width = Math.max(...items.map((spec) => spec.specName.length));
      for (const spec of items) {
        const name = spec.specName.padEnd(width);
        const lastModified = this.formatLastModified(spec.lastModified);
        sectionLines.push(`    ${name}    ${lastModified}`);
      }
      sections.push(sectionLines.join("\n"));
    }

    return [lines[0], ...sections].join("\n");
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
