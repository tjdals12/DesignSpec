import { describe, it, expect } from "vitest";
import { parseSchema } from "#core/change/artifact/schema/resolver.js";
import { SchemaParseError, SchemaValidationError } from "#core/change/artifact/schema/error.js";

const VALID_SCHEMA_YAML = `
name: default
version: 1
description: Test schema
artifacts:
  - id: proposal
    generates: proposal.md
    template: proposal.template.md
    instruction: Write the proposal.
    requires: []
  - id: tasks
    generates: tasks.md
    template: tasks.template.md
    instruction: Write the tasks.
    requires:
      - proposal
apply:
  requires:
    - tasks
  instruction: Apply the change.
`;

describe("parseSchema", () => {
  describe("정상 경로", () => {
    it("유효한 YAML과 스키마면 SchemaYaml 객체를 반환한다", () => {
      const schema = parseSchema(VALID_SCHEMA_YAML);
      expect(schema.name).toBe("default");
      expect(schema.version).toBe(1);
      expect(schema.artifacts).toHaveLength(2);
      expect(schema.apply.requires).toEqual(["tasks"]);
    });

    it("선택 필드 description이 있으면 보존한다", () => {
      const schema = parseSchema(VALID_SCHEMA_YAML);
      expect(schema.description).toBe("Test schema");
    });

    it("artifact의 requires가 비어 있으면 빈 배열로 정규화한다", () => {
      const yaml = `
name: default
version: 1
artifacts:
  - id: proposal
    generates: proposal.md
    template: t.md
    instruction: x
apply:
  requires:
    - proposal
  instruction: Apply.
`;
      const schema = parseSchema(yaml);
      expect(schema.artifacts[0]?.requires).toEqual([]);
    });
  });

  describe("YAML 파싱 실패", () => {
    it("문법이 깨진 YAML이면 SchemaParseError를 던진다", () => {
      const broken = "name: [unclosed\nversion: 1";
      expect(() => parseSchema(broken)).toThrowError(SchemaParseError);
    });

    it("에러 메시지가 'Failed to parse YAML'로 시작한다", () => {
      const broken = "name: [unclosed";
      expect(() => parseSchema(broken)).toThrowError(/Failed to parse YAML/);
    });
  });

  describe("Zod 스키마 검증 실패", () => {
    it("빈 문자열은 SchemaParseError를 던진다", () => {
      expect(() => parseSchema("")).toThrowError(SchemaParseError);
    });

    it("name 필드가 누락되면 SchemaParseError를 던진다", () => {
      const yaml = `
version: 1
artifacts:
  - id: a
    generates: a.md
    template: t.md
    instruction: x
apply:
  requires: [a]
  instruction: Apply.
`;
      expect(() => parseSchema(yaml)).toThrowError(/Invalid schema/);
    });

    it("artifacts 배열이 비어 있으면 SchemaParseError를 던진다", () => {
      const yaml = `
name: default
version: 1
artifacts: []
apply:
  requires: [a]
  instruction: Apply.
`;
      expect(() => parseSchema(yaml)).toThrowError(/At least one artifact required/);
    });

    it("version이 음수면 SchemaParseError를 던진다", () => {
      const yaml = `
name: default
version: -1
artifacts:
  - id: a
    generates: a.md
    template: t.md
    instruction: x
apply:
  requires: [a]
  instruction: Apply.
`;
      expect(() => parseSchema(yaml)).toThrowError(SchemaParseError);
    });

    it("apply.requires가 비어 있으면 SchemaParseError를 던진다", () => {
      const yaml = `
name: default
version: 1
artifacts:
  - id: a
    generates: a.md
    template: t.md
    instruction: x
apply:
  requires: []
  instruction: Apply.
`;
      expect(() => parseSchema(yaml)).toThrowError(
        /apply\.requires must list at least one artifact/,
      );
    });

    it("artifact의 generates가 누락되면 SchemaParseError를 던진다", () => {
      const yaml = `
name: default
version: 1
artifacts:
  - id: a
    template: t.md
    instruction: x
apply:
  requires: [a]
  instruction: Apply.
`;
      expect(() => parseSchema(yaml)).toThrowError(SchemaParseError);
    });
  });

  describe("downstream validator 호출", () => {
    it("중복 artifact ID는 SchemaValidationError로 bubble up한다", () => {
      const yaml = `
name: default
version: 1
artifacts:
  - id: a
    generates: a.md
    template: t.md
    instruction: x
  - id: a
    generates: b.md
    template: t.md
    instruction: y
apply:
  requires: [a]
  instruction: Apply.
`;
      expect(() => parseSchema(yaml)).toThrowError(SchemaValidationError);
    });

    it("존재하지 않는 artifact id를 requires하면 SchemaValidationError로 bubble up한다", () => {
      const yaml = `
name: default
version: 1
artifacts:
  - id: a
    generates: a.md
    template: t.md
    instruction: x
    requires:
      - nonexistent
apply:
  requires: [a]
  instruction: Apply.
`;
      expect(() => parseSchema(yaml)).toThrowError(SchemaValidationError);
    });
  });
});
