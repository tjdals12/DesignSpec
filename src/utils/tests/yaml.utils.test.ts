import { describe, it, expect } from "vitest";
import { escapeYamlValue, formatTagsArray } from "#utils/yaml.utils.js";

describe("escapeYamlValue", () => {
  it("특수문자가 없으면 그대로 반환한다", () => {
    expect(escapeYamlValue("hello")).toBe("hello");
    expect(escapeYamlValue("simple-value")).toBe("simple-value");
  });

  it("콜론을 포함하면 큰따옴표로 감싼다", () => {
    expect(escapeYamlValue("key: value")).toBe('"key: value"');
  });

  it("줄바꿈을 포함하면 이스케이프하고 큰따옴표로 감싼다", () => {
    expect(escapeYamlValue("line1\nline2")).toBe('"line1\\nline2"');
  });

  it("내부 큰따옴표를 이스케이프한다", () => {
    expect(escapeYamlValue('say "hello"')).toBe('"say \\"hello\\""');
  });
});

describe("formatTagsArray", () => {
  it("태그 배열을 YAML 인라인 배열 형식으로 반환한다", () => {
    expect(formatTagsArray(["a", "b", "c"])).toBe("[a, b, c]");
  });

  it("특수문자를 포함한 태그를 이스케이프한다", () => {
    expect(formatTagsArray(["tag:one", "normal"])).toBe('["tag:one", normal]');
  });

  it("빈 배열이면 빈 인라인 배열을 반환한다", () => {
    expect(formatTagsArray([])).toBe("[]");
  });
});
