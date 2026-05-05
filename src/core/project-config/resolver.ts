import fs from "node:fs/promises";

import { parse as parseYaml } from "yaml";

import { buildConfigPaths } from "./paths.js";
import { ProjectConfigSchema, type ProjectConfig } from "./types.js";

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

  if (parsed === null || typeof parsed !== "object") {
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
