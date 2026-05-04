import { isBoolean, isUndefined } from "es-toolkit";
import ora from "ora";

import path from "node:path";

import { doesChangeExist, getAvailableChanges } from "#core/change/query.js";
import { loadChangeContext } from "#core/change/context.js";
import { resolveArtifactInstructions } from "#core/change/artifact/instructions.js";
import type { ArtifactInstructions } from "#core/change/artifact/types.js";

export class ArtifactInstructionsCommand {
  private readonly _change?: string | undefined;
  private readonly _artifact?: string | undefined;
  private readonly _json: boolean;

  constructor(options: { change?: string; artifact?: string; json?: boolean }) {
    this._change = options.change;
    this._artifact = options.artifact;
    this._json = isBoolean(options.json) ? options.json : false;
  }

  async execute(targetPath: string) {
    const projectPath = path.resolve(targetPath);
    const changeName = this._change;
    const artifactName = this._artifact;

    const spinner = this._json ? undefined : ora("Generating instructions...").start();

    try {
      const hasChangeName = !isUndefined(changeName);
      const hasArtifactName = !isUndefined(artifactName);

      if (!hasChangeName && !hasArtifactName) {
        this.handleMissingChangeAndArtifact();
        return;
      }

      if (!hasChangeName) {
        await this.handleNoChange(projectPath);
        return;
      }

      const changeExists = await doesChangeExist(projectPath, changeName);
      if (!changeExists) {
        await this.handleChangeNotFound(projectPath, changeName);
        return;
      }

      if (!hasArtifactName) {
        await this.handleNoArtifact(projectPath, changeName);
        return;
      }

      const changeContext = await loadChangeContext(projectPath, changeName);
      const artifact = changeContext.artifactGraph.getArtifact(artifactName);
      const hasArtifact = !isUndefined(artifact);
      if (!hasArtifact) {
        await this.handleArtifactNotFound(changeContext, artifactName);
        return;
      }

      const artifactInstructions = await resolveArtifactInstructions(
        projectPath,
        changeContext,
        artifactName,
      );

      spinner?.stop();

      this.printArtifactInstructions(artifactInstructions);
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

  private handleMissingChangeAndArtifact() {
    if (this._json) {
      console.log(
        JSON.stringify({ error: "Missing required options --change, --artifact." }, null, 2),
      );
      return;
    }
    throw new Error(
      "Missing required options --change, --artifact.\n  Run: design-spec artifact-instructions --change <name> --artifact <name>",
    );
  }

  private async handleChangeNotFound(projectPath: string, changeName: string): Promise<void> {
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

  private async handleArtifactNotFound(
    changeContext: Awaited<ReturnType<typeof loadChangeContext>>,
    artifactName: string,
  ): Promise<void> {
    const artifacts = changeContext.artifactGraph.getAllArtifacts();
    const artifactIds = artifacts.map((artifact) => artifact.id);
    if (this._json) {
      console.log(
        JSON.stringify(
          {
            error: `Artifact '${artifactName}' not found.`,
            validArtifacts: artifactIds,
          },
          null,
          2,
        ),
      );
      return;
    }
    throw new Error(
      `Artifact '${artifactName}' not found. Valid artifacts:\n  ${artifactIds.join("\n  ")}`,
    );
  }

  private async handleNoArtifact(projectPath: string, changeName: string) {
    const changeContext = await loadChangeContext(projectPath, changeName);
    const artifacts = changeContext.artifactGraph.getAllArtifacts();
    const artifactIds = artifacts.map((artifact) => artifact.id);
    if (this._json) {
      console.log(
        JSON.stringify(
          {
            error: "Missing required option --artifact.",
            validArtifacts: artifactIds,
          },
          null,
          2,
        ),
      );
      return;
    }
    throw new Error(
      `Missing required option --artifact. Valid artifacts:\n  ${artifactIds.join("\n  ")}`,
    );
  }

  private printArtifactInstructions(artifactInstructions: ArtifactInstructions): void {
    if (this._json) {
      const { schemaName, changeName, changeDirPath, artifact } = artifactInstructions;
      const { id, description, dependencies, generates, instruction, template, dependents } =
        artifact;
      const missingDependencies = dependencies.filter((d) => d.done === false).map((d) => d.id);
      console.log(
        JSON.stringify(
          {
            id,
            change: changeName,
            schema: schemaName,
            warning:
              missingDependencies.length > 0
                ? {
                    message:
                      "This artifact has unmet dependencies. Complete them first or proceed with caution.",
                    missingDependencies,
                  }
                : undefined,
            task: {
              description: `Create the ${id} for change="${changeName}"`,
              details: description,
            },
            dependencies: dependencies.map((d) => ({
              id: d.id,
              status: d.done ? "done" : "missing",
              path: path.join(changeDirPath, d.generates),
              description: d.description,
            })),
            output: path.join(changeDirPath, generates),
            instruction: instruction.trim(),
            template: template.trim(),
            unlocks: dependents,
          },
          null,
          2,
        ),
      );
      return;
    }

    const { schemaName, changeName, changeDirPath, artifact } = artifactInstructions;
    const { id, description, dependencies, generates, instruction, template, dependents } =
      artifact;
    const outputPath = path.join(changeDirPath, generates);

    // Opening tag
    console.log(`<artifact id="${id}" change="${changeName}" schema="${schemaName}">`);
    console.log();

    const missingDependencies = dependencies
      .filter((dependency) => dependency.done === false)
      .map((dependency) => dependency.id);
    if (missingDependencies.length > 0) {
      console.log("<warning>");
      console.log(
        "This artifact has unmet dependencies. Complete them first or proceed with caution.",
      );
      console.log(`Missing: ${missingDependencies.join(", ")}`);
      console.log("</warning>");
      console.log();
    }

    // Task
    console.log("<task>");
    console.log(`Create the ${id} for change="${changeName}"`);
    if (description) {
      console.log(description);
    }
    console.log("</task>");
    console.log();

    // Dependencies
    if (dependencies.length > 0) {
      console.log("<dependencies>");
      console.log("Read these files for context before creating this artifact:");
      console.log();

      for (const dependency of dependencies) {
        const { id, description, generates, done } = dependency;
        const status = done ? "done" : "missing";
        const fullPath = path.join(changeDirPath, generates);

        console.log(`<dependency id="${id}" status="${status}">`);
        console.log(`<path>${fullPath}</path>`);
        if (description) {
          console.log(`<description>${description}</description>`);
        }
        console.log(`</dependency>`);
      }

      console.log("</dependencies>");
      console.log();
    }

    // Output
    console.log("<output>");
    console.log(`Write to ${outputPath}`);
    console.log("</output>");
    console.log();

    // Instruction
    console.log("<instruction>");
    console.log(instruction.trim());
    console.log("</instruction>");
    console.log();

    // Template
    console.log("<template>");
    console.log("<!-- Use this as the structure for your output file. Fill in the sections. -->");
    console.log(template.trim());
    console.log("</template>");
    console.log();

    // Unlocks
    if (dependents.length > 0) {
      console.log("<unlocks>");
      console.log(`Completing this artifact enables: ${dependents.join(", ")}`);
      console.log("</unlocks>");
      console.log();
    }

    // Closing tag
    console.log(`</artifact>`);
  }
}
