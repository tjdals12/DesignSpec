export const DESIGN_SPEC_DIR_NAME = "design-spec";
export const METADATA_FILENAME = ".design-spec.yaml";

export const SKILL_IDS = [
  "designspec-new-change",
  "designspec-continue-change",
  "designspec-apply-change",
  "designspec-sync-specs",
  "designspec-archive-change",
] as const;
export type SkillIds = (typeof SKILL_IDS)[number];

export const SLASH_COMMAND_NAMESPACE = "desx";

export const COMMAND_IDS = ["new", "continue", "apply", "sync", "archive"] as const;
export type CommandIds = (typeof COMMAND_IDS)[number];

export interface AIToolOption {
  name: string;
  value: string;
  skillsDir: string;
}

export interface AIToolInfo extends AIToolOption {
  wasConfigured: boolean;
}

export const AI_TOOLS: AIToolOption[] = [
  {
    name: "Codex",
    value: "codex",
    skillsDir: ".codex",
  },
  {
    name: "Claude Code",
    value: "claude",
    skillsDir: ".claude",
  },
];
