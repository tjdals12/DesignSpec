import dedent from "dedent";

import type { SkillTemplate } from "./skill-templates.js";
import { getApplyChangeSkillTemplate } from "./templates/apply-change.template.js";
import { getArchiveChangeSkillTemplate } from "./templates/archive-change.template.js";
import { getContinueChangeSkillTemplate } from "./templates/continue-change.template.js";
import { getNewChangeSkillTemplate } from "./templates/new-change.template.js";
import { getSyncSpecsSkillTemplate } from "./templates/sync-specs.template.js";
import { getVerifyChangeSkillTemplate } from "./templates/verify-change.template.js";
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
    {
      id: "designspec-continue-change",
      template: getContinueChangeSkillTemplate(),
    },
    {
      id: "designspec-apply-change",
      template: getApplyChangeSkillTemplate(),
    },
    {
      id: "designspec-sync-specs",
      template: getSyncSpecsSkillTemplate(),
    },
    {
      id: "designspec-archive-change",
      template: getArchiveChangeSkillTemplate(),
    },
    {
      id: "designspec-verify-change",
      template: getVerifyChangeSkillTemplate(),
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
