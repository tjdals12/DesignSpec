import dedent from "dedent";
import type { SkillTemplate } from "../skill-templates.js";

export function getStyleInitSkillTemplate(): SkillTemplate {
  return {
    name: "desx-style-init",
    description:
      "Initialize the project's style system by guiding through intentional design decisions — visual personality, tokens, and foundational primitives — and saving the result to design-spec/styles/style.md.",
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

    ## Question Modes

    Two kinds of question, decided by the shape of the answer space — not by phase difficulty:

    - **Open** (Phases 1, 2, 5): the user's own words are the point. Ask in prose, no options.
    - **Choice** (Step 0, Phases 3, 4, 6, 7): the answers are enumerable. Give options with exactly one marked "(Recommended)" and a one-line reason per option drawn from this conversation. If you have an interactive question tool (Claude Code: \`AskUserQuestion\`, Grok Build: \`ask_user_question\`) you must use it rather than typing the options as prose; otherwise use the numbered-list form below. A set of options is still one question, and free-form answers always win.

    Numbered-list form, for agents without a question tool:

    \`\`\`
    [Phase 4 — Topic 2/6: Depth]
    What depth strategy fits this direction?

    1. **borders-only** ⭐ Recommended — matches the cold, terminal-like feeling from Phase 1; hierarchy survives on flat surfaces
    2. subtle-shadows — softer than the direction calls for
    3. layered-shadows — consumer-app feel, at odds with the density you described

    Reply with a number or in your own words.
    \`\`\`

    ---

    ## Step 0: Check Existing System

    Before anything else:

    \`\`\`bash
    cat design-spec/styles/style.md 2>/dev/null
    \`\`\`

    **If the file exists:**
    - Show a summary of the current system (Direction, key tokens)
    - Ask as a choice question: review it / update specific decisions / start fresh. Recommend based on what you see — a sparse file suggests starting fresh, a full one suggests targeted updates.
    - Honor what the user says. Don't overwrite without confirmation.

    **If the file does not exist:**
    - Announce the plan in topic terms: "We'll go through 6 phases plus a save step. Phase 1 (Intent) covers 3 topics, Phase 2 (Domain) covers 4, Phase 3 is a direction proposal, Phase 4 (Tokens) covers 6, Phase 5 defines a few foundational primitives, Phase 6 (Self-check) runs 4 quality checks before saving. Each topic takes as many questions as it needs to be clear — I'll show topic progress on every question."
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

    Nothing to probe here. You synthesize. Show your reasoning in this format:

    \`\`\`
    Domain: [concepts from exploration that shaped this]
    Color world: [colors that exist in this domain]
    Signature: [one element specific to this product]
    Rejecting: [default 1] → [alternative], [default 2] → [alternative], [default 3] → [alternative]

    Direction: [approach that connects the above]
    \`\`\`

    Then ask as a choice question: adopt this direction / adjust something (name what feels off) — recommending adoption with a one-line reason tying it back to their own Phase 1-2 answers.

    Wait for confirmation. If they redirect, update the direction and ask again. Do not move to Phase 4 until confirmed.

    ---

    ## Phase 4: Token Decisions

    Topics: \`Palette\`, \`Depth\`, \`Surfaces\`, \`Typography\`, \`Spacing\`, \`Radius\`. Use \`[Phase 4 — Topic K/6: TopicName]\`.

    Every topic here is a **choice question**: derive 2-4 candidate values from the confirmed direction, recommend one, and give the reason each candidate fits or falls short. The user confirms, picks another, or answers free-form. Record both the value AND the reason it fits — each decision must connect back to Phase 1 (the user, the task, the feeling) or Phase 2 (the domain).

    ### Topic 1: Palette

    Propose 2-3 candidate palettes (foreground, secondary, muted, faint, accent) built from Phase 2's color world. Each candidate is one option; describe the register it carries. The user confirms one, then adjust individual values if they want.

    ### Topic 2: Depth strategy

    Options: borders-only / subtle shadows / layered shadows. Recommend the one the direction implies.

    ### Topic 3: Surfaces

    Propose candidate background-layer and elevation scales that match the chosen depth strategy.

    ### Topic 4: Typography

    Propose 2-4 candidate typefaces with scale and weights. Say why each would or wouldn't beat the system default for this product.

    ### Topic 5: Spacing

    Options: 4px base / 8px base, each with a scale. Recommend by density — connect to the Phase 1 feeling.

    ### Topic 6: Radius

    Options: sharp / soft / rounded, with concrete values. Say what each would communicate about this product.

    ---

    ## Phase 5: Foundational Primitives

    Open-ended. Use \`[Phase 5 — PrimitiveName]\` as the marker — the topic is the primitive currently being defined. The user decides when to stop.

    **Scope: primitives only, not feature components.** This phase defines the reusable atoms every screen is built from — button, input, card, badge, and the signature element from Phase 2. It does NOT enumerate feature components like a sign-up form or a transaction list. Those don't exist yet; they emerge per change, where each screen's requirements are captured. What you define here is the seed those changes reuse and extend — not a complete catalog.

    Why this phase exists: the Phase 4 tokens (spacing, radius, type scale) are abstract until something is built from them. Defining a few primitives proves the tokens compose, and gives every future change fixed dimensions to reuse instead of reinventing them — which is the drift this whole system prevents. The signature element in particular needs a concrete home here; Phase 6 checks that it actually landed somewhere.

    Start by confirming the primitive set — the handful of atoms this product leans on most, plus the signature. Then for each one, ask one at a time:

    "For [primitive], what are the height, padding, radius, font (size + weight), and any domain-specific behavior? And why does it fit the direction?"

    Keep the set small. Stop once the core primitives and the signature are defined — feature-level components are the job of changes, not this phase.

    ---

    ## Phase 6: Self-check (The Mandate)

    Topics: \`Swap\`, \`Squint\`, \`Signature\`, \`Token\`. Use \`[Phase 6 — Check K/4: TestName]\`.

    Before saving, run these 4 checks against the decisions made in Phases 1-5. For each check, state the test, apply it honestly to the current system, report pass or fail, and if it fails, ask a choice question: revisit the specific earlier decision (recommended — name which phase and topic) / accept the failure with reasoning.

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

    "Where in the foundational primitives (Phase 5) does the signature element from Phase 2 actually appear? Name at least one concrete place."

    - **Pass**: The signature appears in at least one defined primitive with specifics.
    - **Fail**: The signature was named in Phase 2 but doesn't show up anywhere in the primitives. → Offer to revisit Phase 5 to add it, or Phase 2 to reconsider the signature.

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

    Show the full system as a single confirmation block, then ask as a choice question: save to \`design-spec/styles/style.md\` (recommended) / adjust something first.

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

    ## Primitives

    ### [Primitive Name]
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
    - **Choice questions** — One "(Recommended)" option and a reason each; use the question tool if you have one (Claude Code: \`AskUserQuestion\`, Grok Build: \`ask_user_question\`), else a numbered list. Free-form answers always win.
    - **Don't default** — Every choice must be explainable. "It's common" fails.
    - **Don't rush** — This conversation sets the foundation. Spend time on it.
    - **Don't fake specificity** — Vague answers (from the user or from you) need pushback.
    - **Do connect decisions to intent** — Every token traces back to Phase 1 or Phase 2.
    - **Do confirm before saving** — Show the full system before writing the file.
    - **Do offer to extend later** — The system grows. Primitives can be added after the fact.
    `,
  };
}
