import { describe, it, expect, beforeEach, afterEach } from "vitest";
import os from "node:os";
import fs from "node:fs/promises";
import path from "node:path";

import { detectLegacyArtifacts } from "../detection.js";

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

describe("detectLegacyArtifacts", () => {
  it("레거시 아티팩트가 없으면 빈 결과를 반환한다", async () => {
    const result = await detectLegacyArtifacts(tmpDir);

    expect(result.hasLegacyArtifacts).toBe(false);
    expect(result.skillDirs).toEqual([]);
    expect(result.commandDirs).toEqual([]);
    expect(result.commandFiles).toEqual([]);
  });

  it(".claude/skills와 .codex/skills의 designspec-* 스킬을 탐지한다", async () => {
    await writeFile(".claude/skills/designspec-new-change/SKILL.md");
    await writeFile(".codex/skills/designspec-apply-change/SKILL.md");

    const result = await detectLegacyArtifacts(tmpDir);

    expect(result.skillDirs).toEqual(
      expect.arrayContaining([
        ".claude/skills/designspec-new-change",
        ".codex/skills/designspec-apply-change",
      ]),
    );
    expect(result.hasLegacyArtifacts).toBe(true);
  });

  it(".claude/commands/desx 슬래시 커맨드 디렉터리를 탐지한다", async () => {
    await writeFile(".claude/commands/desx/new.md");

    const result = await detectLegacyArtifacts(tmpDir);

    expect(result.commandDirs).toEqual([".claude/commands/desx"]);
    expect(result.hasLegacyArtifacts).toBe(true);
  });

  it(".codex/prompts의 desx-*.md 슬래시 커맨드 파일을 탐지한다", async () => {
    await writeFile(".codex/prompts/desx-new.md");
    await writeFile(".codex/prompts/desx-apply.md");

    const result = await detectLegacyArtifacts(tmpDir);

    expect(result.commandFiles).toEqual(
      expect.arrayContaining([".codex/prompts/desx-new.md", ".codex/prompts/desx-apply.md"]),
    );
    expect(result.hasLegacyArtifacts).toBe(true);
  });

  it("현행 desx-* 스킬은 레거시로 오탐하지 않는다", async () => {
    await writeFile(".claude/skills/desx-new/SKILL.md");
    await writeFile(".agents/skills/desx-new/SKILL.md");

    const result = await detectLegacyArtifacts(tmpDir);

    expect(result.hasLegacyArtifacts).toBe(false);
    expect(result.skillDirs).toEqual([]);
  });

  it("무관한 사용자 스킬/프롬프트는 탐지하지 않는다", async () => {
    await writeFile(".claude/skills/my-custom-skill/SKILL.md");
    await writeFile(".codex/prompts/my-prompt.md");

    const result = await detectLegacyArtifacts(tmpDir);

    expect(result.hasLegacyArtifacts).toBe(false);
    expect(result.commandFiles).toEqual([]);
  });
});
