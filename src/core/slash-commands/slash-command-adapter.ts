import type { SlashCommandTemplate } from "./slash-command-template.js";

export abstract class SlashCommandAdapter {
  abstract readonly toolId: string;
  abstract getFilePath(commandId: string): string;
  abstract formatFile(template: SlashCommandTemplate): string;
}
