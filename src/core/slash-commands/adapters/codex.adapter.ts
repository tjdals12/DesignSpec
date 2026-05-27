import path from "node:path";

import { SlashCommandAdapter } from "../slash-command-adapter.js";
import type { SlashCommandTemplate } from "../slash-command-template.js";
import { SLASH_COMMAND_NAMESPACE } from "#core/config.js";
import { escapeYamlValue } from "#utils/yaml.utils.js";

export class CodexAdapter extends SlashCommandAdapter {
  toolId: string = "codex";

  getFilePath(commandId: string): string {
    return path.join(".codex", "prompts", `${SLASH_COMMAND_NAMESPACE}-${commandId}.md`);
  }

  formatFile(template: SlashCommandTemplate): string {
    const { description, instructions } = template;

    return `---\ndescription: ${escapeYamlValue(description)}\n---\n\n${instructions}\n`;
  }
}
