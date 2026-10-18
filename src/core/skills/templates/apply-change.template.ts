import dedent from "dedent";
import type { SkillTemplate } from "../skill-templates.js";

export function getApplyChangeSkillTemplate(): SkillTemplate {
  return {
    name: "desx-apply",
    description:
      "Implement tasks from a DesignSpec change. Use when the user wants to start implementing, continue implementation, or work through tasks.",
    instructions: dedent`
    Implement tasks from a DesignSpec change.

    **Input**: A change name is optional. Prefer an explicit name; otherwise reuse an unambiguous current change from the conversation. Ask for selection from the active change list only when the target cannot be resolved.

    **Steps**

    1. **Resolve the target change**

       Run \`design-spec list --json\` to check the currently active changes, then resolve the target in this order:
       - **Explicit name**: Use the name supplied by the user.
       - **Conversation context**: Reuse the change most recently created, selected, implemented, or verified in this conversation when it is clearly the current target and the user has not switched to another. This includes a change created by the agent during \`desx-ff\` or \`desx-new\`; the user need not repeat its name. If several targets remain plausible, treat the target as unresolved.
       - **Unresolved target**: Show the active change list and ask the user to select, even if there is only one candidate. Do not select or recommend a target merely because it was modified most recently. Wait for a valid selection before running later steps.

       Validate the resolved name against the active list. If an explicit or contextual name is missing or already archived, explain that and present the active list for selection; do not silently substitute another change.

       When selection is needed, show each active change's name, task progress (\`completedTask\` / \`totalTask\`, or no tasks defined), and last modification time from the list output. Do not invent schema or artifact progress from task counts, or hide candidates because they lack tasks or specs. Use an interactive question tool if available; otherwise provide a numbered list and invite a number, a change name, or a free-form clarification. Never ask for a change name without showing the available candidates. If tool option limits require a shorter selection, keep the remaining candidates accessible.

       If there are no active changes, explain that and suggest starting new work with \`desx-new\` or \`desx-ff\`; do not keep requesting a nonexistent name or create a change within this skill. Stop until the user chooses a next action.

       Once the target is resolved and active, announce "Using change: <name>" and proceed without asking the user to confirm the name again. Write user-facing guidance in the conversation's language. Target selection does not replace the readiness checks or confirmations in the following steps.

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
       - If \`state: "blocked"\`: show the warning and missing artifacts, suggest using the \`desx-continue\` skill to create them. STOP.
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
       - Make the code changes required by the task, following the page and component specs
       - For new data-dependent UI, provide realistic representative data and local state so the specified content, states, and interactions can be reviewed immediately
       - Preserve working data connections and behavior when modifying existing UI
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
       - If \`state: "all_done"\`: suggest archiving the change
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

    All tasks complete! You can archive this change.
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
    - Use \`<project_context>\` and development instructions to guide implementation, keeping the context block itself out of files. User-facing content follows the page and component specs. Implementation choices belong in code or developer-facing reports unless the specs explicitly require their display in the UI.
    - Update the task checkbox in \`tasks.md\` immediately after completing each task. Do not batch checkbox updates.
    - Match the exact task line when toggling \`- [ ]\` → \`- [x]\` so the parser keeps progress in sync.
    - Keep code changes minimal and scoped to each task.
    - If implementation reveals a design issue, pause and suggest updating the relevant \`pages/*.md\` or \`components/*.md\` rather than silently diverging from the spec.
    - Pause on errors, blockers, or unclear requirements — don't guess.
    - Keep going through tasks until done or blocked.
    - After the tasks are implemented, run the project's checks — lint, format, build, and tests if present — and fix failures before reporting completion. These are standard hygiene, not tracked tasks in \`tasks.md\`.

    **Fluid Workflow Integration**

    This skill supports the "actions on a change" model:

    - **Can be invoked anytime**: After the \`desx-continue\` skill produces \`tasks.md\`, after partial implementation, interleaved with other actions.
    - **Allows artifact updates**: If implementation reveals design issues, suggest updating the relevant artifact — work fluidly, not phase-locked.
    `,
  };
}
