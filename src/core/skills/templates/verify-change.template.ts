import dedent from "dedent";
import type { SkillTemplate } from "../skill-templates.js";

export function getVerifyChangeSkillTemplate(): SkillTemplate {
  return {
    name: "desx-verify",
    description:
      "Verify that an implementation matches the change artifacts. Use when the user wants to validate that implementation is complete, correct, and coherent before archiving.",
    instructions: dedent`
    Verify that an implementation matches the change artifacts (\`pages/*.md\`, \`components/*.md\`, \`tasks.md\`).

    **Input**: A change name is optional. Prefer an explicit name; otherwise reuse an unambiguous current change from the conversation. Ask for selection from the active change list only when the target cannot be resolved.

    **Steps**

    1. **Resolve the target change**

       Run \`design-spec list --json\` to check the currently active changes, then resolve the target in this order:
       - **Explicit name**: Use the name supplied by the user.
       - **Conversation context**: Reuse the change most recently created, selected, implemented, or verified in this conversation when it is clearly the current target and the user has not switched to another. This includes a change created by the agent during \`desx-ff\` or \`desx-new\`; the user need not repeat its name. If several targets remain plausible, treat the target as unresolved.
       - **Unresolved target**: Use the active changes as candidates in the selection below, even if there is only one candidate. Do not select or recommend a target merely because it was modified most recently. Wait for a valid selection before running later steps.

       Validate the resolved name against the active list. If an explicit or contextual name is missing or already archived, explain that and offer the active changes through the selection below; do not silently substitute another change.

       Build the selection options from the list results, including each change's name, last modification time, and implementation task progress (\`completedTask\` / \`totalTask\`) when \`totalTask\` is greater than zero. Omit implementation progress when there are no tasks. Do not invent schema or artifact progress from task counts, or hide candidates because they lack tasks or specs.

       **Selection presentation**

       Present numbered options following the example below, adapting the change names, statuses, and language to the current project.

       \`\`\`text
       Which change should I verify?

       1. host-layout — modified 2 hours ago
       2. guest-navigation — Implementation tasks: 3/8 complete · modified yesterday

       Reply with a number or describe the work in your own words.
       \`\`\`

       If there are no active changes, explain that and suggest starting new work with \`desx-new\` or \`desx-ff\`; do not keep requesting a nonexistent name or create a change within this skill. Stop until the user chooses a next action.

       Once the target is resolved and active, announce "Using change: <name>" and proceed without asking the user to confirm the name again. Write user-facing guidance in the conversation's language. Target selection does not replace the readiness checks or confirmations in the following steps.

    2. **Check status to understand the schema**
       \`\`\`bash
       design-spec status --change "<name>" --json
       \`\`\`
       Parse the JSON to understand:
       - \`schemaName\`: The workflow being used (e.g., "default")
       - Which artifacts exist for this change

    3. **Get the change directory and load artifacts**
       \`\`\`bash
       design-spec apply-instructions --change "<name>" --json
       \`\`\`

       This returns the change directory and \`contextFiles\`. Read every file from \`contextFiles\` (proposal, screens, pages, components, tasks).

    4. **Initialize verification report structure**

       Create a report structure with three dimensions:
       - **Completeness**: Tasks done, pages and components covered
       - **Correctness**: Each page and component requirement realized in code
       - **Coherence**: Project pattern consistency, no spec drift

       Each dimension can have CRITICAL, WARNING, or SUGGESTION issues.

    5. **Verify Completeness**

       **Task Completion**:
       - Read \`tasks.md\` from \`contextFiles\`.
       - Parse checkboxes: \`- [ ]\` (incomplete) vs \`- [x]\` (complete).
       - Count complete vs total tasks.
       - If incomplete tasks exist:
         - Add CRITICAL issue for each incomplete task.
         - Recommendation: "Complete task: <task text>" or "Mark as done if already implemented".

       **Page and Component Coverage**:
       - From \`screens.md\`, list every page (Pages section) and every shared component (Shared Components section).
       - For each page in \`pages/<name>.md\`:
         - Locate its implementation file(s) in the codebase (per the path discipline in \`tasks.md\`).
         - If no implementation file exists: Add CRITICAL issue: "Page not implemented: <page-name>".
       - Same check for each component in \`components/<name>.md\`.

    6. **Verify Correctness**

       **Per-page implementation mapping**:
       For each \`pages/<name>.md\`:
       - Locate the page implementation file(s).
       - Cross-check each section:
         - **Displayed Information** — does the rendered output expose the listed information, using existing data or realistic representative data where needed? Does user-facing copy describe the product experience, with implementation details shown only when the specs require them?
         - **Actions** — do the listed user actions produce the specified UI behavior (event handlers, navigation, local state transitions)?
         - **Layout** — does the structure match (sections, regions, ordering)?
         - **States** — is each listed state handled (default, loading, empty, error, etc.)?
       - If divergence detected:
         - Add WARNING: "Page implementation may diverge from spec: <details>".
         - Recommendation: "Review <file>:<lines> against \`pages/<name>.md\` <section>".

       **Per-component implementation mapping**:
       For each \`components/<name>.md\`:
       - Locate the component implementation file(s).
       - Cross-check each section (Role, Displayed Information, Actions, Layout, States), applying the same data, user-facing copy, and UI behavior checks used for pages.
       - If divergence detected:
         - Add WARNING with specific file/line references and section.

       **State coverage**:
       For each State listed in a page or component spec, look for evidence of that state in code (conditional rendering, state variables, tests).
       - If a state appears uncovered:
         - Add WARNING: "State not covered: <state> in <page/component>-<name>".
         - Recommendation: "Implement or test the <state> state in <file>".

    7. **Verify Coherence**

       **Cross-artifact consistency**:
       - Every page in \`screens.md\`'s Pages list has a corresponding \`pages/<name>.md\`.
       - Every component in \`screens.md\`'s Shared Components list has a corresponding \`components/<name>.md\`.
       - Every \`Uses: <component>\` reference in a page points to a component that actually exists.
       - If inconsistency: Add WARNING: "Inventory drift: <details>".

       **Code pattern consistency**:
       - Review new files against the project's existing structure and naming conventions.
       - File location consistent with similar units (e.g., other pages, other components).
       - Naming follows the project's convention (PascalCase, kebab-case, etc.).
       - If significant deviation: Add SUGGESTION: "Code pattern deviation: <details>".

    8. **Generate Verification Report**

       **Summary Scorecard**:

       \`\`\`
       ## Verification Report: <change-name>

       ### Summary
       | Dimension    | Status                            |
       |--------------|-----------------------------------|
       | Completeness | X/Y tasks, P pages, C components  |
       | Correctness  | M/N pages mapped, K/L components  |
       | Coherence    | Followed / N issue(s)             |
       \`\`\`

       **Issues by Priority**:

       1. **CRITICAL** (Must fix before archive):
          - Incomplete tasks
          - Missing page or component implementations
          - Each with specific, actionable recommendation (file path or task text)

       2. **WARNING** (Should fix):
          - Spec divergences (Displayed Info, Actions, Layout, States not matching)
          - Uncovered states
          - Inventory drift between \`screens.md\` and \`pages/\`/\`components/\`
          - Each with specific recommendation

       3. **SUGGESTION** (Nice to fix):
          - Pattern inconsistencies
          - Minor improvements
          - Each with specific recommendation

       **Final Assessment**:
       - If CRITICAL issues: "X critical issue(s) found. Fix before archiving."
       - If only warnings: "No critical issues. Y warning(s) to consider. Ready for archive (with noted improvements)."
       - If all clear: "All checks passed. Ready for archive."

    **Verification Heuristics**

    - **Completeness**: Focus on objective items (checkboxes, presence of implementation files).
    - **Correctness**: Use keyword/file search and reasonable inference — don't require perfect certainty.
    - **Coherence**: Look for glaring inconsistencies, don't nitpick style.
    - **False positives**: When uncertain, prefer SUGGESTION over WARNING, WARNING over CRITICAL.
    - **Actionability**: Every issue must have a specific recommendation with file/line references where applicable.

    **Graceful Degradation**

    - If only \`tasks.md\` exists: verify task completion only, skip page/component checks.
    - If \`tasks.md\` + \`pages/*.md\` exist (no components): verify completeness and per-page correctness.
    - If full artifacts (\`pages/*.md\` + \`components/*.md\` + \`tasks.md\`): verify all three dimensions.
    - Always note which checks were skipped and why.

    **Output Format**

    Use clear markdown with:
    - Table for summary scorecard
    - Grouped lists for issues (CRITICAL/WARNING/SUGGESTION)
    - Code references in format: \`src/components/SpaceForm/SpaceForm.tsx:42\`
    - Specific, actionable recommendations
    - No vague suggestions like "consider reviewing"
    `,
  };
}
