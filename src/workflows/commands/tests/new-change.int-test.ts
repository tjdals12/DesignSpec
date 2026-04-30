import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import os from "node:os";
import fs from "node:fs/promises";
import path from "node:path";
import { parse as parseYaml } from "yaml";
import { NewChangeCommand } from "#workflows/commands/new-change.js";

vi.mock("ora", () => {
  const spinner = {
    start: () => spinner,
    stop: vi.fn(),
    succeed: vi.fn(),
    fail: vi.fn(),
  };
  return { default: () => spinner };
});

let tmpDir: string;

beforeEach(async () => {
  tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "designspec-"));
});

afterEach(async () => {
  await fs.rm(tmpDir, { recursive: true, force: true });
});

async function initializeProject(dir: string): Promise<void> {
  await fs.mkdir(path.join(dir, "design-spec", "changes"), { recursive: true });
}

describe("NewChangeCommand", () => {
  describe("성공", () => {
    beforeEach(async () => {
      await initializeProject(tmpDir);
    });

    it("change 디렉토리가 생성된다", async () => {
      await new NewChangeCommand({ change: "my-change" }).execute(tmpDir);
      const stat = await fs.stat(path.join(tmpDir, "design-spec", "changes", "my-change"));
      expect(stat.isDirectory()).toBe(true);
    });

    it("메타데이터 파일이 생성된다", async () => {
      await new NewChangeCommand({ change: "my-change" }).execute(tmpDir);
      const stat = await fs.stat(
        path.join(tmpDir, "design-spec", "changes", "my-change", ".design-spec.yaml"),
      );
      expect(stat.isFile()).toBe(true);
    });

    it("메타데이터 파일에 schema: default가 포함된다", async () => {
      await new NewChangeCommand({ change: "my-change" }).execute(tmpDir);
      const content = await fs.readFile(
        path.join(tmpDir, "design-spec", "changes", "my-change", ".design-spec.yaml"),
        "utf-8",
      );
      const metadata = parseYaml(content) as { schema: string };
      expect(metadata.schema).toBe("default");
    });

    it("메타데이터 파일에 오늘 날짜가 포함된다", async () => {
      await new NewChangeCommand({ change: "my-change" }).execute(tmpDir);
      const content = await fs.readFile(
        path.join(tmpDir, "design-spec", "changes", "my-change", ".design-spec.yaml"),
        "utf-8",
      );
      const metadata = parseYaml(content) as { created: string };
      const today = new Date().toISOString().split("T")[0];
      expect(metadata.created).toBe(today);
    });
  });

  describe("실패", () => {
    it("--change 없이 실행하면 에러를 던진다", async () => {
      await initializeProject(tmpDir);
      await expect(new NewChangeCommand({}).execute(tmpDir)).rejects.toThrow();
    });

    it("DesignSpec 미초기화 상태에서 실행하면 에러를 던진다", async () => {
      await expect(new NewChangeCommand({ change: "my-change" }).execute(tmpDir)).rejects.toThrow();
    });

    it("이미 존재하는 change 이름으로 실행하면 에러를 던진다", async () => {
      await initializeProject(tmpDir);
      await new NewChangeCommand({ change: "my-change" }).execute(tmpDir);
      await expect(new NewChangeCommand({ change: "my-change" }).execute(tmpDir)).rejects.toThrow();
    });

    it("kebab-case가 아닌 이름으로 실행하면 에러를 던진다", async () => {
      await initializeProject(tmpDir);
      await expect(new NewChangeCommand({ change: "MyChange" }).execute(tmpDir)).rejects.toThrow();
    });
  });
});
