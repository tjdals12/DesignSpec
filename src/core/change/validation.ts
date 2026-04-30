import { isEmpty } from "es-toolkit/compat";
import { getAvailableChanges, hasChangesDir } from "./query.js";

export async function validateChangesDir(projectPath: string): Promise<void> {
  const exists = await hasChangesDir(projectPath);
  if (!exists) {
    throw new Error("DesignSpec is not initialized. Run: design-spec init");
  }
}

export async function validateAvailableChanges(
  projectPath: string,
): Promise<void> {
  const availableChanges = await getAvailableChanges(projectPath);
  if (availableChanges.length === 0) {
    throw new Error(
      "No changes found. Create one with: design-spec new change <name>",
    );
  }
}

export async function validateChangeName(changeName: string): Promise<void> {
  try {
    if (isEmpty(changeName)) {
      throw new Error("Change name cannot be empty");
    }

    const kebabCasePattern = /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/;
    if (!kebabCasePattern.test(changeName)) {
      throw new Error(
        "Change name must follow kebab-case convention (e.g., add-auth, refactor-db)",
      );
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Invalid change name '${changeName}': ${message}`);
  }
}
