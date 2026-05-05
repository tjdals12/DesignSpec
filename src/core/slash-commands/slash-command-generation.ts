import type { CommandIds } from "../config.js";
import type { SlashCommandTemplate } from "./slasn-command-template.js";
import { getApplyChangeSlashCommand } from "./templates/apply-change.command.js";
import { getArchiveChangeSlashCommand } from "./templates/archive-change.command.js";
import { getContinueChangeSlashCommand } from "./templates/continue-change.command.js";
import { getFastForwardSlashCommand } from "./templates/ff.command.js";
import { getNewChangeSlashCommand } from "./templates/new-change.command.js";
import { getSyncSpecsSlashCommand } from "./templates/sync-specs.command.js";
import { getExploreSlashCommand } from "./templates/explore.command.js";
import { getVerifyChangeSlashCommand } from "./templates/verify-change.command.js";
import { getStyleInitSlashCommand } from "./templates/style-init.command.js";

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
    {
      id: "continue",
      template: getContinueChangeSlashCommand(),
    },
    {
      id: "ff",
      template: getFastForwardSlashCommand(),
    },
    {
      id: "apply",
      template: getApplyChangeSlashCommand(),
    },
    {
      id: "sync",
      template: getSyncSpecsSlashCommand(),
    },
    {
      id: "archive",
      template: getArchiveChangeSlashCommand(),
    },
    {
      id: "verify",
      template: getVerifyChangeSlashCommand(),
    },
    {
      id: "explore",
      template: getExploreSlashCommand(),
    },
    {
      id: "style-init",
      template: getStyleInitSlashCommand(),
    },
  ];

  return all;
}
