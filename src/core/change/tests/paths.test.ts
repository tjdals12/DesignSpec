import path from "node:path";
import { describe, it, expect } from "vitest";
import {
  buildChangesDirPath,
  buildArchivesDirPath,
  buildChangeDirPath,
  buildMetadataPath,
} from "#core/change/paths.js";
import { DESIGN_SPEC_DIR_NAME, METADATA_FILENAME } from "#core/config.js";

describe("buildChangesDirPath", () => {
  it("프로젝트 경로 아래 changes 디렉토리 경로를 반환한다", () => {
    const result = buildChangesDirPath("/project");
    expect(result).toBe(path.join("/project", DESIGN_SPEC_DIR_NAME, "changes"));
  });
});

describe("buildArchivesDirPath", () => {
  it("changes 디렉토리 아래 archive 디렉토리 경로를 반환한다", () => {
    const result = buildArchivesDirPath("/project");
    expect(result).toBe(path.join("/project", DESIGN_SPEC_DIR_NAME, "changes", "archive"));
  });
});

describe("buildChangeDirPath", () => {
  it("changeName에 해당하는 디렉토리 경로를 반환한다", () => {
    const result = buildChangeDirPath("/project", "my-change");
    expect(result).toBe(path.join("/project", DESIGN_SPEC_DIR_NAME, "changes", "my-change"));
  });
});

describe("buildMetadataPath", () => {
  it("change 디렉토리 아래 메타데이터 파일 경로를 반환한다", () => {
    const result = buildMetadataPath("/project", "my-change");
    expect(result).toBe(
      path.join("/project", DESIGN_SPEC_DIR_NAME, "changes", "my-change", METADATA_FILENAME),
    );
  });
});
