import { describe, it, expect } from "vitest";

import { formatCleanupSummary } from "../format.js";

describe("formatCleanupSummary", () => {
  it("제거된 항목을 나열한다", () => {
    const summary = formatCleanupSummary({
      removed: [".claude/skills/designspec-new-change", ".codex/prompts/desx-new.md"],
      errors: [],
    });

    expect(summary).toContain(".claude/skills/designspec-new-change");
    expect(summary).toContain(".codex/prompts/desx-new.md");
  });

  it("에러를 함께 표시한다", () => {
    const summary = formatCleanupSummary({
      removed: [],
      errors: [{ path: ".codex/prompts/desx-new.md", message: "EACCES" }],
    });

    expect(summary).toContain(".codex/prompts/desx-new.md");
    expect(summary).toContain("EACCES");
  });

  it("아무것도 없으면 빈 문자열을 반환한다", () => {
    expect(formatCleanupSummary({ removed: [], errors: [] })).toBe("");
  });
});
