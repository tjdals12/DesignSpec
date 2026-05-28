import { describe, it, expect } from "vitest";
import path from "node:path";
import yaml from "yaml";
import { ClaudeAdapter } from "#core/slash-commands/adapters/claude.adapter.js";
import { CodexAdapter } from "#core/slash-commands/adapters/codex.adapter.js";
import type { SlashCommandTemplate } from "#core/slash-commands/slash-command-template.js";

function parseFrontmatter(content: string): Record<string, unknown> {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) throw new Error("No frontmatter found in content");
  return yaml.parse(match[1]!) as Record<string, unknown>;
}

function extractBody(content: string): string {
  const match = content.match(/^---\n[\s\S]*?\n---\n\n([\s\S]*)$/);
  if (!match) throw new Error("No body found in content");
  return match[1]!;
}

describe("ClaudeAdapter", () => {
  const adapter = new ClaudeAdapter();

  describe("toolId", () => {
    it("'claude'를 반환한다", () => {
      expect(adapter.toolId).toBe("claude");
    });
  });

  describe("getFilePath", () => {
    it(".claude/commands/desx/<commandId>.md 경로를 반환한다", () => {
      expect(adapter.getFilePath("new-change")).toBe(
        path.join(".claude", "commands", "desx", "new-change.md"),
      );
    });

    it("commandId가 달라도 동일한 패턴을 따른다", () => {
      expect(adapter.getFilePath("apply-change")).toBe(
        path.join(".claude", "commands", "desx", "apply-change.md"),
      );
    });
  });

  describe("formatFile", () => {
    const baseTemplate: SlashCommandTemplate = {
      name: "Start new change",
      description: "Begin a new DesignSpec change workflow",
      instructions: "# Body content\n\nDo things.",
    };

    it("frontmatter는 --- 구분자로 시작하고 끝난다", () => {
      const output = adapter.formatFile(baseTemplate);
      expect(output.startsWith("---\n")).toBe(true);
      expect(output).toContain("\n---\n");
    });

    it("name과 description을 frontmatter에 포함한다", () => {
      const output = adapter.formatFile(baseTemplate);
      const parsed = parseFrontmatter(output);
      expect(parsed.name).toBe("Start new change");
      expect(parsed.description).toBe("Begin a new DesignSpec change workflow");
    });

    it("instructions를 frontmatter 뒤 본문으로 둔다", () => {
      const output = adapter.formatFile(baseTemplate);
      const body = extractBody(output);
      expect(body).toBe("# Body content\n\nDo things.\n");
    });

    it("category가 있으면 frontmatter에 포함한다", () => {
      const output = adapter.formatFile({ ...baseTemplate, category: "workflow" });
      const parsed = parseFrontmatter(output);
      expect(parsed.category).toBe("workflow");
    });

    it("category가 없으면 frontmatter에서 생략한다", () => {
      const output = adapter.formatFile(baseTemplate);
      const parsed = parseFrontmatter(output);
      expect(parsed.category).toBeUndefined();
    });

    it("tags가 있으면 배열로 포함한다", () => {
      const output = adapter.formatFile({
        ...baseTemplate,
        tags: ["change", "init"],
      });
      const parsed = parseFrontmatter(output);
      expect(parsed.tags).toEqual(["change", "init"]);
    });

    it("tags가 없으면 frontmatter에서 생략한다", () => {
      const output = adapter.formatFile(baseTemplate);
      const parsed = parseFrontmatter(output);
      expect(parsed.tags).toBeUndefined();
    });

    it("category와 tags를 함께 가질 수 있다", () => {
      const output = adapter.formatFile({
        ...baseTemplate,
        category: "workflow",
        tags: ["change"],
      });
      const parsed = parseFrontmatter(output);
      expect(parsed.category).toBe("workflow");
      expect(parsed.tags).toEqual(["change"]);
    });

    describe("YAML 안전성 (특수문자 round-trip)", () => {
      it("description에 콜론이 있어도 유효한 YAML로 직렬화된다", () => {
        const output = adapter.formatFile({
          ...baseTemplate,
          description: "Run X: do the thing",
        });
        const parsed = parseFrontmatter(output);
        expect(parsed.description).toBe("Run X: do the thing");
      });

      it("description에 해시(#)가 있어도 주석으로 잘리지 않는다", () => {
        const output = adapter.formatFile({
          ...baseTemplate,
          description: "Includes # hash sign",
        });
        const parsed = parseFrontmatter(output);
        expect(parsed.description).toBe("Includes # hash sign");
      });

      it("description에 큰따옴표가 있어도 escape된다", () => {
        const output = adapter.formatFile({
          ...baseTemplate,
          description: 'A "quoted" word',
        });
        const parsed = parseFrontmatter(output);
        expect(parsed.description).toBe('A "quoted" word');
      });

      it("description에 줄바꿈이 있어도 단일 라인으로 escape된다", () => {
        const output = adapter.formatFile({
          ...baseTemplate,
          description: "Line one\nLine two",
        });
        const parsed = parseFrontmatter(output);
        expect(parsed.description).toBe("Line one\nLine two");
      });

      it("name에 콜론이 있어도 유효한 YAML로 직렬화된다", () => {
        const output = adapter.formatFile({
          ...baseTemplate,
          name: "Step 1: start",
        });
        const parsed = parseFrontmatter(output);
        expect(parsed.name).toBe("Step 1: start");
      });

      it("tags 안에 콜론이 있어도 각각 escape된다", () => {
        const output = adapter.formatFile({
          ...baseTemplate,
          tags: ["a:b", "normal"],
        });
        const parsed = parseFrontmatter(output);
        expect(parsed.tags).toEqual(["a:b", "normal"]);
      });
    });
  });
});

describe("CodexAdapter", () => {
  const adapter = new CodexAdapter();

  describe("toolId", () => {
    it("'codex'를 반환한다", () => {
      expect(adapter.toolId).toBe("codex");
    });
  });

  describe("getFilePath", () => {
    it(".codex/prompts/desx-<commandId>.md 경로를 반환한다", () => {
      expect(adapter.getFilePath("new-change")).toBe(
        path.join(".codex", "prompts", "desx-new-change.md"),
      );
    });
  });

  describe("formatFile", () => {
    const baseTemplate: SlashCommandTemplate = {
      name: "ignored field",
      description: "Begin a new DesignSpec change workflow",
      instructions: "# Body\n\nContent.",
    };

    it("description만 frontmatter에 포함한다 (name/category/tags 무시)", () => {
      const output = adapter.formatFile({
        ...baseTemplate,
        category: "workflow",
        tags: ["a", "b"],
      });
      const parsed = parseFrontmatter(output);
      expect(parsed.description).toBe("Begin a new DesignSpec change workflow");
      expect(parsed.name).toBeUndefined();
      expect(parsed.category).toBeUndefined();
      expect(parsed.tags).toBeUndefined();
    });

    it("instructions를 frontmatter 뒤 본문으로 둔다", () => {
      const output = adapter.formatFile(baseTemplate);
      const body = extractBody(output);
      expect(body).toBe("# Body\n\nContent.\n");
    });

    it("description에 콜론이 있어도 유효한 YAML로 직렬화된다", () => {
      const output = adapter.formatFile({
        ...baseTemplate,
        description: "Run X: do the thing",
      });
      const parsed = parseFrontmatter(output);
      expect(parsed.description).toBe("Run X: do the thing");
    });

    it("description에 큰따옴표가 있어도 escape된다", () => {
      const output = adapter.formatFile({
        ...baseTemplate,
        description: 'A "quoted" word',
      });
      const parsed = parseFrontmatter(output);
      expect(parsed.description).toBe('A "quoted" word');
    });
  });
});
