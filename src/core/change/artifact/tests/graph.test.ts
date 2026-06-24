import { describe, it, expect } from "vitest";
import { ArtifactGraph } from "#core/change/artifact/graph.js";
import type { SchemaYaml } from "#core/change/artifact/schema/schema.js";

function makeSchema(artifacts: SchemaYaml["artifacts"]): SchemaYaml {
  return {
    name: "test-schema",
    version: 1,
    artifacts,
    apply: { requires: [], instruction: "Apply." },
    design: { requires: [], instruction: "Design." },
  };
}

function makeArtifact(id: string, requires: string[] = []): SchemaYaml["artifacts"][number] {
  return {
    id,
    generates: `${id}.md`,
    template: "template",
    instruction: "instruction",
    requires,
  };
}

describe("ArtifactGraph", () => {
  describe("getNextArtifacts", () => {
    it("requires가 없는 artifact는 즉시 ready 상태다", () => {
      const graph = new ArtifactGraph(makeSchema([makeArtifact("a"), makeArtifact("b")]));
      const next = graph.getNextArtifacts(new Set());
      expect(next).toContain("a");
      expect(next).toContain("b");
    });

    it("완료된 artifact는 ready 목록에 포함되지 않는다", () => {
      const graph = new ArtifactGraph(makeSchema([makeArtifact("a")]));
      const next = graph.getNextArtifacts(new Set(["a"]));
      expect(next).not.toContain("a");
    });

    it("requires가 완료되지 않으면 ready 상태가 아니다", () => {
      const graph = new ArtifactGraph(makeSchema([makeArtifact("a"), makeArtifact("b", ["a"])]));
      const next = graph.getNextArtifacts(new Set());
      expect(next).toContain("a");
      expect(next).not.toContain("b");
    });

    it("requires가 모두 완료되면 ready 상태가 된다", () => {
      const graph = new ArtifactGraph(makeSchema([makeArtifact("a"), makeArtifact("b", ["a"])]));
      const next = graph.getNextArtifacts(new Set(["a"]));
      expect(next).toContain("b");
    });
  });

  describe("getMissingDependencies", () => {
    it("모든 requires가 완료되면 blocked artifact가 없다", () => {
      const graph = new ArtifactGraph(makeSchema([makeArtifact("a"), makeArtifact("b", ["a"])]));
      const blocked = graph.getMissingDependencies(new Set(["a"]));
      expect(blocked.size).toBe(0);
    });

    it("미완료 requires가 있으면 해당 artifact가 blocked된다", () => {
      const graph = new ArtifactGraph(makeSchema([makeArtifact("a"), makeArtifact("b", ["a"])]));
      const blocked = graph.getMissingDependencies(new Set());
      expect(blocked.get("b")).toContain("a");
    });

    it("완료된 artifact는 blocked 목록에 포함되지 않는다", () => {
      const graph = new ArtifactGraph(makeSchema([makeArtifact("a"), makeArtifact("b", ["a"])]));
      const blocked = graph.getMissingDependencies(new Set(["a", "b"]));
      expect(blocked.has("a")).toBe(false);
      expect(blocked.has("b")).toBe(false);
    });
  });

  describe("getBuildOrder", () => {
    it("의존성이 없으면 알파벳 순으로 반환한다", () => {
      const graph = new ArtifactGraph(
        makeSchema([makeArtifact("c"), makeArtifact("a"), makeArtifact("b")]),
      );
      expect(graph.getBuildOrder()).toEqual(["a", "b", "c"]);
    });

    it("requires가 있는 artifact는 requires 이후에 위치한다", () => {
      const graph = new ArtifactGraph(makeSchema([makeArtifact("b", ["a"]), makeArtifact("a")]));
      const order = graph.getBuildOrder();
      expect(order.indexOf("a")).toBeLessThan(order.indexOf("b"));
    });

    it("체인 의존성에서 순서가 올바르다", () => {
      const graph = new ArtifactGraph(
        makeSchema([makeArtifact("c", ["b"]), makeArtifact("b", ["a"]), makeArtifact("a")]),
      );
      const order = graph.getBuildOrder();
      expect(order.indexOf("a")).toBeLessThan(order.indexOf("b"));
      expect(order.indexOf("b")).toBeLessThan(order.indexOf("c"));
    });
  });

  describe("isAllCompleted", () => {
    it("모든 artifact가 완료되면 true를 반환한다", () => {
      const graph = new ArtifactGraph(makeSchema([makeArtifact("a"), makeArtifact("b")]));
      expect(graph.isAllCompleted(new Set(["a", "b"]))).toBe(true);
    });

    it("하나라도 미완료면 false를 반환한다", () => {
      const graph = new ArtifactGraph(makeSchema([makeArtifact("a"), makeArtifact("b")]));
      expect(graph.isAllCompleted(new Set(["a"]))).toBe(false);
    });

    it("빈 completedArtifacts면 false를 반환한다", () => {
      const graph = new ArtifactGraph(makeSchema([makeArtifact("a")]));
      expect(graph.isAllCompleted(new Set())).toBe(false);
    });
  });

  describe("getArtifactDependencies", () => {
    it("완료된 dependency는 done: true를 반환한다", () => {
      const graph = new ArtifactGraph(makeSchema([makeArtifact("a"), makeArtifact("b", ["a"])]));
      const deps = graph.getArtifactDependencies("b", new Set(["a"]));
      expect(deps[0]?.done).toBe(true);
    });

    it("미완료 dependency는 done: false를 반환한다", () => {
      const graph = new ArtifactGraph(makeSchema([makeArtifact("a"), makeArtifact("b", ["a"])]));
      const deps = graph.getArtifactDependencies("b", new Set());
      expect(deps[0]?.done).toBe(false);
    });

    it("존재하지 않는 artifact ID를 조회하면 에러를 던진다", () => {
      const graph = new ArtifactGraph(makeSchema([makeArtifact("a")]));
      expect(() => graph.getArtifactDependencies("nonexistent", new Set())).toThrow();
    });
  });

  describe("getArtifactDependents", () => {
    it("해당 artifact를 requires하는 artifact ID 목록을 반환한다", () => {
      const graph = new ArtifactGraph(
        makeSchema([makeArtifact("a"), makeArtifact("b", ["a"]), makeArtifact("c", ["a"])]),
      );
      const dependents = graph.getArtifactDependents("a");
      expect(dependents).toContain("b");
      expect(dependents).toContain("c");
    });

    it("dependents가 없으면 빈 배열을 반환한다", () => {
      const graph = new ArtifactGraph(makeSchema([makeArtifact("a"), makeArtifact("b", ["a"])]));
      expect(graph.getArtifactDependents("b")).toEqual([]);
    });
  });
});
