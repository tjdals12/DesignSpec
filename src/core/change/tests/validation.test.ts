import { describe, it, expect } from "vitest";
import { validateChangeName } from "#core/change/validation.js";
import { ChangeValidationError } from "#core/change/error.js";

describe("validateChangeName", () => {
  it("올바른 kebab-case 이름은 에러를 던지지 않는다", async () => {
    await expect(validateChangeName("add-auth")).resolves.toBeUndefined();
    await expect(validateChangeName("refactor-db")).resolves.toBeUndefined();
    await expect(validateChangeName("fix-login-bug")).resolves.toBeUndefined();
  });

  it("숫자를 포함한 kebab-case도 허용한다", async () => {
    await expect(validateChangeName("v2-migration")).resolves.toBeUndefined();
    await expect(validateChangeName("add-oauth2")).resolves.toBeUndefined();
  });

  it("단일 단어도 허용한다", async () => {
    await expect(validateChangeName("auth")).resolves.toBeUndefined();
  });

  it("빈 문자열이면 ChangeValidationError를 던진다", async () => {
    await expect(validateChangeName("")).rejects.toThrowError(ChangeValidationError);
  });

  it("대문자가 포함되면 ChangeValidationError를 던진다", async () => {
    await expect(validateChangeName("AddAuth")).rejects.toThrowError(ChangeValidationError);
    await expect(validateChangeName("add-Auth")).rejects.toThrowError(ChangeValidationError);
  });

  it("언더스코어가 포함되면 ChangeValidationError를 던진다", async () => {
    await expect(validateChangeName("add_auth")).rejects.toThrowError(ChangeValidationError);
  });

  it("하이픈으로 시작하면 ChangeValidationError를 던진다", async () => {
    await expect(validateChangeName("-add-auth")).rejects.toThrowError(ChangeValidationError);
  });

  it("하이픈으로 끝나면 ChangeValidationError를 던진다", async () => {
    await expect(validateChangeName("add-auth-")).rejects.toThrowError(ChangeValidationError);
  });

  it("연속된 하이픈이 있으면 ChangeValidationError를 던진다", async () => {
    await expect(validateChangeName("add--auth")).rejects.toThrowError(ChangeValidationError);
  });

  it("숫자로 시작하면 ChangeValidationError를 던진다", async () => {
    await expect(validateChangeName("1-add-auth")).rejects.toThrowError(ChangeValidationError);
  });
});
