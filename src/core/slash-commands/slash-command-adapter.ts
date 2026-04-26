import type { SlashCommandTemplate } from "./slasn-command-template.js";

export abstract class SlashCommandAdapter {
  abstract readonly toolId: string;
  abstract getFilePath(commandId: string): string;
  abstract formatFile(template: SlashCommandTemplate): string;
}
