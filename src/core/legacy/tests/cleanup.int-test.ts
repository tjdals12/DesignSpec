import { describe, it, expect, beforeEach, afterEach } from "vitest";
import os from "node:os";
import fs from "node:fs/promises";
import path from "node:path";

import { detectLegacyArtifacts } from "../detection.js";
import { cleanupLegacyArtifacts } from "../cleanup.js";

let tmpDir: string;

beforeEach(async () => {
  tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "designspec-legacy-"));
});

afterEach(async () => {
  await fs.rm(tmpDir, { recursive: true, force: true });
});

async function writeFile(relativePath: string, content = ""): Promise<void> {
  const full = path.join(tmpDir, relativePath);
  await fs.mkdir(path.dirname(full), { recursive: true });
  await fs.writeFile(full, content);
}

async function pathExists(relativePath: string): Promise<boolean> {
  try {
    await fs.stat(path.join(tmpDir, relativePath));
    return true;
  } catch {
    return false;
  }
}

describe("cleanupLegacyArtifacts", () => {
  it("탐지된 레거시 스킬·슬래시 커맨드를 모두 삭제한다", async () => {
    await writeFile(".claude/skills/designspec-new-change/SKILL.md");
    await writeFile(".codex/skills/designspec-apply-change/SKILL.md");
    await writeFile(".claude/commands/desx/new.md");
    await writeFile(".codex/prompts/desx-new.md");

    const detection = await detectLegacyArtifacts(tmpDir);
    const result = await cleanupLegacyArtifacts(tmpDir, detection);

    expect(await pathExists(".claude/skills/designspec-new-change")).toBe(false);
    expect(await pathExists(".codex/skills/designspec-apply-change")).toBe(false);
    expect(await pathExists(".claude/commands/desx")).toBe(false);
    expect(await pathExists(".codex/prompts/desx-new.md")).toBe(false);
    expect(result.removed.length).toBe(4);
    expect(result.errors).toEqual([]);
  });

  it("현행 스킬과 무관한 사용자 파일은 보존한다", async () => {
    await writeFile(".claude/skills/designspec-new-change/SKILL.md");
    await writeFile(".claude/skills/desx-new/SKILL.md");
    await writeFile(".codex/prompts/desx-new.md");
    await writeFile(".codex/prompts/my-prompt.md");

    const detection = await detectLegacyArtifacts(tmpDir);
    await cleanupLegacyArtifacts(tmpDir, detection);

    expect(await pathExists(".claude/skills/desx-new/SKILL.md")).toBe(true);
    expect(await pathExists(".codex/prompts/my-prompt.md")).toBe(true);
    expect(await pathExists(".claude/skills/designspec-new-change")).toBe(false);
    expect(await pathExists(".codex/prompts/desx-new.md")).toBe(false);
  });

  it("레거시가 없으면 아무것도 삭제하지 않는다", async () => {
    const detection = await detectLegacyArtifacts(tmpDir);
    const result = await cleanupLegacyArtifacts(tmpDir, detection);

    expect(result.removed).toEqual([]);
    expect(result.errors).toEqual([]);
  });

  it("프로젝트 밖으로 벗어나는 경로는 거부하고 삭제하지 않는다", async () => {
    await writeFile(".claude/skills/designspec-x/SKILL.md");

    const result = await cleanupLegacyArtifacts(tmpDir, {
      skillDirs: ["../escape", ".claude/skills/designspec-x"],
      commandDirs: [],
      commandFiles: [],
      hasLegacyArtifacts: true,
    });

    expect(result.errors.map((error) => error.path)).toContain("../escape");
    expect(result.removed).not.toContain("../escape");
    expect(result.removed).toContain(".claude/skills/designspec-x");
    expect(await pathExists(".claude/skills/designspec-x")).toBe(false);
  });
});
