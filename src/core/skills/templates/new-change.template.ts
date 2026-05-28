import dedent from "dedent";
import type { SkillTemplate } from "../skill-templates.js";

export function getNewChangeSkillTemplate(): SkillTemplate {
  return {
    name: "designspec-new-change",
    description:
      "Start a new DesignSpec change using the experimental artifact workflow. Use when the user wants to create a new feature, fix, or modification with a structured step-by-step approach.",
    instructions: dedent`
    Start a new change using the experimental artifact-driven approach.

    **Input**: A change name (kebab-case), or a description of what the user wants to build. If neither is clear from context, ask.

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
       design-spec artifact-instructions --change "<name>" --artifact <first-artifact-id>
       \`\`\`
       This outputs the template and context for creating the first artifact.

    5. **STOP and wait for user direction**

    **Output**

    After completing the steps, summarize:
    - Change name and location
    - Schema/workflow being used and its artifact sequence
    - Current status (0/N artifacts complete)
    - The template for the first artifact
    - Prompt: "Ready to create the first artifact? Just ask me to continue, or describe the design intent for this change and I'll draft it."

    **Guardrails**
    - Do NOT create any artifacts yet - just show the instructions
    - Do NOT advance beyond showing the first artifact template
    - If the name is invalid (not kebab-case), ask for a valid name
    - If a change with that name already exists, continue with that existing change instead
    `,
  };
}
