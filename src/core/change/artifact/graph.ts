import type { Artifact, SchemaYaml } from "./schema/schema.js";

export class ArtifactGraph {
  private _schema: SchemaYaml;
  private _artifacts: Map<string, Artifact>;

  constructor(schema: SchemaYaml) {
    this._schema = schema;
    this._artifacts = new Map(
      schema.artifacts.map((artifact) => [artifact.id, artifact]),
    );
  }

  getName(): string {
    return this._schema.name;
  }

  getAllArtifacts(): Artifact[] {
    return Array.from(this._artifacts.values());
  }

  getNextArtifacts(completedArtifacts: Set<string>): string[] {
    const artifacts = this.getAllArtifacts();

    const ready = artifacts
      .filter((artifact) => {
        const isComplete = completedArtifacts.has(artifact.id);
        if (isComplete) {
          return false;
        }

        const hasMissingDep = artifact.requires.some(
          (dep) => !completedArtifacts.has(dep),
        );
        if (hasMissingDep) {
          return false;
        }

        return true;
      })
      .map((artifact) => artifact.id);

    return ready;
  }

  getMissingDependencies(
    completedArtifacts: Set<string>,
  ): Map<string, string[]> {
    const artifacts = this.getAllArtifacts();
    const map = artifacts.reduce((acc, cur) => {
      const isComplete = completedArtifacts.has(cur.id);
      if (isComplete) {
        return acc;
      }

      const unmetDeps = cur.requires.filter(
        (dep) => !completedArtifacts.has(dep),
      );
      if (unmetDeps.length > 0) {
        acc.set(cur.id, unmetDeps);
      }

      return acc;
    }, new Map<string, string[]>());

    return map;
  }

  getBuildOrder(): string[] {
    const inDegree = new Map<string, number>();
    const dependents = new Map<string, string[]>();

    const artifactIds = Array.from(this._artifacts.keys());
    const artifacts = Array.from(this._artifacts.values());

    artifacts.forEach((artifact) => {
      inDegree.set(artifact.id, artifact.requires.length);
      dependents.set(artifact.id, []);
    });

    artifacts.forEach((artifact) => {
      artifact.requires.forEach((dep) => {
        dependents.get(dep)!.push(artifact.id);
      });
    });

    const queue = artifactIds.filter((id) => inDegree.get(id) === 0).sort();

    const result: string[] = [];

    while (queue.length > 0) {
      const current = queue.shift()!;
      result.push(current);

      const ready: string[] = [];
      const deps = dependents.get(current)!;
      for (const dep of deps) {
        const degree = inDegree.get(dep)! - 1;
        inDegree.set(dep, degree);
        if (degree === 0) {
          ready.push(dep);
        }
      }
      queue.push(...ready.sort());
    }

    return result;
  }

  isAllCompleted(completedArtifacts: Set<string>): boolean {
    const artifacts = this.getAllArtifacts();
    return artifacts.every((artifact) => completedArtifacts.has(artifact.id));
  }
}
