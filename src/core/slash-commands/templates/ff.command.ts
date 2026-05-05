import dedent from "dedent";
import type { SlashCommandTemplate } from "../slasn-command-template.js";

export function getFastForwardSlashCommand(): SlashCommandTemplate {
  return {
    name: "DesignSpec: Fast Forward",
    description: "Create a change and generate every artifact needed for implementation in one go.",
    category: "Workflow",
    tags: ["workflow", "artifacts", "experimental"],
    instructions: dedent`
      Fast-forward through artifact creation — generate everything needed to start implementation.

      **Input**: The argument after \`/desx:ff\` is the change name (kebab-case), OR a description of what the user wants to design or build.

      **Steps**

      1. **If no input provided, ask what they want to design**

         Use the **AskUserQuestion tool** (open-ended, no preset options) to ask:
         > "What design change do you want to work on? Describe the pages, flows, or shared components you want to design or update."

         From their description, derive a kebab-case name (e.g., "add settings notifications page" → \`add-settings-notifications\`).

         **IMPORTANT**: Do NOT proceed without understanding what the user wants to design. Reasonable assumptions about scope are fine; guesses about the change name are not.

      2. **Create the change directory**
         \`\`\`bash
         design-spec new --change "<name>"
         \`\`\`
         This creates a scaffolded change at \`design-spec/changes/<name>/\` with the selected schema.

         If a change with that name already exists, ask whether to continue it (use \`/desx:continue\`) or pick a different name. Do NOT overwrite.

      3. **Get the artifact build order**
         \`\`\`bash
         design-spec status --change "<name>" --json
         \`\`\`
         Parse the JSON. The key fields are:
         - \`applyRequires\`: Artifact IDs that must be \`"done"\` before implementation can start.
         - \`artifacts\`: Array of \`{ id, status, missingDeps }\` — current state of every artifact.

         Use the **TaskCreate tool** to track progress through artifacts. Add one task per artifact ID in build order.

      4. **Loop: create artifacts until every \`applyRequires\` artifact is \`"done"\`**

         Each iteration:

         a. **Find the next ready artifact**
            From the latest \`status --json\` output, pick the FIRST artifact with \`status: "ready"\`.

            If every \`applyRequires\` artifact already has \`status: "done"\`, stop the loop — implementation can start.

            If no artifact is \`"ready"\` but \`applyRequires\` still has unfinished entries, surface the status and stop — the schema is in an inconsistent state.

         b. **Get instructions for that artifact**
            \`\`\`bash
            design-spec artifact-instructions --change "<name>" --artifact <id> --json
            \`\`\`
            The JSON includes:
            - \`context\`: Project background (constraints for you — do NOT include in output)
            - \`rules\`: Artifact-specific rules (constraints for you — do NOT include in output)
            - \`template\`: The structure to fill in for your output file
            - \`instruction\`: Schema-specific guidance for this artifact type
            - \`outputPath\`: Where to write (may be a glob like \`pages/*.md\`)
            - \`dependencies\`: Completed artifacts to read for context

         c. **Read every completed dependency file** before writing.

         d. **Create the artifact file(s)**:
            - **Single-file artifact** (e.g., \`proposal.md\`, \`screens.md\`, \`tasks.md\`): write the one file at the output path.
            - **Multi-file artifact** (e.g., \`pages/*.md\`, \`components/*.md\`):
              - Determine the names from the relevant section of \`screens.md\` (Pages list for \`pages\`, Shared Components list for \`components\`).
              - Create one file per name, using the same template for each.
              - The instruction may also direct you to UPDATE earlier artifacts (e.g., the \`components\` phase reconciles \`screens.md\` and the \`pages/*.md\` files). Follow the instruction's workflow exactly.
            - Use \`template\` as the structure — fill in its sections.
            - Apply \`context\` and \`rules\` as constraints when writing, but do NOT copy them into the file.

         e. **Refresh status and continue**
            - Re-run \`design-spec status --change "<name>" --json\` to refresh artifact statuses.
            - Update the matching task to \`completed\` via TaskUpdate.
            - Show a short progress line: \`✓ Created <artifact-id>\`.
            - Loop back to (a).

         **If an artifact requires user input** (scope, naming, or design choice that materially shapes the artifact):
         - Use the **AskUserQuestion tool** to clarify before writing.
         - Prefer making a reasonable decision and noting it inline (in the artifact) over stalling on every minor uncertainty — this command's value is momentum.

      5. **Show final status**
         \`\`\`bash
         design-spec status --change "<name>"
         \`\`\`

      **Output**

      After completing every required artifact, summarize:
      - Change name and location (\`design-spec/changes/<name>/\`)
      - Schema being used
      - Artifacts created (with brief one-line descriptions)
      - Final progress (N/N artifacts complete)
      - Prompt: "All artifacts created — ready for implementation. Run \`/desx:apply\` to start working on the tasks."

      **Artifact Creation Guidelines (default schema)**

      The default schema is \`proposal → screens → pages → components → tasks\`:

      - **proposal.md**: Fill in Why, What Changes, Impact from a UI/product perspective. Keep it lightweight — per-page and per-component details belong in later artifacts.
      - **screens.md**: List every page and shared component included in this change. Each entry needs a corresponding \`pages/<name>.md\` or \`components/<name>.md\` later. The Shared Components section is an initial estimate that the components phase will reconcile.
      - **pages/<page-name>.md**: One file per page in \`screens.md\`. Cover Purpose, Displayed Information, Actions, Layout, States, Notes. If you discover a new shared component while writing pages, update \`screens.md\`.
      - **components/<component-name>.md**: Read every \`pages/*.md\` first. Identify reusable patterns based on evidence, reconcile against \`screens.md\`'s initial Shared Components list (add/remove/rename), update \`screens.md\` and any \`pages/*.md\` that referenced inline details, then create one file per component in the final list.
      - **tasks.md**: Group as Shared Components → Pages → Integration (note: the implementation order is the REVERSE of design order — components are built first because pages consume them). Use \`- [ ] N.M\` checkbox format so the apply phase can track progress.

      For other schemas, follow the \`instruction\` field from \`design-spec artifact-instructions\` for each artifact.

      **Guardrails**
      - Create EVERY artifact required for implementation — stop only when \`apply-instructions\` reports \`state\` is \`"ready"\` or \`"all_done"\`.
      - Always read dependency artifacts before creating a new one.
      - Never skip artifacts or create out of order. The build order comes from \`status --json\`.
      - Verify each artifact file exists after writing before moving to the next.
      - Prefer reasonable decisions over stalling, but ask the user when scope is genuinely unclear.
      - **\`context\` and \`rules\` are constraints for YOU, not content for the file** — do NOT copy \`<context>\`, \`<rules>\`, or \`<project_context>\` blocks into any artifact.
      - If a change with the chosen name already exists, redirect to \`/desx:continue\` instead of overwriting.
      - This command does NOT implement code. After artifacts are done, hand off to \`/desx:apply\`.
    `,
  };
}
