import dedent from "dedent";

import path from "node:path";

import { SlashCommandAdapter } from "../slash-command-adapter.js";
import type { SlashCommandTemplate } from "../slasn-command-template.js";
import { escapeYamlValue, formatTagsArray } from "#utils/yaml.utils.js";
import { isUndefined } from "es-toolkit/compat";

export class ClaudeAdapter extends SlashCommandAdapter {
  toolId: string = "claude";

  getFilePath(commandId: string): string {
    const filePath = path.join(".claude", "commands", "designspec", `${commandId}.md`);
    return filePath;
  }

  formatFile(template: SlashCommandTemplate): string {
    const { name, description, category, tags, instructions } = template;

    const lines: string[] = [
      `name: ${escapeYamlValue(name)}`,
      `description: ${escapeYamlValue(description)}`,
    ];

    if (!isUndefined(category)) {
      lines.push(`category: ${escapeYamlValue(category)}`);
    }

    if (!isUndefined(tags)) {
      lines.push(`tags: ${formatTagsArray(tags)}`);
    }

    return dedent`
    ---
    ${lines.join("\n")}
    ---

    ${instructions}
    `;
  }
}
