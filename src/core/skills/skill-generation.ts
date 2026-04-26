import dedent from "dedent";

import type { SkillTemplate } from "./skill-templates.js";
import { getNewChangeSkillTemplate } from "./templates/new-change.template.js";
import type { SkillIds } from "../config.js";

export interface SkillTemplateEntry {
  id: SkillIds;
  template: SkillTemplate;
}

export function getSkillTemplates(): SkillTemplateEntry[] {
  const all: SkillTemplateEntry[] = [
    {
      id: "designspec-new-change",
      template: getNewChangeSkillTemplate(),
    },
  ];

  return all;
}

export function generateSkillContent(template: SkillTemplate): string {
  const {
    name,
    description,
    license = "MIT",
    compatibility = "Requires design-spec CLI.",
    metadata,
    instructions,
  } = template;

  return dedent`
  ---
  name: ${name}
  description: ${description}
  license: ${license}
  compatibility: ${compatibility}
  metadata:
    author: ${metadata?.author ?? "design-spec"}
    version: ${metadata?.version ?? "1.0"}
  ---

  ${instructions}
  `;
}
