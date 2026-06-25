export const DESIGN_SPEC_DIR_NAME = "design-spec";
export const METADATA_FILENAME = ".design-spec.yaml";
export const CONFIG_FILENAMES = ["config.yaml", "config.yml"] as const;

export const SKILL_IDS = [
  "desx-new",
  "desx-continue",
  "desx-ff",
  "desx-apply",
  "desx-sync",
  "desx-archive",
  "desx-verify",
  "desx-explore",
  "desx-style-init",
] as const;
export type SkillIds = (typeof SKILL_IDS)[number];

export interface AIToolOption {
  name: string;
  value: string;
  /** Relative path where DesignSpec writes this tool's skills (e.g. ".claude/skills"). */
  skillsPath: string;
  /** Optional dir whose presence marks the tool as already set up (e.g. ".claude"). */
  detectionDir?: string;
  /** Short, human-readable description shown on the interactive welcome screen. */
  description?: string;
}

export interface AIToolInfo extends AIToolOption {
  wasConfigured: boolean;
}

export const AI_TOOLS: AIToolOption[] = [
  {
    name: "Codex",
    value: "codex",
    skillsPath: ".agents/skills",
    detectionDir: ".codex",
    description: "OpenAI's coding agent CLI",
  },
  {
    name: "Claude Code",
    value: "claude",
    skillsPath: ".claude/skills",
    detectionDir: ".claude",
    description: "Anthropic's agentic coding CLI",
  },
  {
    name: "Antigravity",
    value: "antigravity",
    skillsPath: ".agents/skills",
    description: "Google's agentic coding CLI",
  },
];
