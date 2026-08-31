import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import os from "node:os";
import fs from "node:fs/promises";
import path from "node:path";
import { InitCommand } from "#core/commands/init.js";

vi.mock("ora", () => {
  const spinner = {
    start: () => spinner,
    stop: vi.fn(),
    succeed: vi.fn(),
    fail: vi.fn(),
    stopAndPersist: vi.fn(),
  };
  return { default: () => spinner };
});

let tmpDir: string;

beforeEach(async () => {
  tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "designspec-"));
  vi.spyOn(console, "log").mockImplementation(() => {});
});

afterEach(async () => {
  vi.restoreAllMocks();
  await fs.rm(tmpDir, { recursive: true, force: true });
});

async function pathExists(target: string): Promise<boolean> {
  try {
    await fs.stat(target);
    return true;
  } catch {
    return false;
  }
}

describe("InitCommand — 디렉토리 구조", () => {
  it("design-spec/ 디렉토리가 생성된다", async () => {
    await new InitCommand({ tools: "none" }).execute(tmpDir);
    expect(await pathExists(path.join(tmpDir, "design-spec"))).toBe(true);
  });

  it("design-spec/changes/ 디렉토리가 생성된다", async () => {
    await new InitCommand({ tools: "none" }).execute(tmpDir);
    expect(await pathExists(path.join(tmpDir, "design-spec", "changes"))).toBe(true);
  });

  it("design-spec/changes/archive/ 디렉토리가 생성된다", async () => {
    await new InitCommand({ tools: "none" }).execute(tmpDir);
    expect(await pathExists(path.join(tmpDir, "design-spec", "changes", "archive"))).toBe(true);
  });

  it("design-spec/specs/ 디렉토리가 생성된다", async () => {
    await new InitCommand({ tools: "none" }).execute(tmpDir);
    expect(await pathExists(path.join(tmpDir, "design-spec", "specs"))).toBe(true);
  });
});

describe("InitCommand — 스킬 파일 생성", () => {
  it("--tools=claude 지정 시 SKILL.md가 생성된다", async () => {
    await new InitCommand({ tools: "claude" }).execute(tmpDir);
    expect(await pathExists(path.join(tmpDir, ".claude", "skills", "desx-new", "SKILL.md"))).toBe(
      true,
    );
  });

  it("--tools=codex 지정 시 .agents/skills에 SKILL.md가 생성된다", async () => {
    await new InitCommand({ tools: "codex" }).execute(tmpDir);
    expect(await pathExists(path.join(tmpDir, ".agents", "skills", "desx-new", "SKILL.md"))).toBe(
      true,
    );
  });

  it("--tools=antigravity 지정 시 .agents/skills에 SKILL.md가 생성된다", async () => {
    await new InitCommand({ tools: "antigravity" }).execute(tmpDir);
    expect(await pathExists(path.join(tmpDir, ".agents", "skills", "desx-new", "SKILL.md"))).toBe(
      true,
    );
  });

  it("--tools=cursor 지정 시 .agents/skills에 SKILL.md가 생성된다", async () => {
    await new InitCommand({ tools: "cursor" }).execute(tmpDir);
    expect(await pathExists(path.join(tmpDir, ".agents", "skills", "desx-new", "SKILL.md"))).toBe(
      true,
    );
  });

  it("--tools=copilot 지정 시 .agents/skills에 SKILL.md가 생성된다", async () => {
    await new InitCommand({ tools: "copilot" }).execute(tmpDir);
    expect(await pathExists(path.join(tmpDir, ".agents", "skills", "desx-new", "SKILL.md"))).toBe(
      true,
    );
  });

  it("--tools=opencode 지정 시 .agents/skills에 SKILL.md가 생성된다", async () => {
    await new InitCommand({ tools: "opencode" }).execute(tmpDir);
    expect(await pathExists(path.join(tmpDir, ".agents", "skills", "desx-new", "SKILL.md"))).toBe(
      true,
    );
  });

  it("--tools=grok 지정 시 .grok/skills에 SKILL.md가 생성된다", async () => {
    await new InitCommand({ tools: "grok" }).execute(tmpDir);
    expect(await pathExists(path.join(tmpDir, ".grok", "skills", "desx-new", "SKILL.md"))).toBe(
      true,
    );
  });

  it("--tools=none 지정 시 스킬 파일이 생성되지 않는다", async () => {
    await new InitCommand({ tools: "none" }).execute(tmpDir);
    expect(await pathExists(path.join(tmpDir, ".claude"))).toBe(false);
    expect(await pathExists(path.join(tmpDir, ".agents"))).toBe(false);
    expect(await pathExists(path.join(tmpDir, ".grok"))).toBe(false);
  });

  it("이미 초기화된 디렉토리에서 재실행하면 스킬 파일을 덮어쓴다", async () => {
    await new InitCommand({ tools: "claude" }).execute(tmpDir);
    const skillPath = path.join(tmpDir, ".claude", "skills", "desx-new", "SKILL.md");
    await fs.writeFile(skillPath, "custom content");
    await new InitCommand({ tools: "claude" }).execute(tmpDir);
    const content = await fs.readFile(skillPath, "utf-8");
    expect(content).not.toBe("custom content");
  });
});

describe("InitCommand — 레거시 정리", () => {
  it("2.0.0 이전 고아 아티팩트를 제거하고 현행 스킬을 생성한다", async () => {
    await fs.mkdir(path.join(tmpDir, ".claude", "skills", "designspec-new-change"), {
      recursive: true,
    });
    await fs.writeFile(
      path.join(tmpDir, ".claude", "skills", "designspec-new-change", "SKILL.md"),
      "old",
    );
    await fs.mkdir(path.join(tmpDir, ".claude", "commands", "desx"), { recursive: true });
    await fs.writeFile(path.join(tmpDir, ".claude", "commands", "desx", "new.md"), "old");
    await fs.mkdir(path.join(tmpDir, ".codex", "prompts"), { recursive: true });
    await fs.writeFile(path.join(tmpDir, ".codex", "prompts", "desx-new.md"), "old");

    await new InitCommand({ tools: "claude" }).execute(tmpDir);

    expect(await pathExists(path.join(tmpDir, ".claude", "skills", "designspec-new-change"))).toBe(
      false,
    );
    expect(await pathExists(path.join(tmpDir, ".claude", "commands", "desx"))).toBe(false);
    expect(await pathExists(path.join(tmpDir, ".codex", "prompts", "desx-new.md"))).toBe(false);
    expect(await pathExists(path.join(tmpDir, ".claude", "skills", "desx-new", "SKILL.md"))).toBe(
      true,
    );
  });

  it("레거시가 없으면 현행 스킬만 생성한다", async () => {
    await new InitCommand({ tools: "claude" }).execute(tmpDir);
    expect(await pathExists(path.join(tmpDir, ".claude", "skills", "desx-new", "SKILL.md"))).toBe(
      true,
    );
  });
});

describe("InitCommand — 실패", () => {
  it("--tools 없이 실행하면 에러를 던진다", async () => {
    await expect(new InitCommand({}).execute(tmpDir)).rejects.toThrow();
  });

  it("지원하지 않는 tool ID를 지정하면 에러를 던진다", async () => {
    await expect(new InitCommand({ tools: "unknown-tool" }).execute(tmpDir)).rejects.toThrow();
  });
});

describe("InitCommand — 비대화형 폴백", () => {
  it("비대화형 환경에서 감지된 tool 디렉토리를 폴백으로 사용한다", async () => {
    // .claude 디렉토리가 이미 있으면 감지되어 별도 지정 없이 설정된다.
    await fs.mkdir(path.join(tmpDir, ".claude"), { recursive: true });

    await new InitCommand({}).execute(tmpDir);

    expect(await pathExists(path.join(tmpDir, ".claude", "skills", "desx-new", "SKILL.md"))).toBe(
      true,
    );
  });

  it("비대화형 환경에서 .cursor 디렉토리를 감지해 .agents/skills에 스킬을 생성한다", async () => {
    await fs.mkdir(path.join(tmpDir, ".cursor"), { recursive: true });

    await new InitCommand({}).execute(tmpDir);

    expect(await pathExists(path.join(tmpDir, ".agents", "skills", "desx-new", "SKILL.md"))).toBe(
      true,
    );
  });

  it("비대화형 환경에서 .opencode 디렉토리를 감지해 .agents/skills에 스킬을 생성한다", async () => {
    await fs.mkdir(path.join(tmpDir, ".opencode"), { recursive: true });

    await new InitCommand({}).execute(tmpDir);

    expect(await pathExists(path.join(tmpDir, ".agents", "skills", "desx-new", "SKILL.md"))).toBe(
      true,
    );
  });

  it("비대화형 환경에서 .grok 디렉토리를 감지해 .grok/skills에 스킬을 생성한다", async () => {
    await fs.mkdir(path.join(tmpDir, ".grok"), { recursive: true });

    await new InitCommand({}).execute(tmpDir);

    expect(await pathExists(path.join(tmpDir, ".grok", "skills", "desx-new", "SKILL.md"))).toBe(
      true,
    );
  });
});
