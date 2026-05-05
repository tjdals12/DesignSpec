import { isBoolean } from "es-toolkit";

import path from "node:path";

import { resolveProjectContext } from "#core/project-config/resolver.js";
import { formatProjectContext } from "#core/project-config/format.js";
import type { ProjectContext } from "#core/project-config/types.js";

interface ContextOptions {
  json?: boolean;
}

export class ContextCommand {
  private readonly _json: boolean;

  constructor(options: ContextOptions) {
    this._json = isBoolean(options.json) ? options.json : false;
  }

  async execute(targetPath: string): Promise<void> {
    const projectPath = path.resolve(targetPath);
    const projectContext = await resolveProjectContext(projectPath);

    if (this._json) {
      this.printJson(projectContext);
      return;
    }

    this.printText(projectContext);
  }

  private printJson(projectContext: ProjectContext | null): void {
    console.log(JSON.stringify(projectContext, null, 2));
  }

  private printText(projectContext: ProjectContext | null): void {
    if (projectContext === null) return;

    console.log("<project_context>");
    console.log(formatProjectContext(projectContext));
    console.log("</project_context>");
  }
}
