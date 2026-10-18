import dedent from "dedent";
import type { SkillTemplate } from "../skill-templates.js";

export function getSyncSpecsSkillTemplate(): SkillTemplate {
  return {
    name: "desx-sync",
    description:
      "Sync a DesignSpec change's page and component specs into the master specs directory. Use when the user wants to update master specs from a change without archiving.",
    instructions: dedent`
    Sync a change's page and component specs into the master \`design-spec/specs/\` directory.

    This is an **agent-driven** operation — you will read the change's spec artifacts and the existing master specs, then intelligently merge to apply the change's intent without losing existing content.

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
       Which change should I sync?

       1. host-layout — modified 2 hours ago
       2. guest-navigation — Implementation tasks: 3/8 complete · modified yesterday

       Reply with a number or describe the work in your own words.
       \`\`\`

       If there are no active changes, explain that and suggest starting new work with \`desx-new\` or \`desx-ff\`; do not keep requesting a nonexistent name or create a change within this skill. Stop until the user chooses a next action.

       Once the target is resolved and active, announce "Using change: <name>" and proceed without asking the user to confirm the name again. Write user-facing guidance in the conversation's language. Target selection does not replace the readiness checks or confirmations in the following steps.

    2. **Find spec artifacts in the change**

       Look for files in:
       - \`design-spec/changes/<name>/pages/*.md\`
       - \`design-spec/changes/<name>/components/*.md\`

       If neither directory has files, inform the user that there is nothing to sync and stop.

    3. **For each spec artifact, apply changes to the master spec**

       The master specs live at:
       - \`design-spec/specs/pages/<page-name>.md\`
       - \`design-spec/specs/components/<component-name>.md\`

       For each file in the change:

       a. **Read the change's version** at \`design-spec/changes/<name>/pages/<name>.md\` (or \`components/...\`) to understand the change's intended state for this page or component.

       b. **Read the master version** at \`design-spec/specs/pages/<name>.md\` (or \`components/...\`). It may not exist yet.

       c. **Apply changes intelligently**:

          **If the master spec does not exist yet (new page or component)**:
          - Create the master spec at the target path.
          - Use the change's version as the initial content.

          **If the master spec already exists (modification)**:
          - Read both files. Identify what the change modifies vs. what the master has that the change does not mention.
          - Apply the change's modifications to the master.
          - **Preserve content in the master that the change does not contradict** — the change file may focus on what THIS change is about and not exhaustively repeat every existing detail. Do not silently drop sections (Displayed Information, Actions, Layout, States, Notes) that exist in the master but are absent in the change.
          - If a section in the change clearly **replaces** the master's version (e.g., Layout description completely rewritten), apply the replacement.
          - If a section in the change **adds to** the master's version (e.g., a new state added to States), merge.
          - When ambiguous, prefer asking the user over silently overwriting.

       d. **Read \`screens.md\` for context** at \`design-spec/changes/<name>/screens.md\` if needed to understand the change's intent (e.g., whether a component is genuinely new or being renamed).

    4. **Removals are not yet supported**

       If the user mentions that a page or component should be removed, explain that REMOVE is not handled by sync yet and ask them to leave the file in master \`specs/\` or remove it manually. Do not delete files from \`specs/\` automatically.

    5. **Show summary**

       After applying all changes, summarize:
       - Which page specs were updated (added vs. modified)
       - Which component specs were updated (added vs. modified)
       - For modified specs, briefly note what changed (e.g., "added 1 state", "rewrote Layout")

    **Output On Success**

    \`\`\`
    ## Specs Synced: <change-name>

    Updated master specs:

    **Pages**:
    - Added: \`specs/pages/space-list.md\`
    - Modified: \`specs/pages/space-detail.md\` (added 1 state, updated Actions)

    **Components**:
    - Added: \`specs/components/space-form.md\`
    - Modified: \`specs/components/space-status-badge.md\` (added 1 variant state)

    Master specs are now updated. The change remains active — archive when implementation is complete.
    \`\`\`

    **Key Principle: Intelligent Merging**

    Unlike a blind overwrite, you can apply **partial updates**:
    - The change's spec represents the **intent** of this change, not necessarily the full state of the page or component.
    - To add a new state, just include it under States in the change file — you do not need to copy every existing state.
    - Use your judgment to merge sensibly. When in doubt, surface the conflict to the user rather than silently choosing.

    **Guardrails**
    - Always read both the change version AND the master version before writing.
    - Preserve master content that the change does not contradict.
    - The operation should be idempotent — running sync twice on the same change should produce the same master state.
    - Do not delete files from \`specs/\`. Removal is out of scope for this skill.
    - Do not touch \`proposal.md\`, \`screens.md\`, or \`tasks.md\` — those stay in the change directory and are not promoted to master.
    - Show what you are changing as you go (file by file), so the user can interrupt if something looks wrong.
    `,
  };
}
