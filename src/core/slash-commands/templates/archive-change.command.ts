import dedent from "dedent";
import type { SlashCommandTemplate } from "../slash-command-template.js";

export function getArchiveChangeSlashCommand(): SlashCommandTemplate {
  return {
    name: "DesignSpec: Archive",
    description: "Archive a completed change.",
    category: "Workflow",
    tags: ["workflow", "archive"],
    instructions: dedent`
      Archive a completed change.

      **Input**: Optionally specify a change name after \`/desx:archive\` (e.g., \`/desx:archive add-space-management\`). If omitted, check if it can be inferred from conversation context. If vague or ambiguous you MUST prompt for available changes.

      **Steps**

      1. **If no change name provided, prompt for selection**

         Run \`design-spec list --json\` to get available changes. Use the **AskUserQuestion tool** to let the user select.

         Show only active changes (not already archived).
         Include the schema used for each change if available.

         **IMPORTANT**: Do NOT guess or auto-select a change. Always let the user choose.

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

         If the user chooses sync, use the **Task tool** (subagent_type: "general-purpose", prompt: "Use Skill tool to invoke designspec-sync-specs for change '<name>'. Spec analysis: <include the analyzed spec summary>"). Proceed to archive after the Task completes, regardless of sync outcome.

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
      - Always prompt for change selection if not provided.
      - Use \`design-spec status --json\` for completion checking.
      - Don't block archive on warnings — just inform and confirm.
      - Preserve \`.design-spec.yaml\` when moving to archive (it moves with the directory).
      - Show a clear summary of what happened.
      - If sync is requested, use the **Task tool** (subagent) to invoke \`designspec-sync-specs\` — never use Skill tool directly, as it prevents the archive from continuing after sync.
      - If spec artifacts exist, always run the sync assessment and show the combined summary before prompting.
      - REMOVE of pages or components is not handled by sync. If the user mentions removals, instruct them to handle it manually after archive.
    `,
  };
}
