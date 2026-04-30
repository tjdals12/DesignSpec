import path from "node:path";
import fs from "node:fs/promises";

import { DEFAULT_SCHEMA_DIR } from "../../../../utils/package-paths.js";

export class TemplateLoadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TemplateLoadError";
  }
}

export async function resolveTemplate(template: string): Promise<string> {
  const templatePath = path.join(DEFAULT_SCHEMA_DIR, "templates", template);
  let content: string;
  try {
    content = await fs.readFile(templatePath, "utf-8");
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new TemplateLoadError(
      `Failed to load template at '${templatePath}': ${message}`,
    );
  }
  return content;
}
