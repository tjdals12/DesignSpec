import { describe, it, expect } from "vitest";
import { generateSkillContent } from "#core/skills/skill-generation.js";
import type { SkillTemplate } from "#core/skills/skill-templates.js";

function makeTemplate(overrides: Partial<SkillTemplate> = {}): SkillTemplate {
  return {
    name: "test-skill",
    description: "Test description",
    instructions: "Do something.",
    ...overrides,
  };
}

describe("generateSkillContent", () => {
  it("name, description, instructions가 출력에 포함된다", () => {
    const content = generateSkillContent(makeTemplate());
    expect(content).toContain("name: test-skill");
    expect(content).toContain("description: Test description");
    expect(content).toContain("Do something.");
  });

  it("license를 지정하지 않으면 기본값 MIT가 사용된다", () => {
    const content = generateSkillContent(makeTemplate());
    expect(content).toContain("license: MIT");
  });

  it("license를 지정하면 해당 값이 사용된다", () => {
    const content = generateSkillContent(makeTemplate({ license: "Apache-2.0" }));
    expect(content).toContain("license: Apache-2.0");
  });

  it("compatibility를 지정하지 않으면 기본값이 사용된다", () => {
    const content = generateSkillContent(makeTemplate());
    expect(content).toContain("compatibility: Requires design-spec CLI.");
  });

  it("compatibility를 지정하면 해당 값이 사용된다", () => {
    const content = generateSkillContent(
      makeTemplate({ compatibility: "Requires node 20+." }),
    );
    expect(content).toContain("compatibility: Requires node 20+.");
  });

  it("metadata.author를 지정하지 않으면 기본값 design-spec이 사용된다", () => {
    const content = generateSkillContent(makeTemplate());
    expect(content).toContain("author: design-spec");
  });

  it("metadata.author를 지정하면 해당 값이 사용된다", () => {
    const content = generateSkillContent(
      makeTemplate({ metadata: { author: "custom-author", version: "2.0" } }),
    );
    expect(content).toContain("author: custom-author");
  });

  it("metadata.version을 지정하지 않으면 기본값 1.0이 사용된다", () => {
    const content = generateSkillContent(makeTemplate());
    expect(content).toContain("version: 1.0");
  });

  it("metadata.version을 지정하면 해당 값이 사용된다", () => {
    const content = generateSkillContent(
      makeTemplate({ metadata: { author: "design-spec", version: "2.5" } }),
    );
    expect(content).toContain("version: 2.5");
  });

  it("YAML frontmatter 구분자(---)가 포함된다", () => {
    const content = generateSkillContent(makeTemplate());
    expect(content).toContain("---");
  });
});
