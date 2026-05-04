import dedent from "dedent";
import type { SlashCommandTemplate } from "../slasn-command-template.js";

export function getApplyChangeSlashCommand(): SlashCommandTemplate {
  return {
    name: "DesignSpec: Apply",
    description: "Implement tasks from a change.",
    category: "Workflow",
    tags: ["workflow", "artifacts"],
    instructions: dedent`
      Implement tasks from a DesignSpec change.

      **Input**: Optionally specify a change name after \`/desx:apply\` (e.g., \`/desx:apply add-login\`). If omitted, check if it can be inferred from conversation context. If vague or ambiguous you MUST prompt for available changes.

      **Steps**

      1. **Select the change**

         If a name is provided, use it. Otherwise:
         - Infer from conversation context if the user mentioned a change
         - Auto-select if only one active change exists
         - If ambiguous, run \`design-spec list --json\` to get available changes and use the **AskUserQuestion tool** to let the user select

         Always announce: "Using change: <name>" and how to override (e.g., \`/desx:apply <other>\`).

      2. **Get apply instructions**
         \`\`\`bash
         design-spec apply-instructions --change "<name>" --json
         \`\`\`

         This returns:
         - \`schema\`: Schema name being used
         - \`state\`: "blocked" | "ready" | "all_done"
         - \`warning\`: Present only when blocked due to missing artifacts (\`{ message, missingArtifacts }\`)
         - \`contextFiles\`: Array of \`{ id, path }\` — files to read before implementing
         - \`progress\`: \`{ completed, total }\` — task progress
         - \`tasks\`: Array of \`{ text, completed }\` — task list with status
         - \`instruction\`: Dynamic instruction based on current state

         **Handle states:**
         - If \`state: "blocked"\`: show the warning and missing artifacts, suggest \`/desx:continue\` to create them. STOP.
         - If \`state: "all_done"\`: congratulate the user, suggest archiving. STOP.
         - If \`state: "ready"\`: proceed to implementation.

      3. **Read context files**

         Read every file listed in \`contextFiles\` from the apply instructions output.

         For the **default schema**, this typically includes:
         - \`proposal.md\` — overall change context
         - \`screens.md\` — page and component inventory
         - \`pages/*.md\` — per-page design requirements
         - \`components/*.md\` — per-component design requirements
         - \`tasks.md\` — the implementation task list

         Use \`contextFiles\` from the CLI output as the source of truth — do not assume specific filenames.

      4. **Show current progress**

         Display:
         - Schema being used
         - Progress: "N/M tasks complete"
         - Remaining tasks overview
         - The \`instruction\` from the CLI output

      5. **Implement tasks (loop until done or blocked)**

         For each pending task in \`tasks\` (where \`completed: false\`):
         - Show which task is being worked on (the task text)
         - Make the code changes required by the task
         - Keep changes minimal and focused on the task at hand
         - Mark the task complete in \`tasks.md\`: \`- [ ]\` → \`- [x]\` (match the exact task line)
         - Continue to the next task

         **Pause if:**
         - Task is unclear → ask for clarification
         - Implementation reveals a design issue → suggest updating the relevant artifact
         - Error or blocker encountered → report and wait for guidance
         - User interrupts

      6. **On completion or pause, show status**

         Re-run \`design-spec apply-instructions --change "<name>" --json\` to refresh state, then display:
         - Tasks completed this session
         - Overall progress: "N/M tasks complete"
         - If \`state: "all_done"\`: suggest \`/desx:archive\`
         - If paused: explain why and wait for guidance

      **Output During Implementation**

      \`\`\`
      ## Implementing: <change-name> (schema: <schema-name>)

      Working on task 3/7: <task text>
      [...implementation happening...]
      ✓ Task complete

      Working on task 4/7: <task text>
      [...implementation happening...]
      ✓ Task complete
      \`\`\`

      **Output On Completion**

      \`\`\`
      ## Implementation Complete

      **Change:** <change-name>
      **Schema:** <schema-name>
      **Progress:** 7/7 tasks complete ✓

      ### Completed This Session
      - [x] <task text>
      - [x] <task text>
      ...

      All tasks complete! You can archive this change with \`/desx:archive\`.
      \`\`\`

      **Output On Pause (Issue Encountered)**

      \`\`\`
      ## Implementation Paused

      **Change:** <change-name>
      **Schema:** <schema-name>
      **Progress:** 4/7 tasks complete

      ### Issue Encountered
      <description of the issue>

      **Options:**
      1. <option 1>
      2. <option 2>
      3. Other approach

      What would you like to do?
      \`\`\`

      **Implementation Order (default schema)**

      \`tasks.md\` is grouped as Shared Components → Pages → Integration. This is the REVERSE of the design order — components are built first because pages consume them. Follow the order in \`tasks.md\` exactly; do not jump ahead.

      **Guardrails**
      - Always read every file in \`contextFiles\` before starting implementation. The page and component design files (\`pages/*.md\`, \`components/*.md\`) are the contract — do not improvise UI decisions that conflict with them.
      - Use \`contextFiles\` from CLI output as authoritative — don't assume specific file names.
      - Update the task checkbox in \`tasks.md\` immediately after completing each task. Do not batch checkbox updates.
      - Match the exact task line when toggling \`- [ ]\` → \`- [x]\` so the parser keeps progress in sync.
      - Keep code changes minimal and scoped to each task.
      - If implementation reveals a design issue, pause and suggest updating the relevant \`pages/*.md\` or \`components/*.md\` rather than silently diverging from the spec.
      - Pause on errors, blockers, or unclear requirements — don't guess.
      - Keep going through tasks until done or blocked.

      **Fluid Workflow Integration**

      This skill supports the "actions on a change" model:

      - **Can be invoked anytime**: After \`/desx:continue\` produces \`tasks.md\`, after partial implementation, interleaved with other actions.
      - **Allows artifact updates**: If implementation reveals design issues, suggest updating the relevant artifact — work fluidly, not phase-locked.
    `,
  };
}
