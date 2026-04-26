import dedent from "dedent";
import type { SkillTemplate } from "../skill-templates.js";

export function getNewChangeSkillTemplate(): SkillTemplate {
  return {
    name: "designspec-new-change",
    description:
      "Start a new DesignSpec change using the experimental artifact workflow. Use when the user wants to create a new feature, fix, or modification with a structured step-by-step approach.",
    instructions: dedent`
    Do some
    `,
  };
}
