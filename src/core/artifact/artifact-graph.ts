import type { Artifact, SchemaYaml } from "./schema-resolver.js";

export class ArtifactGraph {
  private _schema: SchemaYaml;
  private _artifacts: Map<string, Artifact>;

  constructor(schema: SchemaYaml) {
    this._schema = schema;
    this._artifacts = new Map(
      schema.artifacts.map((artifact) => [artifact.id, artifact]),
    );
  }

  getAllArtifacts(): Artifact[] {
    return Array.from(this._artifacts.values());
  }
}
