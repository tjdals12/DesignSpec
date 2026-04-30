import type { Artifact } from "./schema.js";
import { SchemaValidationError } from "./error.js";

export function validateNoDuplicateArtifactIds(artifacts: Artifact[]): void {
  const set = new Set<string>();
  for (const artifact of artifacts) {
    if (set.has(artifact.id)) {
      throw new SchemaValidationError(`Duplicate artifact ID: ${artifact.id}`);
    }
    set.add(artifact.id);
  }
}

export function validateArtifactRequiresReferences(
  artifacts: Artifact[],
): void {
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

export function validateNoArtifactDependencyCycles(
  artifacts: Artifact[],
): void {
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
