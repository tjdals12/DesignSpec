import dedent from "dedent";
import type { SkillTemplate } from "../skill-templates.js";

export function getArchiveChangeSkillTemplate(): SkillTemplate {
  return {
    name: "desx-archive",
    description:
      "Archive a completed DesignSpec change. Use when the user wants to finalize and archive a change after implementation is complete.",
    instructions: dedent`
    Archive a completed change.

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
       Which change should I archive?

       1. host-layout — modified 2 hours ago
       2. guest-navigation — Implementation tasks: 3/8 complete · modified yesterday

       Reply with a number or describe the work in your own words.
       \`\`\`

       If there are no active changes, explain that and suggest starting new work with \`desx-new\` or \`desx-ff\`; do not keep requesting a nonexistent name or create a change within this skill. Stop until the user chooses a next action.

       Once the target is resolved and active, announce "Using change: <name>" and proceed without asking the user to confirm the name again. Write user-facing guidance in the conversation's language. Target selection does not replace the readiness checks or confirmations in the following steps.

    2. **Check artifact completion status**

       Run \`design-spec status --change "<name>" --json\` to check artifact completion.

       Parse the JSON to understand:
       - \`schemaName\`: The workflow being used
       - \`artifacts\`: List of artifacts with their status (\`done\` or other)

       **If any artifacts are not \`done\`:**
       - Display warning listing incomplete artifacts
       - Prompt user for confirmation to continue
       - Proceed if user confirms

    3. **Check task completion status**

       Read \`design-spec/changes/<name>/tasks.md\` to check for incomplete tasks.

       Count tasks marked with \`- [ ]\` (incomplete) vs \`- [x]\` (complete).

       **If incomplete tasks found:**
       - Display warning showing count of incomplete tasks
       - Prompt user for confirmation to continue
       - Proceed if user confirms

       **If no \`tasks.md\` exists:** Proceed without task-related warning.

    4. **Assess spec sync state**

       Check for spec artifacts at:
       - \`design-spec/changes/<name>/pages/*.md\`
       - \`design-spec/changes/<name>/components/*.md\`

       If neither directory has files, proceed without sync prompt.

       **If spec artifacts exist:**
       - For each \`pages/<name>.md\` and \`components/<name>.md\`, check whether the corresponding master spec at \`design-spec/specs/pages/<name>.md\` (or \`components/...\`) exists and is up to date.
       - Determine what changes would be applied (new specs to add, modifications to merge).
       - Show a combined summary before prompting.

       **Prompt options:**
       - If sync is needed: "Sync now (recommended)", "Archive without syncing"
       - If already in sync: "Archive now", "Sync anyway", "Cancel"

       If the user chooses sync, use the **Task tool** (subagent_type: "general-purpose", prompt: "Use Skill tool to invoke desx-sync for change '<name>'. Spec analysis: <include the analyzed spec summary>"). Proceed to archive after the Task completes, regardless of sync outcome.

    5. **Perform the archive**

       Create the archive directory if it doesn't exist:
       \`\`\`bash
       mkdir -p design-spec/changes/archive
       \`\`\`

       Generate target name using current date: \`YYYY-MM-DD-<change-name>\`.

       **Check if target already exists:**
       - If yes: Fail with error, suggest renaming the existing archive or using a different date.
       - If no: Move the change directory to archive.

       \`\`\`bash
       mv design-spec/changes/<name> design-spec/changes/archive/YYYY-MM-DD-<name>
       \`\`\`

    6. **Display summary**

       Show archive completion summary including:
       - Change name
       - Schema that was used
       - Archive location
       - Spec sync status (synced / sync skipped / no spec artifacts)
       - Note about any warnings (incomplete artifacts/tasks)

    **Output On Success**

    \`\`\`
    ## Archive Complete

    **Change:** <change-name>
    **Schema:** <schema-name>
    **Archived to:** design-spec/changes/archive/YYYY-MM-DD-<name>/
    **Specs:** ✓ Synced to master specs

    All artifacts complete. All tasks complete.
    \`\`\`

    **Output On Success (No Spec Artifacts)**

    \`\`\`
    ## Archive Complete

    **Change:** <change-name>
    **Schema:** <schema-name>
    **Archived to:** design-spec/changes/archive/YYYY-MM-DD-<name>/
    **Specs:** No spec artifacts to sync

    All artifacts complete. All tasks complete.
    \`\`\`

    **Output On Success With Warnings**

    \`\`\`
    ## Archive Complete (with warnings)

    **Change:** <change-name>
    **Schema:** <schema-name>
    **Archived to:** design-spec/changes/archive/YYYY-MM-DD-<name>/
    **Specs:** Sync skipped (user chose to skip)

    **Warnings:**
    - Archived with 2 incomplete artifacts
    - Archived with 3 incomplete tasks
    - Spec sync was skipped (user chose to skip)

    Review the archive if this was not intentional.
    \`\`\`

    **Output On Error (Archive Exists)**

    \`\`\`
    ## Archive Failed

    **Change:** <change-name>
    **Target:** design-spec/changes/archive/YYYY-MM-DD-<name>/

    Target archive directory already exists.

    **Options:**
    1. Rename the existing archive
    2. Delete the existing archive if it's a duplicate
    3. Wait until a different date to archive
    \`\`\`

    **Guardrails**
    - Resolve the target using Step 1. Do not repeat change selection when an explicit or unambiguous contextual target has been validated.
    - Use \`design-spec status --json\` for completion checking.
    - Don't block archive on warnings — just inform and confirm.
    - Preserve \`.design-spec.yaml\` when moving to archive (it moves with the directory).
    - Show a clear summary of what happened.
    - If sync is requested, use the **Task tool** (subagent) to invoke \`desx-sync\` — never use Skill tool directly, as it prevents the archive from continuing after sync.
    - If spec artifacts exist, always run the sync assessment and show the combined summary before prompting.
    - REMOVE of pages or components is not handled by sync. If the user mentions removals, instruct them to handle it manually after archive.
    `,
  };
}
