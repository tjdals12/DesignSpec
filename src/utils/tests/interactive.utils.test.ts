import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

import { isInteractive } from "#utils/interactive.utils.js";

describe("isInteractive", () => {
  const originalCI = process.env.CI;
  const originalFlag = process.env.DESIGN_SPEC_INTERACTIVE;
  const originalIsTTY = process.stdin.isTTY;

  beforeEach(() => {
    delete process.env.CI;
    delete process.env.DESIGN_SPEC_INTERACTIVE;
    Object.defineProperty(process.stdin, "isTTY", { value: true, configurable: true });
  });

  afterEach(() => {
    if (originalCI === undefined) delete process.env.CI;
    else process.env.CI = originalCI;
    if (originalFlag === undefined) delete process.env.DESIGN_SPEC_INTERACTIVE;
    else process.env.DESIGN_SPEC_INTERACTIVE = originalFlag;
    Object.defineProperty(process.stdin, "isTTY", { value: originalIsTTY, configurable: true });
    vi.restoreAllMocks();
  });

  it("TTY이고 다른 비활성 조건이 없으면 true를 반환한다", () => {
    expect(isInteractive()).toBe(true);
  });

  it("DESIGN_SPEC_INTERACTIVE=0이면 false를 반환한다", () => {
    process.env.DESIGN_SPEC_INTERACTIVE = "0";
    expect(isInteractive()).toBe(false);
  });

  it("CI 환경변수가 있으면 false를 반환한다", () => {
    process.env.CI = "true";
    expect(isInteractive()).toBe(false);
  });

  it("stdin이 TTY가 아니면 false를 반환한다", () => {
    Object.defineProperty(process.stdin, "isTTY", { value: false, configurable: true });
    expect(isInteractive()).toBe(false);
  });
});
