import dedent from "dedent";
import type { SkillTemplate } from "../skill-templates.js";

export function getContinueChangeSkillTemplate(): SkillTemplate {
  return {
    name: "desx-continue",
    description:
      "Continue working on a DesignSpec change by creating the next artifact. Use when the user wants to progress their change, create the next artifact, or continue their workflow.",
    instructions: dedent`
    Continue working on a change by creating the next artifact.

    **Input**: Optionally specify a change name. If omitted, check if it can be inferred from conversation context. If vague or ambiguous you MUST prompt for available changes.

    **Steps**

    1. **If no change name provided, prompt for selection**

       Run \`design-spec list --json\` to get available changes sorted by most recently modified. Then use the interactive question tool (Claude Code: \`AskUserQuestion\`, Grok: \`ask_user_question\`) to let the user select which change to work on.

       Present the top 3-4 most recently modified changes as options, showing:
       - Change name
       - Schema (from \`schema\` field if present, otherwise "default")
       - Status (e.g., "0/4 artifacts", "complete")
       - How recently it was modified (from \`lastModified\` field)

       Mark the most recently modified change as "(Recommended)" since it's likely what the user wants to continue.

       **IMPORTANT**: Do NOT guess or auto-select a change. Always let the user choose.

    2. **Check current status**
       \`\`\`bash
       design-spec status --change "<name>" --json
       \`\`\`
       Parse the JSON to understand current state. The response includes:
       - \`schemaName\`: The workflow schema being used (e.g., "default")
       - \`artifacts\`: Array of artifacts with their status ("done", "ready", "blocked")
       - \`isComplete\`: Boolean indicating if all artifacts are complete

    3. **Act based on status**:

       ---

       **If all artifacts are complete (\`isComplete: true\`)**:
       - Congratulate the user
       - Show final status including the schema used
       - Suggest: "All artifacts created! You can now implement this change or archive it."
       - STOP

       ---

       **If artifacts are ready to create** (status shows artifacts with \`status: "ready"\`):
       - Pick the FIRST artifact with \`status: "ready"\` from the status output
       - Get its instructions:
         \`\`\`bash
         design-spec artifact-instructions --change "<name>" --artifact <first-artifact-id> --json
         \`\`\`
       - Parse the JSON. The key fields are:
         - \`context\`: Project background (constraints for you — do NOT include in output)
         - \`rules\`: Artifact-specific rules (constraints for you — do NOT include in output)
         - \`template\`: The structure to use for your output file
         - \`instruction\`: Schema-specific guidance
         - \`outputPath\`: Where to write the artifact (may be a glob like \`pages/*.md\`)
         - \`dependencies\`: Completed artifacts to read for context
       - **Create the artifact file(s)**:
         - Read every completed dependency file for context before writing.
         - **Single-file artifact** (e.g., \`proposal.md\`, \`screens.md\`): create the one file at the output path.
         - **Multi-file artifact** (e.g., \`pages/*.md\`, \`components/*.md\`):
           - Determine the names from the relevant section of \`screens.md\` (Pages list for \`pages\`, Shared Components list for \`components\`).
           - Create one file per name, using the same template for each.
           - The instruction may also direct you to UPDATE existing artifact files (e.g., the \`components\` phase updates \`screens.md\` and \`pages/*.md\` to reflect the final component list). Follow the instruction's workflow exactly — including any back-references to earlier artifacts.
         - Use \`template\` as the structure — fill in its sections.
         - Apply \`context\` and \`rules\` as constraints when writing, but do NOT copy them into the file.
         - Write to the output path(s) specified.
       - Show what was created and what's now unlocked.
       - STOP after completing this artifact (whether it produced one file or many).

       ---

       **If no artifacts are ready (all blocked)**:
       - This shouldn't happen with a valid schema.
       - Show status and suggest checking for issues.

    4. **After creating an artifact, show progress**
       \`\`\`bash
       design-spec status --change "<name>"
       \`\`\`

    **Output**

    After each invocation, show:
    - Which artifact was created (and how many files if multi-file)
    - Schema workflow being used
    - Current progress (N/M complete)
    - What artifacts are now unlocked
    - Prompt: "Want to continue? Just ask me to continue or tell me what to do next."

    **Artifact Creation Guidelines**

    The artifact types and their purpose depend on the schema. Use the \`instruction\` field from the instructions output to understand what to create.

    **default schema** (proposal → screens → pages → components → tasks):
    - **proposal.md**: Ask the user about the change if not clear. Fill in Why, What Changes, Impact from a UI/product perspective. Keep it lightweight — per-page and per-component details belong in later artifacts.
    - **screens.md**: The index that lists every page and shared component included in this change. Each entry needs a corresponding \`pages/<name>.md\` or \`components/<name>.md\` later. The Shared Components section is an initial estimate and may be refined during the pages and components phases.
    - **pages/<page-name>.md**: Create one file per page listed in \`screens.md\`'s Pages section. Each file fixes per-page design requirements (Purpose, Displayed Information, Actions, Layout, States, Notes). If you discover a new shared component while writing pages, update \`screens.md\` to add it.
    - **components/<component-name>.md**: Read every \`pages/*.md\` first. Identify reusable patterns based on evidence, reconcile against \`screens.md\`'s initial Shared Components list (add/remove/rename), update \`screens.md\` and any \`pages/*.md\` that referenced inline details, then create one file per component in the final list.
    - **tasks.md**: Break the design into trackable implementation units. Group as Shared Components → Pages → Integration (note: implementation order is the REVERSE of design order — components are built first because pages consume them). Use \`- [ ] N.M\` checkbox format so the apply phase can track progress. Each task should reference the artifact it implements.

    For other schemas, follow the \`instruction\` field from the CLI output.

    **Guardrails**
    - Create ONE artifact per invocation. A multi-file artifact (e.g., \`pages/*.md\`) counts as one artifact even though it produces multiple files.
    - Always read dependency artifacts before creating a new one.
    - Never skip artifacts or create out of order.
    - If context is unclear, ask the user before creating.
    - Verify the artifact files exist after writing before reporting progress.
    - Use the schema's artifact sequence — don't assume specific artifact names.
    - **IMPORTANT**: \`context\` and \`rules\` are constraints for YOU, not content for the file.
      - Do NOT copy \`<context>\`, \`<rules>\`, \`<project_context>\` blocks into the artifact.
      - These guide what you write, but should never appear in the output.
    `,
  };
}
