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
  const output = consoleSpy.mock.calls.map((args: unknown[]) => String(args[0])).join("\n");
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

async function createPageSpec(dir: string, name: string): Promise<void> {
  const filePath = path.join(dir, "design-spec", "specs", "pages", `${name}.md`);
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, `# ${name}\n`);
}

async function createComponentSpec(dir: string, name: string): Promise<void> {
  const filePath = path.join(dir, "design-spec", "specs", "components", `${name}.md`);
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, `# ${name}\n`);
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

  it("기본 동작은 changes만 포함하고 specs 키는 포함하지 않는다", async () => {
    await createPageSpec(tmpDir, "space-list");
    await new ListCommand({ json: true }).execute(tmpDir);
    const output = captureJsonOutput() as Record<string, unknown>;
    expect(output).toHaveProperty("changes");
    expect(output).not.toHaveProperty("specs");
  });
});

describe("ListCommand --specs (JSON)", () => {
  beforeEach(async () => {
    await initializeProject(tmpDir);
  });

  it("spec이 없으면 빈 specs 배열을 출력한다", async () => {
    await new ListCommand({ json: true, specs: true }).execute(tmpDir);
    const output = captureJsonOutput() as { specs: unknown[]; changes?: unknown };
    expect(output.specs).toEqual([]);
    expect(output).not.toHaveProperty("changes");
  });

  it("page spec은 kind=page로 노출된다", async () => {
    await createPageSpec(tmpDir, "space-list");
    await new ListCommand({ json: true, specs: true }).execute(tmpDir);
    const output = captureJsonOutput() as {
      specs: Array<{ specName: string; kind: string }>;
    };
    expect(output.specs).toContainEqual(
      expect.objectContaining({ specName: "space-list", kind: "page" }),
    );
  });

  it("component spec은 kind=component로 노출된다", async () => {
    await createComponentSpec(tmpDir, "space-form");
    await new ListCommand({ json: true, specs: true }).execute(tmpDir);
    const output = captureJsonOutput() as {
      specs: Array<{ specName: string; kind: string }>;
    };
    expect(output.specs).toContainEqual(
      expect.objectContaining({ specName: "space-form", kind: "component" }),
    );
  });

  it(".md가 아닌 파일과 숨김 파일은 무시한다", async () => {
    const pagesDir = path.join(tmpDir, "design-spec", "specs", "pages");
    await fs.mkdir(pagesDir, { recursive: true });
    await fs.writeFile(path.join(pagesDir, "notes.txt"), "ignore");
    await fs.writeFile(path.join(pagesDir, ".hidden.md"), "ignore");
    await fs.writeFile(path.join(pagesDir, "visible.md"), "# visible\n");

    await new ListCommand({ json: true, specs: true }).execute(tmpDir);
    const output = captureJsonOutput() as {
      specs: Array<{ specName: string }>;
    };
    const names = output.specs.map((s) => s.specName);
    expect(names).toEqual(["visible"]);
  });
});

describe("ListCommand --changes --specs (JSON)", () => {
  beforeEach(async () => {
    await initializeProject(tmpDir);
  });

  it("두 플래그가 모두 켜지면 changes와 specs 키 모두 출력한다", async () => {
    await createChange(tmpDir, "my-change");
    await createPageSpec(tmpDir, "space-list");
    await createComponentSpec(tmpDir, "space-form");

    await new ListCommand({ json: true, changes: true, specs: true }).execute(tmpDir);
    const output = captureJsonOutput() as {
      changes: Array<{ changeName: string }>;
      specs: Array<{ specName: string; kind: string }>;
    };
    expect(output.changes.map((c) => c.changeName)).toEqual(["my-change"]);
    expect(output.specs.map((s) => s.specName).sort()).toEqual(["space-form", "space-list"]);
  });
});

describe("ListCommand 실패", () => {
  it("DesignSpec 미초기화 상태에서 실행하면 에러를 던진다", async () => {
    await expect(new ListCommand({ json: true }).execute(tmpDir)).rejects.toThrow();
  });
});
