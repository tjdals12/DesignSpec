import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { resolveProjectConfig } from "#core/project-config/resolver.js";
import { DESIGN_SPEC_DIR_NAME } from "#core/config.js";

describe("resolveProjectConfig", () => {
  let projectPath: string;
  let warnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(async () => {
    projectPath = await fs.mkdtemp(path.join(os.tmpdir(), "designspec-config-"));
    await fs.mkdir(path.join(projectPath, DESIGN_SPEC_DIR_NAME), { recursive: true });
    warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(async () => {
    warnSpy.mockRestore();
    await fs.rm(projectPath, { recursive: true, force: true });
  });

  const writeConfig = async (content: string) => {
    await fs.writeFile(
      path.join(projectPath, DESIGN_SPEC_DIR_NAME, "config.yaml"),
      content,
      "utf-8",
    );
  };

  it("config.yaml이 없으면 null을 반환하고 경고를 출력하지 않는다", async () => {
    const result = await resolveProjectConfig(projectPath);
    expect(result).toBeNull();
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it("빈 config.yaml은 null을 반환하고 경고를 출력하지 않는다", async () => {
    await writeConfig("");
    const result = await resolveProjectConfig(projectPath);
    expect(result).toBeNull();
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it("주석과 공백만 있는 config.yaml은 null을 반환하고 경고를 출력하지 않는다", async () => {
    await writeConfig("# just a comment\n\n   \n");
    const result = await resolveProjectConfig(projectPath);
    expect(result).toBeNull();
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it("객체가 아닌 값은 경고하고 null을 반환한다", async () => {
    await writeConfig("just a string");
    const result = await resolveProjectConfig(projectPath);
    expect(result).toBeNull();
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining("is not a valid YAML object"));
  });

  it("유효한 config.yaml은 파싱된 객체를 반환한다", async () => {
    await writeConfig("context: hello world\n");
    const result = await resolveProjectConfig(projectPath);
    expect(result).toEqual({ context: "hello world" });
    expect(warnSpy).not.toHaveBeenCalled();
  });
});
