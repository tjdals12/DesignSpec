import { isEmpty, isUndefined } from "es-toolkit/compat";

import path from "node:path";
import fsSync from "node:fs";

import { AI_TOOLS, type AIToolOption, SKILL_IDS } from "./config.js";
import { FileSystemUtils } from "#utils/file-system.utils.js";

export interface ToolSkillStatus {
  configured: boolean;
  fullyConfigured: boolean;
  skillCount: number;
}

export function getToolById(toolId: AIToolOption["value"]): AIToolOption | undefined {
  return AI_TOOLS.find((tool) => tool.value === toolId);
}

export function getSupportedToolIds(): Array<AIToolOption["value"]> {
  return AI_TOOLS.filter((tool) => !isEmpty(tool.skillsPath)).map((tool) => tool.value);
}

export async function getInstalledTools(projectPath: string): Promise<AIToolOption[]> {
  const installedTools: AIToolOption[] = [];
  for (const tool of AI_TOOLS) {
    if (tool.detectionDir) {
      const dirPath = path.resolve(projectPath, tool.detectionDir);

      const dirExists = await FileSystemUtils.directoryExists(dirPath);
      if (dirExists) {
        installedTools.push(tool);
      }
    }
  }
  return installedTools;
}

export function getToolSkillStatus(projectPath: string, toolId: string): ToolSkillStatus {
  const tool = AI_TOOLS.find((tool) => tool.value === toolId);
  if (isUndefined(tool) || isUndefined(tool.skillsPath)) {
    return {
      configured: false,
      fullyConfigured: false,
      skillCount: 0,
    };
  }

  const skillsPath = path.join(projectPath, tool.skillsPath);
  let skillCount = 0;
  for (const skillId of SKILL_IDS) {
    const skillFile = path.join(skillsPath, skillId, "SKILL.md");
    const skillExists = fsSync.existsSync(skillFile);
    if (skillExists) {
      skillCount++;
    }
  }

  return {
    configured: skillCount > 0,
    fullyConfigured: skillCount === SKILL_IDS.length,
    skillCount,
  };
}

export function getToolStates(projectPath: string): Map<AIToolOption["value"], ToolSkillStatus> {
  const states = new Map<AIToolOption["value"], ToolSkillStatus>();
  const toolIds = getSupportedToolIds();

  for (const toolId of toolIds) {
    const toolSkillStatus = getToolSkillStatus(projectPath, toolId);
    states.set(toolId, toolSkillStatus);
  }

  return states;
}
