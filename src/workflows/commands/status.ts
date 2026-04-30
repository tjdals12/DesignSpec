import ora from "ora";
import chalk from "chalk";
import { isBoolean, isUndefined } from "es-toolkit";

import path from "node:path";

import { doesChangeExist, getAvailableChanges } from "#core/change/query.js";
import { loadChangeContext } from "#core/change/context.js";
import type { ArtifactStatus, ChangeContext, ChangeStatus } from "#core/change/types.js";
import { getStatusColor, getStatusIndicator } from "#workflows/utils/status-display.js";

export class StatusCommand {
  private readonly _change?: string | undefined;
  private readonly _json: boolean;

  constructor(options: { change?: string; json?: boolean }) {
    this._change = options.change;
    this._json = isBoolean(options.json) ? options.json : false;
  }

  async execute(targetPath: string) {
    const projectPath = path.resolve(targetPath);
    const changeName = this._change;

    const spinner = this._json ? undefined : ora("Loading change status...").start();

    try {
      const hasChangeName = !isUndefined(changeName);
      if (!hasChangeName) {
        spinner?.stop();
        await this.handleNoChange(projectPath);
        return;
      }

      const changeExists = await doesChangeExist(projectPath, changeName);
      if (!changeExists) {
        spinner?.stop();
        await this.handleChangeNotFound(projectPath, changeName);
        return;
      }

      const changeContext = await loadChangeContext(projectPath, changeName);
      const changeStatus = await this.formatStatus(changeContext);

      spinner?.stop();

      this.printStatus(changeStatus);
    } catch (error) {
      spinner?.stop();
      throw error;
    }
  }

  private async handleNoChange(projectPath: string): Promise<void> {
    const availableChanges = await getAvailableChanges(projectPath);
    if (availableChanges.length === 0) {
      if (this._json) {
        console.log(JSON.stringify({ changes: [], message: "No active changes." }, null, 2));
      } else {
        console.log("No active changes. Create one with: design-spec new change <name>");
      }
      return;
    }
    throw new Error(
      `Missing required option --change. Available changes:\n  ${availableChanges.join("\n  ")}`,
    );
  }

  private async handleChangeNotFound(projectPath: string, changeName: string): Promise<void> {
    const availableChanges = await getAvailableChanges(projectPath);
    if (availableChanges.length === 0) {
      throw new Error(`Change '${changeName}' not found. No avaiable changes.`);
    }
    throw new Error(
      `Change '${changeName}' not found. Available changes:\n  ${availableChanges.join("\n  ")}`,
    );
  }

  private formatStatus(changeContext: ChangeContext): ChangeStatus {
    const { changeName, schemaName, artifactGraph, completedArtifacts } = changeContext;

    const artifacts = artifactGraph.getAllArtifacts();
    const ready = new Set(artifactGraph.getNextArtifacts(completedArtifacts));
    const blocked = artifactGraph.getMissingDependencies(completedArtifacts);

    const artifactStatuses = artifacts.map<ArtifactStatus>((artifact) => {
      const { id } = artifact;

      if (completedArtifacts.has(id)) {
        return {
          id,
          status: "done" as const,
          missingDeps: [],
        };
      }

      if (ready.has(id)) {
        return {
          id,
          status: "ready" as const,
          missingDeps: [],
        };
      }

      return {
        id,
        status: "blocked" as const,
        missingDeps: blocked.get(artifact.id) ?? [],
      };
    });

    const buildOrder = artifactGraph.getBuildOrder();
    const orderMap = new Map(buildOrder.map((artifactId, index) => [artifactId, index]));
    artifactStatuses.sort((a, b) => (orderMap.get(a.id) ?? 0) - (orderMap.get(b.id) ?? 0));

    const isComplete = artifactGraph.isAllCompleted(completedArtifacts);

    return {
      changeName,
      schemaName,
      artifactStatuses,
      isComplete,
    };
  }

  private printStatus(changeStatus: ChangeStatus): void {
    const { changeName, schemaName, artifactStatuses, isComplete } = changeStatus;

    if (this._json) {
      const doneCount = artifactStatuses.filter((s) => s.status === "done").length;
      console.log(
        JSON.stringify(
          {
            changeName,
            schemaName,
            progress: { done: doneCount, total: artifactStatuses.length },
            artifacts: artifactStatuses,
            isComplete,
          },
          null,
          2,
        ),
      );
      return;
    }

    console.log(`Change: ${changeName}`);
    console.log(`Schema: ${schemaName}`);

    const doneCount = artifactStatuses.filter(
      (artifactStatus) => artifactStatus.status === "done",
    ).length;
    const totalCount = artifactStatuses.length;
    console.log(`Progress: ${doneCount}/${totalCount} artifacts complete`);

    console.log();

    for (const artifactStatus of artifactStatuses) {
      const { id, status, missingDeps } = artifactStatus;

      const color = getStatusColor(status);

      const indicator = getStatusIndicator(status);

      let line = `${color(indicator)} ${id}`;

      if (status === "blocked" && artifactStatus.missingDeps.length > 0) {
        line += color(` (blocked by: ${missingDeps.join(", ")})`);
      }
      console.log(line);
    }

    if (isComplete) {
      console.log();
      console.log(chalk.green("All artifacts complete!"));
    }
  }
}
