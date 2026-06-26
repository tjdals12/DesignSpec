import { describe, it, expect } from "vitest";
import { ApplyContext } from "#core/change/apply/context.js";
import type { SchemaYaml } from "#core/change/artifact/schema/schema.js";
import type { TaskSummary } from "#core/change/artifact/types.js";

const buildSchema = (apply: { requires: string[]; instruction: string }): SchemaYaml => ({
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
  apply,
  design: { requires: [], instruction: "Design." },
});

const buildTaskSummary = (total: number, completed: number): TaskSummary => ({
  progress: { total, completed },
  items: Array.from({ length: total }, (_, i) => ({
    text: `Task ${i + 1}`,
    completed: i < completed,
  })),
});

describe("ApplyContext", () => {
  describe("getName", () => {
    it("스키마 이름을 반환한다", () => {
      const context = new ApplyContext(
        buildSchema({ requires: ["proposal"], instruction: "Apply." }),
      );
      expect(context.getName()).toBe("default");
    });
  });

  describe("getRequires", () => {
    it("apply.requires의 사본을 반환한다", () => {
      const context = new ApplyContext(
        buildSchema({ requires: ["proposal", "tasks"], instruction: "Apply." }),
      );
      expect(context.getRequires()).toEqual(["proposal", "tasks"]);
    });

    it("반환된 배열을 수정해도 내부 상태에 영향이 없다", () => {
      const context = new ApplyContext(
        buildSchema({ requires: ["proposal"], instruction: "Apply." }),
      );
      const requires = context.getRequires();
      requires.push("mutated");
      expect(context.getRequires()).toEqual(["proposal"]);
    });
  });

  describe("resolve - ready 상태", () => {
    it("모든 의존 artifact가 완료되고 미완료 태스크가 있으면 ready를 반환한다", () => {
      const context = new ApplyContext(
        buildSchema({ requires: ["proposal", "tasks"], instruction: "Apply the change." }),
      );
      const result = context.resolve(new Set(["proposal", "tasks"]), buildTaskSummary(3, 1));
      expect(result.state).toBe("ready");
      expect(result.missingArtifacts).toEqual([]);
    });

    it("ready 상태에서는 schema의 instruction을 그대로 반환한다", () => {
      const context = new ApplyContext(
        buildSchema({
          requires: ["proposal"],
          instruction: "Apply by walking each task one at a time.",
        }),
      );
      const result = context.resolve(new Set(["proposal"]), buildTaskSummary(2, 0));
      expect(result.instruction).toBe("Apply by walking each task one at a time.");
    });
  });

  describe("resolve - blocked 상태 (missing artifacts)", () => {
    it("의존 artifact가 하나 누락되면 blocked를 반환한다", () => {
      const context = new ApplyContext(
        buildSchema({ requires: ["proposal", "tasks"], instruction: "Apply." }),
      );
      const result = context.resolve(new Set(["proposal"]), buildTaskSummary(3, 1));
      expect(result.state).toBe("blocked");
      expect(result.missingArtifacts).toEqual(["tasks"]);
    });

    it("누락된 artifact 이름을 instruction에 포함한다", () => {
      const context = new ApplyContext(
        buildSchema({ requires: ["proposal", "tasks"], instruction: "Apply." }),
      );
      const result = context.resolve(new Set(["proposal"]), buildTaskSummary(3, 1));
      expect(result.instruction).toContain("Missing artifacts: tasks");
      expect(result.instruction).toContain("desx-continue");
    });

    it("여러 의존 artifact가 누락되면 모두 콤마로 나열한다", () => {
      const context = new ApplyContext(
        buildSchema({
          requires: ["proposal", "design", "tasks"],
          instruction: "Apply.",
        }),
      );
      const result = context.resolve(new Set(["proposal"]), buildTaskSummary(3, 1));
      expect(result.missingArtifacts).toEqual(["design", "tasks"]);
      expect(result.instruction).toContain("Missing artifacts: design, tasks");
    });

    it("requires의 순서를 유지해서 누락 목록을 만든다", () => {
      const context = new ApplyContext(
        buildSchema({
          requires: ["tasks", "proposal", "design"],
          instruction: "Apply.",
        }),
      );
      const result = context.resolve(new Set(), buildTaskSummary(3, 1));
      expect(result.missingArtifacts).toEqual(["tasks", "proposal", "design"]);
    });
  });

  describe("resolve - blocked 상태 (empty tasks)", () => {
    it("artifact가 모두 완료지만 tasks.md가 비어 있으면 blocked를 반환한다", () => {
      const context = new ApplyContext(
        buildSchema({ requires: ["proposal", "tasks"], instruction: "Apply." }),
      );
      const result = context.resolve(new Set(["proposal", "tasks"]), buildTaskSummary(0, 0));
      expect(result.state).toBe("blocked");
      expect(result.missingArtifacts).toEqual([]);
    });

    it("빈 tasks 메시지를 instruction에 포함한다", () => {
      const context = new ApplyContext(
        buildSchema({ requires: ["proposal"], instruction: "Apply." }),
      );
      const result = context.resolve(new Set(["proposal"]), buildTaskSummary(0, 0));
      expect(result.instruction).toContain("tasks.md has no tasks");
      expect(result.instruction).toContain("desx-continue");
    });

    it("artifact 누락과 빈 tasks가 동시 발생 시 missing artifacts 메시지가 우선한다", () => {
      const context = new ApplyContext(
        buildSchema({ requires: ["proposal", "tasks"], instruction: "Apply." }),
      );
      const result = context.resolve(new Set(["proposal"]), buildTaskSummary(0, 0));
      expect(result.state).toBe("blocked");
      expect(result.missingArtifacts).toEqual(["tasks"]);
      expect(result.instruction).toContain("Missing artifacts: tasks");
      expect(result.instruction).not.toContain("tasks.md has no tasks");
    });
  });

  describe("resolve - all_done 상태", () => {
    it("모든 artifact 완료 + 모든 태스크 완료면 all_done을 반환한다", () => {
      const context = new ApplyContext(
        buildSchema({ requires: ["proposal", "tasks"], instruction: "Apply." }),
      );
      const result = context.resolve(new Set(["proposal", "tasks"]), buildTaskSummary(3, 3));
      expect(result.state).toBe("all_done");
      expect(result.missingArtifacts).toEqual([]);
    });

    it("all_done 상태에서는 아카이브 안내 메시지를 반환한다", () => {
      const context = new ApplyContext(
        buildSchema({
          requires: ["proposal"],
          instruction: "Custom apply instruction.",
        }),
      );
      const result = context.resolve(new Set(["proposal"]), buildTaskSummary(2, 2));
      expect(result.instruction).toBe(
        "All tasks are complete. This change is ready to be archived.",
      );
    });

    it("태스크가 단 하나이고 완료 상태면 all_done을 반환한다", () => {
      const context = new ApplyContext(
        buildSchema({ requires: ["proposal"], instruction: "Apply." }),
      );
      const result = context.resolve(new Set(["proposal"]), buildTaskSummary(1, 1));
      expect(result.state).toBe("all_done");
    });
  });
});
