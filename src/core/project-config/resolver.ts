import path from "node:path";
import fs from "node:fs/promises";

import { parse as parseYaml } from "yaml";

import { buildConfigPaths } from "./paths.js";
import { ProjectConfigSchema, type ProjectConfig, type ProjectContext } from "./types.js";
import { buildStylesDirPath } from "../styles/paths.js";

export async function resolveProjectConfig(projectPath: string): Promise<ProjectConfig | null> {
  let content: string | null = null;
  let resolvedPath: string | null = null;

  for (const candidate of buildConfigPaths(projectPath)) {
    try {
      content = await fs.readFile(candidate, "utf-8");
      resolvedPath = candidate;
      break;
    } catch {
      continue;
    }
  }

  if (content === null) return null;

  let parsed: unknown;
  try {
    parsed = parseYaml(content);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`Failed to parse ${resolvedPath}: ${message}`);
    return null;
  }

  if (parsed === null || parsed === undefined) return null;

  if (typeof parsed !== "object") {
    console.warn(`${resolvedPath} is not a valid YAML object`);
    return null;
  }

  const result = ProjectConfigSchema.safeParse(parsed);
  if (!result.success) {
    const errors = result.error.issues.map((e) => `${e.path.join(".")}: ${e.message}`).join(", ");
    console.warn(`Invalid ${resolvedPath}: ${errors}`);
    return null;
  }

  return result.data;
}

export async function resolveProjectContext(projectPath: string): Promise<ProjectContext | null> {
  const config = await resolveProjectConfig(projectPath);

  const result: ProjectContext = {};

  const inline = config?.context?.trim();
  if (inline) {
    result.context = inline;
  }

  const contextFiles: ProjectContext["contextFiles"] = [];
  for (const filePath of config?.contextFiles ?? []) {
    const absolutePath = path.isAbsolute(filePath) ? filePath : path.resolve(projectPath, filePath);
    try {
      const fileContent = await fs.readFile(absolutePath, "utf-8");
      contextFiles.push({ path: filePath, content: fileContent.trim() });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.warn(`contextFiles: cannot read '${filePath}': ${message}`);
    }
  }
  if (contextFiles.length > 0) {
    result.contextFiles = contextFiles;
  }

  const styleFilePath = path.join(buildStylesDirPath(projectPath), "style.md");
  try {
    const styleContent = await fs.readFile(styleFilePath, "utf-8");
    result.style = styleContent.trim();
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
      const message = error instanceof Error ? error.message : String(error);
      console.warn(`style: cannot read '${styleFilePath}': ${message}`);
    }
  }

  const isEmpty = !result.context && !result.contextFiles && !result.style;
  return isEmpty ? null : result;
}
