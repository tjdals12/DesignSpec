import yaml from "yaml";

import path from "node:path";
import fs from "node:fs/promises";

import { validateChangeName } from "./validation.js";
import { DESIGN_SPEC_DIR_NAME, METADATA_FILENAME } from "../config.js";
import { FileSystemUtils } from "../../utils/file-system.utils.js";

export async function createChange(projectPath: string, changeName: string) {
  const changesDirPath = path.join(
    projectPath,
    DESIGN_SPEC_DIR_NAME,
    "changes",
  );
  const changesDirExists =
    await FileSystemUtils.directoryExists(changesDirPath);
  if (!changesDirExists) {
    throw new Error("DesignSpec is not intialized. Run: design-spec init");
  }

  const changeDirPath = path.join(changesDirPath, changeName);
  const changeDirExists = await FileSystemUtils.directoryExists(changeDirPath);
  if (changeDirExists) {
    throw new Error(
      `Change '${changeName}' already exists at ${changeDirPath}`,
    );
  }

  try {
    await validateChangeName(changeName);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Invalid change name '${changeName}': ${message}`);
  }

  await FileSystemUtils.createDirectory(changeDirPath);

  const metadataPath = path.join(changeDirPath, METADATA_FILENAME);
  const metadata = {
    schema: "default",
    created: new Date().toISOString().split("T")[0],
  };

  const content = yaml.stringify(metadata);
  try {
    await fs.writeFile(metadataPath, content, "utf-8");
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to write metadata: ${message}`);
  }
}
