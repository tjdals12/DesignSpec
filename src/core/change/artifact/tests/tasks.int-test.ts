import { describe, it, expect, beforeEach, afterEach } from "vitest";
import os from "node:os";
import fs from "node:fs/promises";
import path from "node:path";
import { getTaskSummary } from "#core/change/artifact/tasks.js";
import { DESIGN_SPEC_DIR_NAME } from "#core/config.js";

let tmpDir: string;
const CHANGE_NAME = "test-change";

beforeEach(async () => {
  tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "designspec-tasks-"));
});

afterEach(async () => {
  await fs.rm(tmpDir, { recursive: true, force: true });
});

async function writeTasksFile(content: string): Promise<void> {
  const dir = path.join(tmpDir, DESIGN_SPEC_DIR_NAME, "changes", CHANGE_NAME);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(path.join(dir, "tasks.md"), content, "utf-8");
}

describe("getTaskSummary", () => {
  describe("파일 부재·빈 파일", () => {
    it("tasks.md가 없으면 빈 summary를 반환한다", async () => {
      const result = await getTaskSummary(tmpDir, CHANGE_NAME);
      expect(result.progress).toEqual({ total: 0, completed: 0 });
      expect(result.items).toEqual([]);
    });

    it("빈 tasks.md는 빈 summary를 반환한다", async () => {
      await writeTasksFile("");
      const result = await getTaskSummary(tmpDir, CHANGE_NAME);
      expect(result.progress).toEqual({ total: 0, completed: 0 });
      expect(result.items).toEqual([]);
    });

    it("태스크 마크업이 없는 일반 텍스트는 무시한다", async () => {
      await writeTasksFile("# Tasks\n\nSome description without checkboxes.\n");
      const result = await getTaskSummary(tmpDir, CHANGE_NAME);
      expect(result.progress).toEqual({ total: 0, completed: 0 });
      expect(result.items).toEqual([]);
    });
  });

  describe("단일 태스크 파싱", () => {
    it("미완료 태스크를 파싱한다", async () => {
      await writeTasksFile("- [ ] Implement feature X");
      const result = await getTaskSummary(tmpDir, CHANGE_NAME);
      expect(result.progress).toEqual({ total: 1, completed: 0 });
      expect(result.items).toEqual([{ text: "Implement feature X", completed: false }]);
    });

    it("완료 태스크를 파싱한다", async () => {
      await writeTasksFile("- [x] Implement feature X");
      const result = await getTaskSummary(tmpDir, CHANGE_NAME);
      expect(result.progress).toEqual({ total: 1, completed: 1 });
      expect(result.items).toEqual([{ text: "Implement feature X", completed: true }]);
    });

    it("대문자 [X]도 완료로 인식한다", async () => {
      await writeTasksFile("- [X] Done item");
      const result = await getTaskSummary(tmpDir, CHANGE_NAME);
      expect(result.progress).toEqual({ total: 1, completed: 1 });
      expect(result.items[0]?.completed).toBe(true);
    });

    it("`*` 불릿 마커도 지원한다", async () => {
      await writeTasksFile("* [ ] Task A\n* [x] Task B");
      const result = await getTaskSummary(tmpDir, CHANGE_NAME);
      expect(result.progress).toEqual({ total: 2, completed: 1 });
      expect(result.items.map((i) => i.text)).toEqual(["Task A", "Task B"]);
    });
  });

  describe("여러 태스크 혼합", () => {
    it("완료·미완료가 섞인 목록에서 총합과 완료 수를 정확히 계산한다", async () => {
      const content = ["- [x] One", "- [ ] Two", "- [x] Three", "- [ ] Four"].join("\n");
      await writeTasksFile(content);
      const result = await getTaskSummary(tmpDir, CHANGE_NAME);
      expect(result.progress).toEqual({ total: 4, completed: 2 });
      expect(result.items.map((i) => i.completed)).toEqual([true, false, true, false]);
    });

    it("태스크 사이의 빈 줄·헤더 라인은 무시한다", async () => {
      const content = ["# Tasks", "", "- [ ] First", "", "## Section", "", "- [x] Second"].join(
        "\n",
      );
      await writeTasksFile(content);
      const result = await getTaskSummary(tmpDir, CHANGE_NAME);
      expect(result.progress).toEqual({ total: 2, completed: 1 });
    });
  });

  describe("들여쓰기 멀티라인 태스크", () => {
    it("태스크 직후의 들여쓰기 라인은 그 태스크의 텍스트에 연결한다", async () => {
      const content = ["- [ ] Parent task", "  with continuation", "  and another line"].join("\n");
      await writeTasksFile(content);
      const result = await getTaskSummary(tmpDir, CHANGE_NAME);
      expect(result.progress.total).toBe(1);
      expect(result.items[0]?.text).toBe("Parent task\n  with continuation\n  and another line");
    });

    it("탭으로 들여쓰기된 라인도 연결한다", async () => {
      const content = ["- [x] Task", "\tindented with tab"].join("\n");
      await writeTasksFile(content);
      const result = await getTaskSummary(tmpDir, CHANGE_NAME);
      expect(result.items[0]?.text).toBe("Task\n\tindented with tab");
    });

    it("비태스크·비들여쓰기 라인을 만나면 현재 태스크 추적을 중단한다", async () => {
      const content = [
        "- [ ] First",
        "  continuation of first",
        "Regular paragraph",
        "  this should NOT join the first task",
        "- [x] Second",
      ].join("\n");
      await writeTasksFile(content);
      const result = await getTaskSummary(tmpDir, CHANGE_NAME);
      expect(result.progress).toEqual({ total: 2, completed: 1 });
      expect(result.items[0]?.text).toBe("First\n  continuation of first");
      expect(result.items[1]?.text).toBe("Second");
    });

    it("어떤 태스크도 등장하기 전의 들여쓰기 라인은 무시한다", async () => {
      const content = ["  orphan indented line", "- [ ] First task"].join("\n");
      await writeTasksFile(content);
      const result = await getTaskSummary(tmpDir, CHANGE_NAME);
      expect(result.items).toEqual([{ text: "First task", completed: false }]);
    });
  });

  describe("텍스트 추출", () => {
    it("체크박스 마크업을 제거하고 본문만 추출한다", async () => {
      await writeTasksFile("- [ ]   Multiple spaces after checkbox");
      const result = await getTaskSummary(tmpDir, CHANGE_NAME);
      expect(result.items[0]?.text).toBe("Multiple spaces after checkbox");
    });
  });
});
