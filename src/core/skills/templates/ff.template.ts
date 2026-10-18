import dedent from "dedent";
import type { SkillTemplate } from "../skill-templates.js";

export function getFastForwardSkillTemplate(): SkillTemplate {
  return {
    name: "desx-ff",
    description:
      "Fast-forward through DesignSpec artifact creation. Use when the user wants to quickly create every artifact required for implementation in one go, without stepping through each artifact individually.",
    instructions: dedent`
    Fast-forward through artifact creation — generate everything needed to start implementation.

    **Input**: A change name or design description may come from the current request or the preceding conversation. Reuse established requirements; ask only when the intended work or existing target is unclear.

    **Steps**

    1. **Resolve the intended work from the request and conversation**

       Use the current request together with the preceding conversation, including requirements settled during \`desx-explore\`. A bare invocation does not mean the input is missing. Do not ask the user to repeat an established goal or supply a change name when the intended work is already clear.

       The current explicit request takes precedence over earlier context. An earlier active change does not turn an explicit request for new work into continuation. Distinguish starting new work from continuing an existing change:
       - **New work**: Use an explicit kebab-case name if supplied; otherwise derive a concise name from the established requirements (e.g., "add settings notifications page" → \`add-settings-notifications\`). Naming understood work is not guessing the target of an existing change.
       - **Existing work**: Reuse an explicit name or an unambiguous current target from this conversation, including an agent-created change. Validate it against \`design-spec list --json\`, announce the name, and hand off to \`desx-continue\` with that name rather than creating a duplicate, then stop this skill. Do not ask for the name again.
       - **Unclear work or target**: Run \`design-spec list --json\` and show the active changes with their names and task progress. Ask the user to select existing work or describe new work. Use an interactive question tool if available; otherwise provide numbered candidates and allow a number, a name, or free text. Even a single candidate requires selection when context does not establish it; modification time alone is not grounds for selection or recommendation. If there are no active changes, say so and ask what they want to design, not for a nonexistent change name. Wait for clarification before creating or continuing a change.

       Check the active list before creating a directory. If an explicit existing target is missing or archived, explain that and offer the active list or a new-work description; do not silently create it as new. If a name chosen for new work collides with an existing change, ask whether to continue that change or use a distinct name. Do not reuse unrelated work solely because the names match.

       Ask only for information still needed to understand the intended work; do not require the user to author the kebab-case name. Once resolved, announce the target name and proceed without a separate naming confirmation. Write user-facing guidance in the conversation's language.

    2. **Create the change directory**
       \`\`\`bash
       design-spec new --change "<name>"
       \`\`\`
       This creates a scaffolded change at \`design-spec/changes/<name>/\` with the selected schema.

       If creation reports that the name already exists, resolve the collision as described in Step 1; never overwrite the existing change.

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

       **If writing an artifact surfaces a design decision that hasn't been made**:
       - Pause the ff sweep, switch to the Deciding stance, and resolve it with one question-tool call (Claude Code: \`AskUserQuestion\`, Grok Build: \`ask_user_question\`) before continuing.
       - Do NOT make implicit decisions and bury them in the artifact.
       - Minor wording or label choices can be decided inline — but anything that affects layout, states, slot capacity, or component shape requires a pause.

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
    - Prompt: "All artifacts created — ready for implementation. Ask me to apply the change to start working on the tasks."

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
    - Resolve existing targets and name collisions using Step 1; never overwrite an existing change or silently switch unrelated work.
    - This skill does NOT implement code. After artifacts are done, hand off to \`desx-apply\`.
    `,
  };
}
