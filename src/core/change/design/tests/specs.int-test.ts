import { describe, it, expect, beforeEach, afterEach } from "vitest";
import os from "node:os";
import fs from "node:fs/promises";
import path from "node:path";
import { collectSpecs, readSpec } from "#core/change/design/specs.js";

let tmpDir: string;

beforeEach(async () => {
  tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "designspec-design-"));
});

afterEach(async () => {
  await fs.rm(tmpDir, { recursive: true, force: true });
});

async function writeSpec(relativePath: string, content: string): Promise<void> {
  const full = path.join(tmpDir, relativePath);
  await fs.mkdir(path.dirname(full), { recursive: true });
  await fs.writeFile(full, content, "utf-8");
}

describe("collectSpecs", () => {
  it("매치되는 *.md를 이름 오름차순으로 모은다", async () => {
    await writeSpec("components/todo-item.md", "item");
    await writeSpec("components/empty-state.md", "empty");
    await writeSpec("components/quick-add.md", "quick");

    const specs = collectSpecs(tmpDir, "components/*.md");

    expect(specs.map((spec) => spec.name)).toEqual(["empty-state", "quick-add", "todo-item"]);
  });

  it("name은 확장자를 제거한 파일명, spec은 trim된 내용이다", async () => {
    await writeSpec("components/page-header.md", "  # page-header\n\n본문\n");

    const specs = collectSpecs(tmpDir, "components/*.md");

    expect(specs).toEqual([{ name: "page-header", spec: "# page-header\n\n본문" }]);
  });

  it("매치되는 파일이 없으면 빈 배열을 반환한다", async () => {
    await fs.mkdir(path.join(tmpDir, "components"), { recursive: true });

    const specs = collectSpecs(tmpDir, "components/*.md");

    expect(specs).toEqual([]);
  });

  it("패턴에 맞지 않는 파일은 제외한다", async () => {
    await writeSpec("components/button.md", "button");
    await writeSpec("components/notes.txt", "notes");

    const specs = collectSpecs(tmpDir, "components/*.md");

    expect(specs.map((spec) => spec.name)).toEqual(["button"]);
  });

  it("이름이 *.md와 매치되는 디렉토리는 건너뛴다", async () => {
    await fs.mkdir(path.join(tmpDir, "components", "weird.md"), { recursive: true });
    await writeSpec("components/real.md", "real");

    const specs = collectSpecs(tmpDir, "components/*.md");

    expect(specs.map((spec) => spec.name)).toEqual(["real"]);
  });
});

describe("readSpec", () => {
  it("파일이 있으면 trim된 내용을 반환한다", async () => {
    await writeSpec("screens.md", "  # Screens\n\n본문\n");

    const content = readSpec(tmpDir, "screens.md");

    expect(content).toBe("# Screens\n\n본문");
  });

  it("파일이 없으면 null을 반환한다", () => {
    const content = readSpec(tmpDir, "screens.md");
    expect(content).toBeNull();
  });

  it("같은 이름의 디렉토리만 있으면 null을 반환한다", async () => {
    await fs.mkdir(path.join(tmpDir, "screens.md"), { recursive: true });

    const content = readSpec(tmpDir, "screens.md");

    expect(content).toBeNull();
  });
});
