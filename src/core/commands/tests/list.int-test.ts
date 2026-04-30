import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import os from "node:os";
import fs from "node:fs/promises";
import path from "node:path";
import { ListCommand } from "#core/commands/list.js";

let tmpDir: string;
let consoleSpy: ReturnType<typeof vi.spyOn>;

beforeEach(async () => {
  tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "designspec-"));
  consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
});

afterEach(async () => {
  consoleSpy.mockRestore();
  await fs.rm(tmpDir, { recursive: true, force: true });
});

function captureJsonOutput(): unknown {
  const output = consoleSpy.mock.calls.map((args) => String(args[0])).join("\n");
  return JSON.parse(output);
}

async function initializeProject(dir: string): Promise<void> {
  await fs.mkdir(path.join(dir, "design-spec", "changes"), { recursive: true });
}

async function createChange(dir: string, changeName: string): Promise<void> {
  await fs.mkdir(path.join(dir, "design-spec", "changes", changeName), {
    recursive: true,
  });
}

describe("ListCommand (JSON)", () => {
  beforeEach(async () => {
    await initializeProject(tmpDir);
  });

  it("change가 없으면 빈 changes 배열을 출력한다", async () => {
    await new ListCommand({ json: true }).execute(tmpDir);
    const output = captureJsonOutput() as { changes: unknown[] };
    expect(output.changes).toEqual([]);
  });

  it("change가 있으면 changeName이 포함된다", async () => {
    await createChange(tmpDir, "my-change");
    await new ListCommand({ json: true }).execute(tmpDir);
    const output = captureJsonOutput() as {
      changes: Array<{ changeName: string }>;
    };
    expect(output.changes[0]?.changeName).toBe("my-change");
  });

  it("tasks.md가 없으면 status가 no-tasks이다", async () => {
    await createChange(tmpDir, "my-change");
    await new ListCommand({ json: true }).execute(tmpDir);
    const output = captureJsonOutput() as {
      changes: Array<{ status: string }>;
    };
    expect(output.changes[0]?.status).toBe("no-tasks");
  });

  it("미완료 태스크가 있으면 status가 in-progress이다", async () => {
    await createChange(tmpDir, "my-change");
    await fs.writeFile(
      path.join(tmpDir, "design-spec", "changes", "my-change", "tasks.md"),
      "- [x] 완료\n- [ ] 미완료\n",
    );
    await new ListCommand({ json: true }).execute(tmpDir);
    const output = captureJsonOutput() as {
      changes: Array<{ status: string }>;
    };
    expect(output.changes[0]?.status).toBe("in-progress");
  });

  it("모든 태스크가 완료되면 status가 complete이다", async () => {
    await createChange(tmpDir, "my-change");
    await fs.writeFile(
      path.join(tmpDir, "design-spec", "changes", "my-change", "tasks.md"),
      "- [x] 완료1\n- [x] 완료2\n",
    );
    await new ListCommand({ json: true }).execute(tmpDir);
    const output = captureJsonOutput() as {
      changes: Array<{ status: string }>;
    };
    expect(output.changes[0]?.status).toBe("complete");
  });

  it("archive 디렉토리는 목록에 포함되지 않는다", async () => {
    await fs.mkdir(path.join(tmpDir, "design-spec", "changes", "archive"), { recursive: true });
    await new ListCommand({ json: true }).execute(tmpDir);
    const output = captureJsonOutput() as {
      changes: Array<{ changeName: string }>;
    };
    const names = output.changes.map((c) => c.changeName);
    expect(names).not.toContain("archive");
  });
});

describe("ListCommand 실패", () => {
  it("DesignSpec 미초기화 상태에서 실행하면 에러를 던진다", async () => {
    await expect(new ListCommand({ json: true }).execute(tmpDir)).rejects.toThrow();
  });
});
