import dedent from "dedent";
import type { SkillTemplate } from "../skill-templates.js";

export function getNewChangeSkillTemplate(): SkillTemplate {
  return {
    name: "desx-new",
    description:
      "Start a new DesignSpec change using the experimental artifact workflow. Use when the user wants to create a new feature, fix, or modification with a structured step-by-step approach.",
    instructions: dedent`
    Start a new change using the experimental artifact-driven approach.

    **Input**: A change name or design description may come from the current request or the preceding conversation. Reuse established requirements; ask only when the intended work or existing target is unclear.

    **Steps**

    1. **Resolve the intended work from the request and conversation**

       Use the current request together with the preceding conversation, including requirements settled during \`desx-explore\`. A bare invocation does not mean the input is missing. Do not ask the user to repeat an established goal or supply a change name when the intended work is already clear.

       The current explicit request takes precedence over earlier context. An earlier active change does not turn an explicit request for new work into continuation. Distinguish starting new work from continuing an existing change:
       - **New work**: Use an explicit kebab-case name if supplied; otherwise derive a concise name from the established requirements (e.g., "add settings notifications page" → \`add-settings-notifications\`). Naming understood work is not guessing the target of an existing change.
       - **Existing work**: Reuse an explicit name or an unambiguous current target from this conversation, including an agent-created change. Validate it against \`design-spec list --json\`, announce the name, and hand off to \`desx-continue\` with that name rather than creating a duplicate, then stop this skill. Do not ask for the name again.
       - **Unclear work or target**: Get active change names with \`design-spec list --json\` and use them as candidates in the selection below, with an option to describe new work. Even a single candidate requires selection when context does not establish it; modification time alone is not grounds for selection or recommendation. If there are no active changes, say so and ask what they want to design, not for a nonexistent change name. Wait for clarification before creating or continuing a change.

       When selection is needed, get each candidate's artifact progress with \`design-spec status --change "<name>" --json\`. Use \`progress.done\` / \`progress.total\` to indicate whether spec writing has not started, is in progress, or is complete. Omit unavailable progress or a zero-total count. These candidate lookups are unnecessary when the target is already clear.

       **Selection presentation**

       Present numbered options following the example below, adapting the change names, statuses, and language to the current project.

       \`\`\`text
       Continue an existing change or start new work?

       1. host-layout — Specs in progress · 2/5 artifacts complete
       2. New work — Describe the pages or flows to design

       Reply with a number or describe the work in your own words.
       \`\`\`

       Check the active list before creating a directory. If an explicit existing target is missing or archived, explain that and offer the active list or a new-work description; do not silently create it as new. If a name chosen for new work collides with an existing change, ask whether to continue that change or use a distinct name. Do not reuse unrelated work solely because the names match.

       Ask only for information still needed to understand the intended work; do not require the user to author the kebab-case name. Once resolved, announce the target name and proceed without a separate naming confirmation. Write user-facing guidance in the conversation's language.

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
    - Resolve existing targets and name collisions using Step 1; never overwrite an existing change or silently switch unrelated work.
    `,
  };
}
