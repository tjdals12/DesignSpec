import { z } from "zod";

import fs from "node:fs/promises";
import { parse as parseYaml } from "yaml";

import * as packagePaths from "../../utils/package-paths.js";

const ArtifactSchema = z.object({
  id: z.string().min(1, { error: "Artifact ID is required" }),
  generates: z.string().min(1, { error: "generates field is required" }),
  description: z.string().optional(),
  template: z.string().min(1, { error: "template is required" }),
  instruction: z.string().optional(),
  requires: z.array(z.string()).default([]),
});
export type Artifact = z.infer<typeof ArtifactSchema>;

const SchemaYamlSchema = z.object({
  name: z.string().min(1, { error: "Schema name is required" }),
  version: z
    .number()
    .int()
    .positive({ error: "Version must be a positive integer" }),
  description: z.string().optional(),
  artifacts: z
    .array(ArtifactSchema)
    .min(1, { error: "At least one artifact required" }),
});
export type SchemaYaml = z.infer<typeof SchemaYamlSchema>;

class SchemaValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SchemaValidationError";
  }
}

function validateNoDuplicateArtifactIds(artifacts: Artifact[]): void {
  const set = new Set<string>();
  for (const artifact of artifacts) {
    if (set.has(artifact.id)) {
      throw new SchemaValidationError(`Duplicate artifact ID: ${artifact.id}`);
    }
    set.add(artifact.id);
  }
}

function validateArtifactRequiresReferences(artifacts: Artifact[]): void {
  const artifactIds = new Set(artifacts.map((artifact) => artifact.id));

  for (const artifact of artifacts) {
    const { requires } = artifact;
    for (const require of requires) {
      if (!artifactIds.has(require)) {
        throw new SchemaValidationError(
          `Invalid dependency reference in artifact '${artifact.id}': '${require}' does not exist`,
        );
      }
    }
  }
}

function validateNoArtifactDependencyCycles(artifacts: Artifact[]): void {
  const artifactMap = new Map(
    artifacts.map((artifact) => [artifact.id, artifact]),
  );
  const visited = new Set<string>();
  const visiting = new Set<string>();
  const parent = new Map<string, string>();

  const dfs = (artifactId: string): string | null => {
    visited.add(artifactId);
    visiting.add(artifactId);

    const artifact = artifactMap.get(artifactId);
    if (!artifact) return null;

    for (const dependency of artifact.requires) {
      if (!visited.has(dependency)) {
        parent.set(dependency, artifact.id);
        const cycle = dfs(dependency);
        if (cycle) return cycle;
      } else if (visiting.has(dependency)) {
        const cyclePath = [dependency];
        let current = artifact.id;
        while (current !== dependency) {
          cyclePath.unshift(current);
          current = parent.get(current)!;
        }
        cyclePath.unshift(dependency);
        return cyclePath.join(" → ");
      }
    }

    visiting.delete(artifact.id);
    return null;
  };

  for (const artifact of artifacts) {
    if (!visited.has(artifact.id)) {
      const cycle = dfs(artifact.id);
      if (cycle) {
        throw new SchemaValidationError(`Cyclic dependency detected: ${cycle}`);
      }
    }
  }
}

function parseSchema(content: string): SchemaYaml {
  const parsed = parseYaml(content);

  const result = SchemaYamlSchema.safeParse(parsed);
  if (!result.success) {
    const errors = result.error.issues
      .map((e) => `${e.path.join(".")}: ${e.message}`)
      .join(", ");
    throw new SchemaValidationError(`Invalid schema: ${errors}`);
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
    content = await fs.readFile(packagePaths.DEFAULT_SCHEMA, "utf-8");
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new SchemaValidationError(
      `Failed to load schema at '${packagePaths.DEFAULT_SCHEMA}': ${message}`,
    );
  }

  try {
    const schema = parseSchema(content);
    return schema;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (error instanceof SchemaValidationError) {
      throw new Error(
        `Invalid schema at '${packagePaths.DEFAULT_SCHEMA}': ${message}`,
      );
    }
    throw new Error(
      `Failed to parse schema at '${packagePaths.DEFAULT_SCHEMA}': ${message}`,
    );
  }
}
