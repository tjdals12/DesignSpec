import { describe, it, expect } from "vitest";
import {
  validateNoDuplicateArtifactIds,
  validateArtifactRequiresReferences,
  validateNoArtifactDependencyCycles,
} from "#core/change/artifact/schema/validation.js";
import { SchemaValidationError } from "#core/change/artifact/schema/error.js";
import type { Artifact } from "#core/change/artifact/schema/schema.js";

function makeArtifact(id: string, requires: string[] = []): Artifact {
  return {
    id,
    generates: `${id}.md`,
    template: "template",
    instruction: "instruction",
    requires,
  };
}

describe("validateNoDuplicateArtifactIds", () => {
  it("중복이 없으면 에러를 던지지 않는다", () => {
    const artifacts = [makeArtifact("a"), makeArtifact("b"), makeArtifact("c")];
    expect(() => validateNoDuplicateArtifactIds(artifacts)).not.toThrow();
  });

  it("중복 ID가 있으면 SchemaValidationError를 던진다", () => {
    const artifacts = [makeArtifact("a"), makeArtifact("b"), makeArtifact("a")];
    expect(() => validateNoDuplicateArtifactIds(artifacts)).toThrowError(
      SchemaValidationError,
    );
  });

  it("에러 메시지에 중복된 ID가 포함된다", () => {
    const artifacts = [makeArtifact("spec"), makeArtifact("spec")];
    expect(() => validateNoDuplicateArtifactIds(artifacts)).toThrowError(
      /spec/,
    );
  });

  it("빈 배열이면 에러를 던지지 않는다", () => {
    expect(() => validateNoDuplicateArtifactIds([])).not.toThrow();
  });
});

describe("validateArtifactRequiresReferences", () => {
  it("모든 requires가 존재하는 ID를 참조하면 에러를 던지지 않는다", () => {
    const artifacts = [makeArtifact("a"), makeArtifact("b", ["a"])];
    expect(() => validateArtifactRequiresReferences(artifacts)).not.toThrow();
  });

  it("존재하지 않는 ID를 requires하면 SchemaValidationError를 던진다", () => {
    const artifacts = [makeArtifact("a", ["nonexistent"])];
    expect(() => validateArtifactRequiresReferences(artifacts)).toThrowError(
      SchemaValidationError,
    );
  });

  it("에러 메시지에 참조한 artifact ID와 없는 ID가 포함된다", () => {
    const artifacts = [makeArtifact("a", ["ghost"])];
    expect(() => validateArtifactRequiresReferences(artifacts)).toThrowError(
      /a.*ghost|ghost.*a/,
    );
  });

  it("requires가 없는 artifact만 있으면 에러를 던지지 않는다", () => {
    const artifacts = [makeArtifact("a"), makeArtifact("b"), makeArtifact("c")];
    expect(() => validateArtifactRequiresReferences(artifacts)).not.toThrow();
  });
});

describe("validateNoArtifactDependencyCycles", () => {
  it("사이클이 없으면 에러를 던지지 않는다", () => {
    const artifacts = [
      makeArtifact("a"),
      makeArtifact("b", ["a"]),
      makeArtifact("c", ["b"]),
    ];
    expect(() => validateNoArtifactDependencyCycles(artifacts)).not.toThrow();
  });

  it("직접 자기 자신을 requires하면 SchemaValidationError를 던진다", () => {
    const artifacts = [makeArtifact("a", ["a"])];
    expect(() => validateNoArtifactDependencyCycles(artifacts)).toThrowError(
      SchemaValidationError,
    );
  });

  it("두 노드 간 순환 의존이 있으면 SchemaValidationError를 던진다", () => {
    const artifacts = [makeArtifact("a", ["b"]), makeArtifact("b", ["a"])];
    expect(() => validateNoArtifactDependencyCycles(artifacts)).toThrowError(
      SchemaValidationError,
    );
  });

  it("세 노드 간 순환 의존이 있으면 SchemaValidationError를 던진다", () => {
    const artifacts = [
      makeArtifact("a", ["c"]),
      makeArtifact("b", ["a"]),
      makeArtifact("c", ["b"]),
    ];
    expect(() => validateNoArtifactDependencyCycles(artifacts)).toThrowError(
      SchemaValidationError,
    );
  });

  it("에러 메시지에 사이클 경로가 포함된다", () => {
    const artifacts = [makeArtifact("a", ["b"]), makeArtifact("b", ["a"])];
    expect(() => validateNoArtifactDependencyCycles(artifacts)).toThrowError(
      /→/,
    );
  });

  it("빈 배열이면 에러를 던지지 않는다", () => {
    expect(() => validateNoArtifactDependencyCycles([])).not.toThrow();
  });

  it("독립적인 여러 체인이 있어도 사이클이 없으면 통과한다", () => {
    const artifacts = [
      makeArtifact("a"),
      makeArtifact("b", ["a"]),
      makeArtifact("c"),
      makeArtifact("d", ["c"]),
    ];
    expect(() => validateNoArtifactDependencyCycles(artifacts)).not.toThrow();
  });
});
