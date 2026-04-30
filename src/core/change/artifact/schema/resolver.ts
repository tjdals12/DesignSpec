import { parse as parseYaml } from "yaml";

import fs from "node:fs";

import { DEFAULT_SCHEMA } from "#utils/package-paths.js";
import { SchemaYamlSchema, type SchemaYaml } from "./schema.js";
import {
  validateArtifactRequiresReferences,
  validateNoArtifactDependencyCycles,
  validateNoDuplicateArtifactIds,
} from "./validation.js";
import { SchemaLoadError, SchemaParseError, SchemaValidationError } from "./error.js";

export function parseSchema(content: string): SchemaYaml {
  let parsed;
  try {
    parsed = parseYaml(content);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new SchemaParseError(`Failed to parse YAML: ${message}`);
  }

  const result = SchemaYamlSchema.safeParse(parsed);
  if (!result.success) {
    const errors = result.error.issues
      .map((e) => `${e.path.join(".")}: ${e.message}`)
      .join(", ");
    throw new SchemaParseError(`Invalid schema: ${errors}`);
  }

  const schema = result.data;

  validateNoDuplicateArtifactIds(schema.artifacts);

  validateArtifactRequiresReferences(schema.artifacts);

  validateNoArtifactDependencyCycles(schema.artifacts);

  return schema;
}

export async function resolveSchema(): Promise<SchemaYaml> {
  let content: string;
  try {
    content = fs.readFileSync(DEFAULT_SCHEMA, "utf-8");
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new SchemaLoadError(
      `Failed to load schema at '${DEFAULT_SCHEMA}': ${message}`,
    );
  }

  try {
    const schema = parseSchema(content);
    return schema;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (error instanceof SchemaParseError) {
      throw new Error(
        `Failed to parse schema at '${DEFAULT_SCHEMA}': ${message}`,
      );
    }
    if (error instanceof SchemaValidationError) {
      throw new Error(`Invalid schema at '${DEFAULT_SCHEMA}': ${message}`);
    }
    throw error;
  }
}
