import dedent from "dedent";
import type { SlashCommandTemplate } from "../slasn-command-template.js";

export function getStyleInitSlashCommand(): SlashCommandTemplate {
  return {
    name: "DesignSpec: Style Init",
    description:
      "Initialize the project's style system — guide through visual personality, tokens, and component patterns, then save to design-spec/styles/style.md.",
    category: "Workflow",
    tags: ["workflow", "style", "design-system", "tokens"],
    instructions: dedent`
      Initialize the project's style system. Guide the user through intentional design decisions and save the result to \`design-spec/styles/style.md\`.

      **This is a structured conversation, not a form to fill out.** Each decision must emerge from genuine reasoning about this specific product — not from defaults, templates, or "common practice."

      ---

      ## Asking Style (read this first)

      **Ask exactly ONE question per turn. Wait for the user's answer. Then ask the next.**

      Each phase is organized by **topics**, not by question count. A topic might take 1 question or 5 — whatever it takes to nail down. The progress marker reflects topics, not questions.

      - Never bundle multiple questions in one message.
      - Never present a list of questions and expect the user to answer all of them at once.
      - **Show progress on every question.** Prefix each question with a topic-based marker so the user knows where they are. Format: \`[Phase N — Topic K/total: TopicName]\`. Example: \`[Phase 1 — Topic 2/3: What]\`. For open-ended phases (Phase 5), use \`[Phase 5 — TopicName]\` without K/total.
      - **The marker tracks topic, not question.** If the user's answer is vague and you ask a follow-up on the same topic, the marker stays the same. The marker only advances when you genuinely move to the next topic.
      - **Don't rush topics.** Move on only when the current topic is genuinely clear. If 3 questions are needed to make WHO concrete, ask 3 — don't move on at question 1 just because there are more topics.
      - The bullet points under each topic are **probes** — follow-ups you can use ONLY if the user's first answer is vague. Use one probe at a time, never the whole list.
      - After each answer, briefly reflect what you heard (one line) before asking the next question.

      ---

      ## Step 0: Check Existing System

      Before anything else:

      \`\`\`bash
      cat design-spec/styles/style.md 2>/dev/null
      \`\`\`

      **If the file exists:**
      - Show a summary of the current system (Direction, key tokens)
      - Ask: "A style system already exists. Do you want to review it, update specific decisions, or start fresh?"
      - Honor what the user says. Don't overwrite without confirmation.

      **If the file does not exist:**
      - Announce the plan in topic terms: "We'll go through 6 phases plus a save step. Phase 1 (Intent) covers 3 topics, Phase 2 (Domain) covers 4, Phase 3 is a direction proposal, Phase 4 (Tokens) covers 6, Phase 5 (Component patterns) is open-ended, Phase 6 (Self-check) runs 4 quality checks before saving. Each topic takes as many questions as it needs to be clear — I'll show topic progress on every question."
      - Then proceed with Phase 1.

      ---

      ## Phase 1: Intent

      Topics: \`Who\`, \`What\`, \`Feeling\`. Use \`[Phase 1 — Topic K/3: TopicName]\` as the progress marker.

      Do not guess. Do not default. Each topic must be concrete before moving to the next. If the user's answer is vague, stay on the topic and probe further.

      ### Topic 1: Who is this human?

      Not "users." The actual person.

      A teacher grading at 7am is a different human than a developer debugging at midnight.

      Probes (one at a time, only if vague):
      - Where are they when they open this?
      - What's on their mind right before they open it?
      - What device, what context, what emotional state?

      ### Topic 2: What must they accomplish?

      Not "use the app." The verb.

      Probes (one at a time, only if vague):
      - What single action are they completing?
      - What does success look like for them?
      - What does failure cost them?

      ### Topic 3: What should this feel like?

      Concrete words with meaning. Not "clean and modern."

      Counts: "Warm like a notebook." "Cold like a terminal." "Dense like a trading floor."
      Doesn't count: "Clean." "Modern." "Professional."

      Probes (one at a time, only if vague):
      - Warm like a notebook? Cold like a terminal?
      - Dense like a trading floor? Airy like a health app?
      - Playful like a consumer product? Serious like a bank?

      ---

      ## Phase 2: Domain Exploration

      Topics: \`Concepts\`, \`Colors\`, \`Signature\`, \`Defaults to reject\`. Use \`[Phase 2 — Topic K/4: TopicName]\`.

      This is where direction emerges. Each topic requires genuine exploration — not a quick list. Push back on shallow answers and stay on the topic until it's substantial.

      ### Topic 1: Domain concepts (5 minimum)

      "List at least 5 concepts, metaphors, or vocabulary from this product's world. Not features — territory."

      Probes (one at a time, only if vague):
      - What language do people in this field use day-to-day?
      - What physical objects exist in this domain?
      - What mental models do users bring from outside the app?

      ### Topic 2: Color world (5 minimum)

      "List at least 5 colors that exist naturally in this product's domain. Not brand colors — what would you see in the physical version of this thing?"

      Probes (one at a time, only if vague):
      - What materials, environments, or objects define this domain?
      - What emotional register do those colors carry?

      ### Topic 3: Signature element (1)

      "Name one element — visual, structural, or interaction — that could ONLY exist for this product. Not a generic design pattern."

      Probes (one at a time, only if vague):
      - What metaphor from the domain could become a UI element?
      - What interaction would feel native to how users think?

      ### Topic 4: Defaults to reject (3)

      "Name 3 obvious choices for this interface type — visual or structural — that you want to reject. You can't avoid patterns you haven't named."

      ---

      ## Phase 3: Direction Proposal

      No questions here. You synthesize. Show your reasoning in this format:

      \`\`\`
      Domain: [concepts from exploration that shaped this]
      Color world: [colors that exist in this domain]
      Signature: [one element specific to this product]
      Rejecting: [default 1] → [alternative], [default 2] → [alternative], [default 3] → [alternative]

      Direction: [approach that connects the above]
      \`\`\`

      Then ask: "Does that direction feel right?"

      Wait for confirmation. If they redirect, update the direction and ask again. Do not move to Phase 4 until confirmed.

      ---

      ## Phase 4: Token Decisions

      Topics: \`Palette\`, \`Depth\`, \`Surfaces\`, \`Typography\`, \`Spacing\`, \`Radius\`. Use \`[Phase 4 — Topic K/6: TopicName]\`.

      For each topic, get both the value AND the reason it fits the direction. Each answer must connect back to Phase 1 (the user, the task, the feeling) or Phase 2 (the domain).

      ### Topic 1: Palette

      "What are the foreground, secondary, muted, faint, and accent colors? For each, why does it fit?"

      (You may guide by proposing a starting palette derived from Phase 2's color world, but the user confirms each value.)

      ### Topic 2: Depth strategy

      "Borders-only, subtle shadows, or layered shadows? Why does that fit the direction?"

      ### Topic 3: Surfaces

      "What background layers and elevation scale? Why?"

      ### Topic 4: Typography

      "Which typeface, and at what scale and weights? Why this one and not the system default?"

      ### Topic 5: Spacing

      "Base unit (4px or 8px) and scale? Why?"

      ### Topic 6: Radius

      "Sharp, soft, or rounded? What does it say about the product?"

      ---

      ## Phase 5: Component Patterns

      Open-ended. Use \`[Phase 5 — ComponentName]\` as the marker — the topic is the component currently being defined. The user decides when to stop.

      Start by asking which components matter most for this product. Then for each one the user names, ask one at a time:

      "For [component], what are the height, padding, radius, font (size + weight), and any domain-specific behavior? And why does it fit the direction?"

      Don't push to enumerate every possible component. Stop when the user says they have enough.

      ---

      ## Phase 6: Self-check (The Mandate)

      Topics: \`Swap\`, \`Squint\`, \`Signature\`, \`Token\`. Use \`[Phase 6 — Check K/4: TestName]\`.

      Before saving, run these 4 checks against the decisions made in Phases 1-5. For each check, state the test, apply it honestly to the current system, report pass or fail, and if it fails, ask the user whether to revisit a specific earlier decision.

      Do not skip checks. Do not rubber-stamp. The point of this phase is to catch defaults that slipped in.

      ### Check 1: Swap test

      "If we swapped the chosen typeface (\`[Phase 4 — Topic 4]\` value) for the system default, would anything meaningful about this system change?"

      - **Pass**: The typeface carries domain meaning or feeling; swapping breaks the intent.
      - **Fail**: The typeface is interchangeable with a default. → Offer to revisit Phase 4 / Typography.

      ### Check 2: Squint test

      "If a user blurred their vision, would the chosen depth strategy and surface elevation still preserve hierarchy without anything jumping harshly?"

      - **Pass**: Borders/shadows/contrast are calibrated so hierarchy survives blur. Nothing screams.
      - **Fail**: Harsh borders, dramatic surface jumps, or flat surfaces that lose hierarchy. → Offer to revisit Phase 4 / Depth or Surfaces.

      ### Check 3: Signature test

      "Where in the component patterns (Phase 5) does the signature element from Phase 2 actually appear? Name at least one concrete place."

      - **Pass**: The signature appears in at least one defined pattern with specifics.
      - **Fail**: The signature was named in Phase 2 but doesn't show up anywhere in the patterns. → Offer to revisit Phase 5 to add it, or Phase 2 to reconsider the signature.

      ### Check 4: Token test

      "Read the chosen color and token names out loud. Do they belong to this product's domain (Phase 2 vocabulary), or are they generic names that would fit any project?"

      - **Pass**: Token names carry domain meaning (e.g., \`--ledger-bg\`, \`--ink\`, \`--parchment\`).
      - **Fail**: Tokens are generic (\`--bg-1\`, \`--gray-500\`). → Offer to revisit Phase 4 / Palette naming.

      ---

      After all 4 checks, summarize:

      \`\`\`
      Self-check results:
      - Swap: [pass | fail — reason]
      - Squint: [pass | fail — reason]
      - Signature: [pass | fail — reason]
      - Token: [pass | fail — reason]
      \`\`\`

      If any failed, do not proceed to save until either (a) the user revisits and updates, or (b) the user explicitly accepts the failure with reasoning. Don't bypass silently.

      ---

      ## Phase 7: Save

      Show the full system as a single confirmation block, then ask: "Save this to \`design-spec/styles/style.md\`?"

      On confirmation, create \`design-spec/styles/\` if it doesn't exist, then write:

      \`\`\`markdown
      # Style System

      ## Direction

      **Personality:** [Precision & Density | Warmth & Approachability | Sophistication & Trust | Boldness & Clarity | Utility & Function | Data & Analysis]
      **Foundation:** [warm | cool | neutral | tinted]
      **Depth:** [borders-only | subtle-shadows | layered-shadows]

      ## Tokens

      ### Spacing
      Base: [4px | 8px]
      Scale: [values]

      ### Colors
      \`\`\`
      --foreground: [value]
      --secondary: [value]
      --muted: [value]
      --faint: [value]
      --accent: [value]
      \`\`\`

      ### Radius
      Scale: [values]

      ### Typography
      Font: [name]
      Scale: [values]
      Weights: [values]

      ## Patterns

      ### [Component Name]
      - Height: [value]
      - Padding: [value]
      - Radius: [value]
      - Font: [size, weight]
      - Usage: [when and how]

      ## Decisions

      | Decision | Rationale | Date |
      |----------|-----------|------|
      | [decision] | [why] | [YYYY-MM-DD] |
      \`\`\`

      Confirm: "Style system saved to \`design-spec/styles/style.md\`. It will be injected into all future artifact generation."

      ---

      ## Guardrails

      - **One question per turn** — Never bundle. Never list multiple questions in one message.
      - **Always show topic progress** — Prefix every question with \`[Phase N — Topic K/total: TopicName]\` (or \`[Phase N — TopicName]\` for open-ended phases) so the user knows where they are.
      - **Track topics, not question count** — Multiple questions on the same topic share the same marker. Advance the marker only when the topic is genuinely complete.
      - **Don't rush to the next topic** — A topic can need 1, 3, or 5 questions. Stay until it's clear.
      - **Probes are not new topics** — Bullets are follow-ups for vague answers within the current topic. Use one at a time, never the whole list.
      - **Don't default** — Every choice must be explainable. "It's common" fails.
      - **Don't rush** — This conversation sets the foundation. Spend time on it.
      - **Don't fake specificity** — Vague answers (from the user or from you) need pushback.
      - **Do connect decisions to intent** — Every token traces back to Phase 1 or Phase 2.
      - **Do confirm before saving** — Show the full system before writing the file.
      - **Do offer to extend later** — The system grows. Patterns can be added after the fact.
    `,
  };
}
