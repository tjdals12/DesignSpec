import type { CommandIds } from "../config.js";
import type { SlashCommandTemplate } from "./slasn-command-template.js";
import { getNewChangeSlashCommand } from "./templates/new-change.command.js";

export interface SlashCommandContentEntry {
  id: CommandIds;
  template: SlashCommandTemplate;
}

export function getSlashCommandTemplates(): SlashCommandContentEntry[] {
  const all: SlashCommandContentEntry[] = [
    {
      id: "new",
      template: getNewChangeSlashCommand(),
    },
  ];

  return all;
}
