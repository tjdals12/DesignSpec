import yaml from "yaml";

import { validateChangeName, validateChangesDir } from "./validation.js";
import { FileSystemUtils } from "#utils/file-system.utils.js";
import { doesChangeExist } from "./query.js";
import { buildChangeDirPath, buildMetadataPath } from "./paths.js";

export async function createChange(projectPath: string, changeName: string) {
  await validateChangesDir(projectPath);
  await validateChangeName(changeName);

  const changeDirExists = await doesChangeExist(projectPath, changeName);
  if (changeDirExists) {
    throw new Error(`Change '${changeName}' already exists.`);
  }

  const changeDirPath = buildChangeDirPath(projectPath, changeName);
  await FileSystemUtils.createDirectory(changeDirPath);

  const metadataPath = buildMetadataPath(projectPath, changeName);
  const metadata = yaml.stringify({
    schema: "default",
    created: new Date().toISOString().split("T")[0],
  });
  await FileSystemUtils.writeFile(metadataPath, metadata);
}
