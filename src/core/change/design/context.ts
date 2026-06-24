import type { SchemaYaml } from "../artifact/schema/schema.js";
import type { DesignResult } from "./types.js";

export class DesignContext {
  private _schema: SchemaYaml;
  private _requires: Set<string>;
  private _instruction: string;

  constructor(schema: SchemaYaml) {
    this._schema = schema;
    this._requires = new Set(schema.design.requires);
    this._instruction = schema.design.instruction;
  }

  getName(): string {
    return this._schema.name;
  }

  getRequires(): string[] {
    return [...this._requires];
  }

  resolve(completedArtifacts: Set<string>): DesignResult {
    const missingArtifacts = [...this._requires].filter((r) => !completedArtifacts.has(r));

    return {
      missingArtifacts,
      instruction: this._instruction,
    };
  }
}
