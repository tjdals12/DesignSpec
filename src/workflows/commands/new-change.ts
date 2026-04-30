import { isUndefined } from "es-toolkit";
import ora from "ora";

import path from "node:path";

import { createChange } from "../../core/change/mutation.js";

export class NewChangeCommand {
  private readonly _change?: string | undefined;

  constructor(options: { change?: string }) {
    this._change = options.change;
  }

  async execute(targetPath: string) {
    const projectPath = path.resolve(targetPath);

    const changeName = this._change;

    const hasChangeName = !isUndefined(changeName);
    if (!hasChangeName) {
      throw new Error(
        "Missing required option --change.\n  Run: design-spec new --change <name>",
      );
    }

    const spinner = ora(
      `Creating change '${this._change}' with schema 'default'...`,
    ).start();

    try {
      await createChange(projectPath, changeName);

      spinner.succeed(
        `Created change '${changeName}' at design-spec/changes/${changeName}/ (schema: default)`,
      );
    } catch (error) {
      spinner.stop();
      throw error;
    }
  }
}
