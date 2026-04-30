import path from "node:path";

import { SlashCommandAdapter } from "../slash-command-adapter.js";
import type { SlashCommandTemplate } from "../slasn-command-template.js";
import dedent from "dedent";
import { escapeYamlValue } from "#utils/yaml.utils.js";

export class CodexAdapter extends SlashCommandAdapter {
  toolId: string = "codex";

  getFilePath(commandId: string): string {
    const filePath = path.join(
      ".codex",
      "prompts",
      `designspec-${commandId}.md`,
    );
    return filePath;
  }

  formatFile(template: SlashCommandTemplate): string {
    const { description, instructions } = template;

    return dedent`
    ---
    description: ${escapeYamlValue(description)}
    ---

    ${instructions}
    `;
  }
}
