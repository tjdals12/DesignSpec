import dedent from "dedent";
import type { SkillTemplate } from "../skill-templates.js";

export function getVerifyChangeSkillTemplate(): SkillTemplate {
  return {
    name: "desx-verify",
    description:
      "Verify that an implementation matches the change artifacts. Use when the user wants to validate that implementation is complete, correct, and coherent before archiving.",
    instructions: dedent`
    Verify that an implementation matches the change artifacts (\`pages/*.md\`, \`components/*.md\`, \`tasks.md\`).

    **Input**: Optionally specify a change name. If omitted, check if it can be inferred from conversation context. If vague or ambiguous you MUST prompt for available changes.

    **Steps**

    1. **If no change name provided, prompt for selection**

       Run \`design-spec list --json\` to get available changes. Use the interactive question tool (Claude Code: \`AskUserQuestion\`, Grok: \`ask_user_question\`) to let the user select.

       Show changes that have implementation tasks (\`tasks.md\` exists).
       Include the schema used for each change if available.
       Mark changes with incomplete tasks as "(In Progress)".

       **IMPORTANT**: Do NOT guess or auto-select a change. Always let the user choose.

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
         - **Displayed Information** — does the rendered output expose the listed information?
         - **Actions** — are the listed user actions wired up (handlers, navigation, mutations)?
         - **Layout** — does the structure match (sections, regions, ordering)?
         - **States** — is each listed state handled (default, loading, empty, error, etc.)?
       - If divergence detected:
         - Add WARNING: "Page implementation may diverge from spec: <details>".
         - Recommendation: "Review <file>:<lines> against \`pages/<name>.md\` <section>".

       **Per-component implementation mapping**:
       For each \`components/<name>.md\`:
       - Locate the component implementation file(s).
       - Cross-check each section (Role, Displayed Information, Actions, Layout, States).
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
