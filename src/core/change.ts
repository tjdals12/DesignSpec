import { isUndefined } from "es-toolkit";

import path from "node:path";
import fs from "node:fs/promises";

import { FileSystemUtils } from "../utils/file-system.utils.js";

export async function getAvailableChanges(
  designSpecPath: string,
): Promise<string[]> {
  const changesPath = path.join(designSpecPath, "changes");
  try {
    const entries = await fs.readdir(changesPath, { withFileTypes: true });
    return entries
      .filter((entry) => {
        if (!entry.isDirectory()) return false;
        if (entry.name === "archive") return false;
        if (entry.name.startsWith(".")) return false;
        return true;
      })
      .map((entry) => entry.name);
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") {
      return [];
    }
    throw error;
  }
}

export function validateChangeName(changeName: string): {
  valid: boolean;
  error?: string;
} {
  const kebabCasePattern = /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/;

  if (!changeName) {
    return { valid: false, error: "Change name cannot be empty" };
  }

  if (!kebabCasePattern.test(changeName)) {
    if (/[A-Z]/.test(changeName)) {
      return {
        valid: false,
        error: "Change name must be lowercase (use kebab-case)",
      };
    }
    if (/\s/.test(changeName)) {
      return {
        valid: false,
        error: "Change name cannot contain spaces (use hyphens instead)",
      };
    }
    if (/_/.test(changeName)) {
      return {
        valid: false,
        error: "Change name cannot contain underscores (use hyphens instead)",
      };
    }
    if (changeName.startsWith("-")) {
      return { valid: false, error: "Change name cannot start with a hyphen" };
    }
    if (changeName.endsWith("-")) {
      return { valid: false, error: "Change name cannot end with a hyphen" };
    }
    if (/--/.test(changeName)) {
      return {
        valid: false,
        error: "Change name cannot contain consecutive hyphens",
      };
    }
    if (/[^a-z0-9-]/.test(changeName)) {
      return {
        valid: false,
        error:
          "Change name can only contain lowercase letters, numbers, and hyphens",
      };
    }
    if (/^[0-9]/.test(changeName)) {
      return { valid: false, error: "Change name must start with a letter" };
    }

    return {
      valid: false,
      error:
        "Change name must follow kebab-case convention (e.g., add-auth, refactor-db)",
    };
  }

  return { valid: true };
}

export async function doesChangeExist(
  designSpecPath: string,
  changeName: string,
): Promise<boolean> {
  const changePath = path.join(designSpecPath, "changes", changeName);
  return FileSystemUtils.directoryExists(changePath);
}

async function validateAvailableChanges(
  designSpecPath: string,
  notFoundMessage: string,
): Promise<never> {
  const availableChanges = await getAvailableChanges(designSpecPath);
  if (availableChanges.length === 0) {
    throw new Error(
      "No changes found. Create one with: design-spec new change <name>",
    );
  }
  throw new Error(
    `${notFoundMessage}. Available changes:\n  ${availableChanges.join("\n  ")}`,
  );
}

export async function validateChangeExists(
  designSpecPath: string,
  changeName: string | undefined,
): Promise<string> {
  const designSpecExists =
    await FileSystemUtils.directoryExists(designSpecPath);
  if (!designSpecExists) {
    throw new Error("DesignSpec is not initialized. Run: design-spec init");
  }

  const changesPath = path.join(designSpecPath, "changes");
  const changesDirExists = await FileSystemUtils.directoryExists(changesPath);
  if (!changesDirExists) {
    throw new Error(
      "No changes directory found. Create one with: design-spec new change <name>",
    );
  }

  if (isUndefined(changeName)) {
    return await validateAvailableChanges(
      designSpecPath,
      "Missing required option --change",
    );
  }

  const isValidChangeName = validateChangeName(changeName);
  if (!isValidChangeName.valid) {
    throw new Error(
      `Invalid change name '${changeName}': ${isValidChangeName.error}`,
    );
  }

  const exists = await doesChangeExist(designSpecPath, changeName);
  if (!exists) {
    return await validateAvailableChanges(
      designSpecPath,
      `Change '${changeName}' not found`,
    );
  }

  return changeName;
}
