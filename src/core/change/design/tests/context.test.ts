import { describe, it, expect } from "vitest";
import { DesignContext } from "#core/change/design/context.js";
import type { SchemaYaml } from "#core/change/artifact/schema/schema.js";

const buildSchema = (design: { requires: string[]; instruction: string }): SchemaYaml => ({
  name: "default",
  version: 1,
  artifacts: [
    {
      id: "proposal",
      generates: "proposal.md",
      template: "template content",
      instruction: "Create the proposal",
      requires: [],
    },
  ],
  apply: { requires: [], instruction: "Apply." },
  design,
});

describe("DesignContext", () => {
  describe("getName", () => {
    it("스키마 이름을 반환한다", () => {
      const context = new DesignContext(
        buildSchema({ requires: ["components"], instruction: "Design." }),
      );
      expect(context.getName()).toBe("default");
    });
  });

  describe("getRequires", () => {
    it("design.requires의 사본을 반환한다", () => {
      const context = new DesignContext(
        buildSchema({ requires: ["screens", "pages", "components"], instruction: "Design." }),
      );
      expect(context.getRequires()).toEqual(["screens", "pages", "components"]);
    });

    it("반환된 배열을 수정해도 내부 상태에 영향이 없다", () => {
      const context = new DesignContext(
        buildSchema({ requires: ["components"], instruction: "Design." }),
      );
      const requires = context.getRequires();
      requires.push("mutated");
      expect(context.getRequires()).toEqual(["components"]);
    });
  });

  describe("resolve", () => {
    it("모든 의존 artifact가 완료되면 missingArtifacts가 비어 있다", () => {
      const context = new DesignContext(
        buildSchema({ requires: ["screens", "pages", "components"], instruction: "Design." }),
      );
      const result = context.resolve(new Set(["screens", "pages", "components"]));
      expect(result.missingArtifacts).toEqual([]);
    });

    it("일부 의존 artifact가 누락되면 누락된 것만 반환한다", () => {
      const context = new DesignContext(
        buildSchema({ requires: ["screens", "pages", "components"], instruction: "Design." }),
      );
      const result = context.resolve(new Set(["screens"]));
      expect(result.missingArtifacts).toEqual(["pages", "components"]);
    });

    it("requires의 순서를 유지해서 누락 목록을 만든다", () => {
      const context = new DesignContext(
        buildSchema({ requires: ["components", "screens", "pages"], instruction: "Design." }),
      );
      const result = context.resolve(new Set());
      expect(result.missingArtifacts).toEqual(["components", "screens", "pages"]);
    });

    it("instruction은 schema의 design.instruction을 그대로 반환한다", () => {
      const context = new DesignContext(
        buildSchema({
          requires: ["components"],
          instruction: "Design components first, then compose pages.",
        }),
      );
      const result = context.resolve(new Set(["components"]));
      expect(result.instruction).toBe("Design components first, then compose pages.");
    });

    it("누락 여부와 무관하게 instruction은 동일하다", () => {
      const context = new DesignContext(
        buildSchema({ requires: ["components"], instruction: "Static design instruction." }),
      );
      const blocked = context.resolve(new Set());
      const ready = context.resolve(new Set(["components"]));
      expect(blocked.instruction).toBe("Static design instruction.");
      expect(ready.instruction).toBe(blocked.instruction);
    });
  });
});
