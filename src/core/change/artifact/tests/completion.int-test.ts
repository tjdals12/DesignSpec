import { describe, it, expect, beforeEach, afterEach } from "vitest";
import os from "node:os";
import fs from "node:fs/promises";
import path from "node:path";
import { hasArtifactOutput, getCompletedArtifacts } from "#core/change/artifact/completion.js";
import { resolveArtifactOutput, resolveArtifactOutputs } from "#core/change/artifact/outputs.js";
import { DESIGN_SPEC_DIR_NAME } from "#core/config.js";
import type { Artifact } from "#core/change/artifact/schema/schema.js";

let tmpDir: string;
const CHANGE_NAME = "test-change";

beforeEach(async () => {
  tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "designspec-artifact-"));
});

afterEach(async () => {
  await fs.rm(tmpDir, { recursive: true, force: true });
});

async function ensureChangeDir(): Promise<string> {
  const dir = path.join(tmpDir, DESIGN_SPEC_DIR_NAME, "changes", CHANGE_NAME);
  await fs.mkdir(dir, { recursive: true });
  return dir;
}

async function writeArtifactFile(relativePath: string, content = "ok"): Promise<void> {
  const changeDir = await ensureChangeDir();
  const full = path.join(changeDir, relativePath);
  await fs.mkdir(path.dirname(full), { recursive: true });
  await fs.writeFile(full, content, "utf-8");
}

function buildArtifact(generates: string, id = "test-artifact"): Artifact {
  return {
    id,
    generates,
    template: "template",
    instruction: "instruction",
    requires: [],
  };
}

describe("hasArtifactOutput", () => {
  it("change 디렉토리가 없으면 false를 반환한다", async () => {
    const result = await hasArtifactOutput(tmpDir, CHANGE_NAME, buildArtifact("proposal.md"));
    expect(result).toBe(false);
  });

  describe("리터럴 경로", () => {
    it("지정한 파일이 존재하면 true를 반환한다", async () => {
      await writeArtifactFile("proposal.md");
      const result = await hasArtifactOutput(tmpDir, CHANGE_NAME, buildArtifact("proposal.md"));
      expect(result).toBe(true);
    });

    it("지정한 파일이 없으면 false를 반환한다", async () => {
      await ensureChangeDir();
      const result = await hasArtifactOutput(tmpDir, CHANGE_NAME, buildArtifact("missing.md"));
      expect(result).toBe(false);
    });

    it("같은 이름의 디렉토리만 있으면 false를 반환한다", async () => {
      const changeDir = await ensureChangeDir();
      await fs.mkdir(path.join(changeDir, "outputs"));
      const result = await hasArtifactOutput(tmpDir, CHANGE_NAME, buildArtifact("outputs"));
      expect(result).toBe(false);
    });

    it("중첩된 경로의 파일도 인식한다", async () => {
      await writeArtifactFile("nested/spec.md");
      const result = await hasArtifactOutput(tmpDir, CHANGE_NAME, buildArtifact("nested/spec.md"));
      expect(result).toBe(true);
    });
  });

  describe("glob 패턴", () => {
    it("glob 패턴이 파일을 하나 매치하면 true를 반환한다", async () => {
      await writeArtifactFile("specs/auth.md");
      const result = await hasArtifactOutput(tmpDir, CHANGE_NAME, buildArtifact("specs/*.md"));
      expect(result).toBe(true);
    });

    it("glob 패턴이 여러 파일을 매치해도 true를 반환한다", async () => {
      await writeArtifactFile("specs/auth.md");
      await writeArtifactFile("specs/billing.md");
      const result = await hasArtifactOutput(tmpDir, CHANGE_NAME, buildArtifact("specs/*.md"));
      expect(result).toBe(true);
    });

    it("glob 패턴이 어떤 파일도 매치 못 하면 false를 반환한다", async () => {
      await ensureChangeDir();
      const result = await hasArtifactOutput(tmpDir, CHANGE_NAME, buildArtifact("specs/*.md"));
      expect(result).toBe(false);
    });

    it("glob 패턴이 디렉토리만 매치하면 false를 반환한다", async () => {
      const changeDir = await ensureChangeDir();
      await fs.mkdir(path.join(changeDir, "specs", "sub"), { recursive: true });
      const result = await hasArtifactOutput(tmpDir, CHANGE_NAME, buildArtifact("specs/*"));
      expect(result).toBe(false);
    });
  });
});

describe("resolveArtifactOutput", () => {
  it("change 디렉토리가 없으면 undefined를 반환한다", async () => {
    const result = await resolveArtifactOutput(tmpDir, CHANGE_NAME, buildArtifact("proposal.md"));
    expect(result).toBeUndefined();
  });

  describe("리터럴 경로", () => {
    it("파일이 존재하면 절대 경로를 반환한다", async () => {
      await writeArtifactFile("proposal.md");
      const result = await resolveArtifactOutput(tmpDir, CHANGE_NAME, buildArtifact("proposal.md"));
      expect(result).toBeDefined();
      expect(path.isAbsolute(result!)).toBe(true);
      expect(result).toContain("proposal.md");
    });

    it("파일이 없으면 undefined를 반환한다", async () => {
      await ensureChangeDir();
      const result = await resolveArtifactOutput(tmpDir, CHANGE_NAME, buildArtifact("missing.md"));
      expect(result).toBeUndefined();
    });

    it("디렉토리만 있으면 undefined를 반환한다", async () => {
      const changeDir = await ensureChangeDir();
      await fs.mkdir(path.join(changeDir, "outputs"));
      const result = await resolveArtifactOutput(tmpDir, CHANGE_NAME, buildArtifact("outputs"));
      expect(result).toBeUndefined();
    });
  });

  describe("glob 패턴", () => {
    it("glob이 매치되면 glob 패턴 자체가 포함된 경로를 반환한다", async () => {
      await writeArtifactFile("specs/auth.md");
      const result = await resolveArtifactOutput(tmpDir, CHANGE_NAME, buildArtifact("specs/*.md"));
      expect(result).toBeDefined();
      expect(result).toContain("specs");
    });

    it("glob이 매치 못 하면 undefined를 반환한다", async () => {
      await ensureChangeDir();
      const result = await resolveArtifactOutput(tmpDir, CHANGE_NAME, buildArtifact("specs/*.md"));
      expect(result).toBeUndefined();
    });
  });
});

describe("getCompletedArtifacts", () => {
  it("완료된 artifact의 id를 모은 Set을 반환한다", async () => {
    await writeArtifactFile("proposal.md");
    await writeArtifactFile("tasks.md");

    const result = await getCompletedArtifacts(tmpDir, CHANGE_NAME, [
      buildArtifact("proposal.md", "proposal"),
      buildArtifact("design.md", "design"),
      buildArtifact("tasks.md", "tasks"),
    ]);

    expect(result).toEqual(new Set(["proposal", "tasks"]));
  });

  it("어떤 artifact도 완료되지 않으면 빈 Set을 반환한다", async () => {
    await ensureChangeDir();
    const result = await getCompletedArtifacts(tmpDir, CHANGE_NAME, [
      buildArtifact("proposal.md", "proposal"),
    ]);
    expect(result.size).toBe(0);
  });
});

describe("resolveArtifactOutputs", () => {
  it("존재하는 artifact만 Map에 담아 반환한다", async () => {
    await writeArtifactFile("proposal.md");
    await writeArtifactFile("specs/auth.md");

    const result = await resolveArtifactOutputs(tmpDir, CHANGE_NAME, [
      buildArtifact("proposal.md", "proposal"),
      buildArtifact("missing.md", "missing"),
      buildArtifact("specs/*.md", "specs"),
    ]);

    expect(result.size).toBe(2);
    expect(result.has("proposal")).toBe(true);
    expect(result.has("missing")).toBe(false);
    expect(result.has("specs")).toBe(true);
  });
});
