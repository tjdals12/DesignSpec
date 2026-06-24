import { isBoolean, isUndefined } from "es-toolkit";
import ora from "ora";

import path from "node:path";

import { doesChangeExist, getAvailableChanges } from "#core/change/query.js";
import { loadChangeContext } from "#core/change/context.js";
import type { DesignInstructions } from "#core/change/design/types.js";
import { formatProjectContext } from "#core/project-config/format.js";
import { resolveDesignInstructions } from "#core/change/design/instructions.js";

export class DesignInstructionsCommand {
  private readonly _change?: string | undefined;
  private readonly _json: boolean;

  constructor(options: { change?: string; json?: boolean }) {
    this._change = options.change;
    this._json = isBoolean(options.json) ? options.json : false;
  }

  async execute(targetPath: string) {
    const projectPath = path.resolve(targetPath);
    const changeName = this._change;

    const spinner = this._json ? undefined : ora("Generating design instructions...").start();

    try {
      const hasChangeName = !isUndefined(changeName);

      if (!hasChangeName) {
        await this.handleNoChange(projectPath);
        return;
      }

      const changeExists = await doesChangeExist(projectPath, changeName);
      if (!changeExists) {
        await this.handleChangeNotFound(projectPath, changeName);
        return;
      }

      const changeContext = await loadChangeContext(projectPath, changeName);
      const designInstructions = await resolveDesignInstructions(projectPath, changeContext);

      spinner?.stop();

      this.printDesignInstructions(designInstructions);
    } catch (error) {
      spinner?.stop();
      throw error;
    }
  }

  private async handleNoChange(projectPath: string) {
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

  private async handleChangeNotFound(projectPath: string, changeName: string) {
    const availableChanges = await getAvailableChanges(projectPath);
    if (this._json) {
      console.log(
        JSON.stringify(
          {
            error: `Change '${changeName}' not found.`,
            availableChanges,
          },
          null,
          2,
        ),
      );
      return;
    }
    if (availableChanges.length === 0) {
      throw new Error(`Change '${changeName}' not found. No available changes.`);
    }
    throw new Error(
      `Change '${changeName}' not found. Available changes:\n  ${availableChanges.join("\n  ")}`,
    );
  }

  private printDesignInstructions(designInstructions: DesignInstructions) {
    const { changeName, schemaName, projectContext, design } = designInstructions;
    const { missingArtifacts, instruction, screens, components, pages } = design;

    if (this._json) {
      console.log(
        JSON.stringify(
          {
            change: changeName,
            schema: schemaName,
            projectContext,
            warning:
              missingArtifacts.length > 0
                ? {
                    message:
                      "Cannot generate the design prompt yet. Complete missing artifacts first.",
                    missingArtifacts,
                  }
                : undefined,
            instruction: instruction.trim(),
            screens,
            components,
            pages,
          },
          null,
          2,
        ),
      );
      return;
    }

    // Project context
    if (projectContext) {
      console.log("<project_context>");
      console.log(formatProjectContext(projectContext));
      console.log("</project_context>");
      console.log();
    }

    // Opening tag
    console.log(`<design change="${changeName}" schema="${schemaName}" target="all">`);
    console.log();

    if (missingArtifacts.length > 0) {
      console.log("<warning>");
      console.log("Cannot generate the design prompt yet. Complete missing artifacts first.");
      console.log(`Missing: ${missingArtifacts.join(", ")}`);
      console.log("</warning>");
      console.log();
    }

    // Instruction
    console.log("<instruction>");
    console.log(instruction.trim());
    console.log("</instruction>");
    console.log();

    // Screens
    if (screens) {
      console.log("<screens>");
      console.log(screens);
      console.log("</screens>");
      console.log();
    }

    // Components
    if (components.length > 0) {
      console.log(`<components count="${components.length}">`);
      console.log();
      for (const component of components) {
        console.log(`<component name="${component.name}">`);
        console.log(`<spec>`);
        console.log(component.spec);
        console.log(`</spec>`);
        console.log("</component>");
        console.log();
      }
      console.log("</components>");
      console.log();
    }

    // Pages
    if (pages.length > 0) {
      console.log(`<pages count="${pages.length}">`);
      console.log();
      for (const page of pages) {
        console.log(`<page name="${page.name}">`);
        console.log("<spec>");
        console.log(page.spec);
        console.log("</spec>");
        console.log("</page>");
        console.log();
      }
      console.log("</pages>");
      console.log();
    }

    // Closing tag
    console.log("</design>");
  }
}
