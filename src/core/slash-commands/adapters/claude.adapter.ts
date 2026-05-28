import path from "node:path";

import { SlashCommandAdapter } from "../slash-command-adapter.js";
import type { SlashCommandTemplate } from "../slash-command-template.js";
import { SLASH_COMMAND_NAMESPACE } from "#core/config.js";
import { escapeYamlValue, formatTagsArray } from "#utils/yaml.utils.js";
import { isUndefined } from "es-toolkit/compat";

export class ClaudeAdapter extends SlashCommandAdapter {
  toolId: string = "claude";

  getFilePath(commandId: string): string {
    return path.join(".claude", "commands", SLASH_COMMAND_NAMESPACE, `${commandId}.md`);
  }

  formatFile(template: SlashCommandTemplate): string {
    const { name, description, category, tags, instructions } = template;

    const frontmatterLines: string[] = [
      `name: ${escapeYamlValue(name)}`,
      `description: ${escapeYamlValue(description)}`,
    ];

    if (!isUndefined(category)) {
      frontmatterLines.push(`category: ${escapeYamlValue(category)}`);
    }
    if (!isUndefined(tags)) {
      frontmatterLines.push(`tags: ${formatTagsArray(tags)}`);
    }

    return `---\n${frontmatterLines.join("\n")}\n---\n\n${instructions}\n`;
  }
}
