import { describe, it, expect } from "vitest";
import { isGlobPattern } from "#utils/glob.utils.js";

describe("isGlobPattern", () => {
  it("*를 포함하면 true를 반환한다", () => {
    expect(isGlobPattern("**/*.ts")).toBe(true);
    expect(isGlobPattern("src/*")).toBe(true);
  });

  it("?를 포함하면 true를 반환한다", () => {
    expect(isGlobPattern("file?.ts")).toBe(true);
  });

  it("[를 포함하면 true를 반환한다", () => {
    expect(isGlobPattern("file[0-9].ts")).toBe(true);
  });

  it("glob 문자가 없으면 false를 반환한다", () => {
    expect(isGlobPattern("file.ts")).toBe(false);
    expect(isGlobPattern("src/utils/foo.ts")).toBe(false);
  });
});
