import dedent from "dedent";
import type { SlashCommandTemplate } from "../slasn-command-template.js";

export function getNewChangeSlashCommand(): SlashCommandTemplate {
  return {
    name: "DesignSpec: New",
    description: "Start a new DesignSpec change using the experimental artifact workflow.",
    category: "Workflow",
    tags: ["workflow"],
    instructions: dedent`
    Do some
    `,
  };
}
