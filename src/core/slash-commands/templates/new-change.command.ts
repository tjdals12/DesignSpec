import dedent from "dedent";
import type { SlashCommandTemplate } from "../slasn-command-template.js";

export function getNewChangeSlashCommand(): SlashCommandTemplate {
  return {
    name: "DesignSpec: New",
    description: "Start a new DesignSpec change using the experimental artifact workflow.",
    category: "Workflow",
    tags: ["workflow"],
    instructions: dedent`
      Start a new change using the experimental artifact-driven approach.

      **Input**: The argument after \`/desx:new\` is the change name (kebab-case), OR a description of what the user wants to build.

      **Steps**

      1. **If no input provided, ask what they want to design**

         Use the **AskUserQuestion tool** (open-ended, no preset options) to ask:
         > "What design change do you want to work on? Describe the pages or shared components you want to design or update."

         From their description, derive a kebab-case name (e.g., "add space management screens" → \`add-space-management\`).

         **IMPORTANT**: Do NOT proceed without understanding what the user wants to design.

      2. **Create the change directory**
         \`\`\`bash
         design-spec new --change "<name>"
         \`\`\`
         This creates a scaffolded change at \`design-spec/changes/<name>/\` with the selected schema.

      3. **Show the artifact status**
         \`\`\`bash
         design-spec status --change "<name>"
         \`\`\`
         This shows which artifacts need to be created and which are ready (dependencies satisfied).

      4. **Get instructions for the first artifact**
         The first artifact depends on the schema. Check the status output to find the first artifact with status "ready".
         \`\`\`bash
         design-spec instructions --change "<name>" --artifact <first-artifact-id>
         \`\`\`
         This outputs the template and context for creating the first artifact.

      5. **STOP and wait for user direction**

      **Output**

      After completing the steps, summarize:
      - Change name and location
      - Schema/workflow being used and its artifact sequence
      - Current status (0/N artifacts complete)
      - The template for the first artifact
      - Prompt: "Ready to create the first artifact? Run \`/desx:continue\` or just describe the design intent for this change and I'll draft it."

      **Guardrails**
      - Do NOT create any artifacts yet - just show the instructions
      - Do NOT advance beyond showing the first artifact template
      - If the name is invalid (not kebab-case), ask for a valid name
      - If a change with that name already exists, suggest using \`/desx:continue\` instead
    `,
  };
}
