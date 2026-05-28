import dedent from "dedent";
import type { SlashCommandTemplate } from "../slash-command-template.js";

export function getStyleInitSlashCommand(): SlashCommandTemplate {
  return {
    name: "DesignSpec: Style Init",
    description:
      "Initialize the project's style system by deriving tokens and patterns from reference products you like — saved to design-spec/styles/style.md.",
    category: "Workflow",
    tags: ["workflow", "style", "design-system", "tokens"],
    instructions: dedent`
      Initialize the project's style system by deriving design tokens and component patterns from reference products the user knows and likes. Save the result to \`design-spec/styles/style.md\`.

      **Method.** This command runs as **assistant proposes → user reacts**. The user gives a short product brief and a feel; the assistant proposes references; the user picks 1–2; the assistant derives every downstream token and pattern from those references and asks the user to confirm or adjust.

      Never ask the user to generate abstract design vocabulary from a blank prompt (metaphors, "signature elements", "defaults to reject", "physical objects in this domain"). The chosen references do that work.

      ---

      ## Asking Style (read this first)

      Every **decision question** has these four properties:

      1. One question per turn. Never bundled.
      2. 2–4 named options, mutually exclusive.
      3. Exactly one option marked as the recommendation. The recommendation must trace to an earlier answer (brief, feel, or chosen references). Never random.
      4. An "Other" escape so the user can override with a free answer.

      **Use the \`AskUserQuestion\` tool for every decision question.** Call it with:

      - \`question\` — the question text, prefixed with the phase marker (see below).
      - \`options\` — 2–4 entries with \`label\` and \`description\`. Put the recommended option **first** in the array and suffix its \`label\` with \`" (Recommended)"\`.
      - \`header\` — short label, ≤12 chars (e.g. "Reference", "Palette", "Depth").
      - \`multiSelect: true\` — only for "pick many" prompts (e.g. which atoms to define). Otherwise omit.

      The tool renders the options as a picker UI and automatically adds an "Other" choice — you do not need to add it yourself.

      **If \`AskUserQuestion\` is not in your tool list** (you are running outside Claude Code), you cannot call the tool. In that case, produce the same effect as a text message. \`AskUserQuestion\` is Claude Code's built-in tool for structured multiple-choice questions: it shows the user a question, a small set of named options with one marked as Recommended, and always lets them write a free-form "Other" answer. To reproduce that effect as text, render the decision question in exactly this format:

      \`\`\`
      [Phase N — TopicName] [Question text]

      (A) [Option label] — Recommended. [One-line reason tied to earlier answers]
      (B) [Option label] — [One-line note]
      (C) [Option label] — [One-line note]
      (D) Other — describe your own
      \`\`\`

      The user replies with the letter (A/B/C) or types a free-form override. This is the fallback path only — when \`AskUserQuestion\` is available, use the tool, not the text format.

      **Free-text questions** (brief, feel, "what to adjust" follow-ups) don't use the decision-question form — just ask in plain prose.

      **Phase marker.** Every decision question begins with \`[Phase N — TopicName]\` (e.g., \`[Phase 2 — Reference Source]\`). If a follow-up is on the same topic, keep the same marker.

      **After each free-text answer, reflect in one short line** what you heard before moving on. For decision-question (multiple-choice) answers, skip the reflection unless the user picked "Other" or there's something specific worth confirming — echoing their pick verbatim is noise.

      **Web tools.** If \`WebSearch\` / \`WebFetch\` are available, use them only to (a) find reference candidates and (b) confirm a URL resolves. Do **not** scrape CSS, fonts, or color values from reference sites. Existing knowledge of well-known brands is the primary signal. If web tools aren't available, propose references from existing knowledge.

      ---

      ## Step 0: Check Existing System

      \`\`\`bash
      cat design-spec/styles/style.md 2>/dev/null
      \`\`\`

      **If the file exists:**
      - Show a one-paragraph summary (direction, key tokens, defined patterns).
      - Decision question \`[Phase 0 — Existing]\`:
        - Question: "A style system already exists. What do you want to do?"
        - Options: "Review the current system" (Recommended) / "Update specific decisions" / "Start over from scratch"
      - Honor the choice. Never overwrite without explicit confirmation.

      **If the file does not exist:**
      - Announce the plan in one short paragraph: "I'll ask you to describe the product in 1–2 sentences and give one phrase about how it should feel. Then we'll pick 1–2 reference products to anchor the visual direction — I can suggest candidates if you want. From those references I'll propose tokens and component defaults as multiple-choice questions with a recommendation. The whole flow is about 10 questions."
      - Proceed to Phase 1.

      ---

      ## Phase 1: Brief & Feel

      ### Topic 1: Brief (free text)

      Marker: \`[Phase 1 — Brief]\`.

      Ask: "Describe this product in 1–2 sentences. What does it do, and roughly who uses it?"

      Reflect one line. Move on.

      ### Topic 2: Feel (free text with examples)

      Marker: \`[Phase 1 — Feel]\`.

      Ask: "In one short phrase, how should using this product feel? Concrete examples — 'dense like a trading floor', 'calm like a paper notebook', 'sharp like a terminal', 'warm like a stationery store'."

      If the answer is vague ("clean", "modern", "professional"), push back once: "Those words fit any product. Can you anchor it to something concrete — a physical object, a tool, a place?"

      Reflect one line. Move on.

      ---

      ## Phase 2: References

      ### Topic 1: How to source references

      Marker: \`[Phase 2 — Reference Source]\`. Decision question:

      - Question: "How do you want to pick the visual references?"
      - Options:
        - "Suggest candidates I can pick from" (Recommended) — assistant proposes 3–4 options
        - "I'll name them myself" — user types names or URLs
        - "Skip references, use only the feel description" — fastest, less coherent downstream

      ### Topic 2a — Branch: "Suggest candidates"

      Marker: \`[Phase 2 — Candidates]\`.

      1. Derive 3–4 candidate products from the brief + feel. Mix them:
         - 1 candidate from the same product category as the brief (a peer/competitor)
         - 2–3 candidates that match the *feel* but come from different categories (e.g., Linear, Bloomberg, Notion, Mercury, Vercel, Stripe — whatever fits the feel)
      2. If \`WebSearch\` is available, run a search to validate the candidates exist and refine the list. Use \`WebFetch\` only to confirm a URL resolves — do not extract design tokens from the page.
      3. Present as a decision question with \`multiSelect: true\`. Each option's \`label\` is the product name; each option's \`description\` is **one line explaining why it fits this brief**. Example: "Linear — calm SaaS register, line-based separation, similar density posture." Mark the strongest match with "(Recommended)".
      4. The user picks **1–2** references. If they pick 3+, gently flag: "Picking 3+ references often produces conflicting tokens. Want to narrow to 2?" But honor their final choice.

      ### Topic 2b — Branch: "I'll name them myself"

      Marker: \`[Phase 2 — User References]\`. Ask in free text: "Type 1–2 product names or URLs whose visual feel you want to borrow."

      For each, confirm familiarity. If unfamiliar, use \`WebFetch\` (if available) to confirm the URL resolves, then ask the user to describe its feel in one line so there's an anchor.

      ### Topic 2c — Branch: "Skip references"

      Move on. Downstream recommendations will be derived from the feel description alone.

      ---

      ## Phase 3: Direction Synthesis

      Marker: \`[Phase 3 — Direction]\`. No new question yet. Write the direction in this exact shape:

      \`\`\`
      Brief:      [echo from Phase 1]
      Feel:       [echo from Phase 1]
      References: [list, one line per reference noting what trait will be borrowed]

      Direction:  [2–3 sentences synthesizing the above. Be concrete: name the color
                  world, the density posture, the typographic register, the depth
                  strategy. This becomes the north star for every later token.]
      \`\`\`

      If Phase 2c was chosen (skip references), omit the \`References\` line and rely on \`Feel\` as the sole anchor — call this out explicitly in the Direction sentences.

      Then a decision question:

      - Question: "Does this direction match what you want?"
      - Options: "Yes, continue" (Recommended) / "Adjust one thing" / "Try a different direction"

      If "Adjust", ask what to change in free text and rewrite the Direction block, then re-ask. If "Different", go back to Phase 1/2 as directed.

      Do not move to Phase 4 until the direction is confirmed.

      ---

      ## Phase 4: Tokens

      For each topic, every recommendation must be derived from the chosen references (or the feel, if Phase 2c was chosen). State the source in the one-line reason.

      ### Topic 1: Palette — propose-and-confirm

      Marker: \`[Phase 4 — Palette]\`. Propose one palette in a code block:

      \`\`\`
      --foreground: [value]   — [one-line reason]
      --secondary:  [value]   — [reason]
      --muted:      [value]   — [reason]
      --faint:      [value]   — [reason]
      --accent:     [value]   — [reason]
      \`\`\`

      Decision question:

      - Question: "Use this palette?"
      - Options: "Yes, use as proposed" (Recommended) / "Adjust specific colors" / "Different palette entirely"

      If "Adjust", ask in free text which colors and iterate. If "Different", propose another palette anchored differently and repeat.

      ### Topic 2: Depth — discrete choice

      Marker: \`[Phase 4 — Depth]\`. Decision question:

      - Question: "Depth strategy?"
      - Options derived from references. Example shape:
        - "Borders only (1px lines, zero shadow)" — mark Recommended if references favor it
        - "Subtle shadows on raised surfaces"
        - "Layered shadows for clear elevation"

      ### Topic 3: Surfaces — discrete choice

      Marker: \`[Phase 4 — Surfaces]\`. Decision question:

      - Question: "How many background layers?"
      - Options: "1 layer (flat)" / "2 layers (paper + sheet)" / "3 layers (with raised modals)" — one Recommended based on references.

      ### Topic 4: Typography — propose-and-confirm

      Marker: \`[Phase 4 — Typography]\`. Propose 2–3 pairings. For each: name the typefaces and the signal they carry ("Inter + JetBrains Mono — neutral SaaS body, mono for tabular numbers").

      Decision question:

      - Question: "Which typography pairing?"
      - Options: 2–3 named pairings (one Recommended)

      After the pick, ask in free text: "Base size and weight set?" Propose values (e.g., "13px base, weights 400/500/600") and confirm.

      ### Topic 5: Spacing base — discrete choice

      Marker: \`[Phase 4 — Spacing]\`. Decision question:

      - Question: "Spacing base unit?"
      - Options: "4px (compressed scale)" / "8px (relaxed scale)" — one Recommended (4px for dense feels, 8px for airy feels)

      ### Topic 6: Radius — discrete choice

      Marker: \`[Phase 4 — Radius]\`. Decision question:

      - Question: "Corner radius posture?"
      - Options: "Sharp (0–2px)" / "Soft (4–8px)" / "Rounded (12px+)" — one Recommended based on references.

      ---

      ## Phase 5: Component Patterns

      ### Topic 1: Which atoms (multi-select)

      Marker: \`[Phase 5 — Atoms]\`. Decision question with \`multiSelect: true\`:

      - Question: "Which atoms do you need defined now? You can add more later."
      - Options (offer up to 4 per call; present in two passes if more are needed): Button, Input, Card, Badge, Modal, Nav, Page Container. Mark **Button**, **Input**, **Card** as Recommended baseline.

      ### Topic 2: Per-atom defaults

      For each selected atom, marker becomes \`[Phase 5 — <AtomName>]\`. Propose a default block:

      \`\`\`
      [Atom name]
        Height:  [value]
        Padding: [value]
        Radius:  [value, from Phase 4 / Radius]
        Font:    [size, weight from Phase 4 / Typography]
        States:  [default / hover / disabled — or whatever is relevant]
      \`\`\`

      Decision question:

      - Question: "Use these defaults for [Atom]?"
      - Options: "Yes" (Recommended) / "Adjust specific values" / "Skip this atom"

      Don't push to enumerate every possible component. Stop when the selected atoms are covered.

      ---

      ## Phase 6: Self-check (Token test only)

      Marker: \`[Phase 6 — Token Check]\`. Run only one check before saving.

      Read the chosen color and token names. Do they belong to the product domain or the chosen reference's vocabulary, or are they entirely generic (\`--bg-1\`, \`--gray-500\`, \`--primary\`)?

      - **Pass:** Token names carry some domain or reference meaning (e.g., \`--ink\`, \`--paper\`, \`--lamp\`, \`--gridline\`). Proceed to Phase 7.
      - **Fail:** Tokens are entirely generic. Decision question:
        - Question: "Token names are generic and don't connect to the direction. Rename them?"
        - Options: "Yes, propose domain-flavored names" (Recommended) / "Keep generic names" / "I'll rename manually"

      Swap / Squint / Signature checks are intentionally dropped — the reference-driven flow makes them either redundant (Signature) or unverifiable in text (Swap, Squint).

      ---

      ## Phase 7: Save

      Marker: \`[Phase 7 — Save]\`. Show the full preview as a single block. Decision question:

      - Question: "Save this to design-spec/styles/style.md?"
      - Options: "Save" (Recommended) / "Revise something first" / "Cancel"

      On Save, create \`design-spec/styles/\` if missing, then write:

      \`\`\`markdown
      # Style System

      ## Direction

      [2–3 sentence Direction block from Phase 3]

      ## References

      - [name] — [one-line note on what trait was borrowed]
      - [name] — [one-line note]

      ## Tokens

      ### Colors

          --foreground: [value]
          --secondary:  [value]
          --muted:      [value]
          --faint:      [value]
          --accent:     [value]

      ### Typography
      Font: [name(s)]
      Scale: [values]
      Weights: [values]

      ### Spacing
      Base: [4px | 8px]
      Scale: [values]

      ### Radius
      Scale: [values]

      ### Depth
      Strategy: [borders-only | subtle-shadows | layered-shadows]

      ### Surfaces
      Layers: [list]

      ## Patterns

      ### [Atom name]
      - Height: [value]
      - Padding: [value]
      - Radius: [value]
      - Font: [size, weight]
      - States: [list]

      ## Decisions

      | Decision | Rationale | Date |
      |----------|-----------|------|
      | [decision] | [why, tied to brief/feel/reference] | [YYYY-MM-DD] |
      \`\`\`

      Confirm: "Style system saved to \`design-spec/styles/style.md\`. It will be injected into all future artifact generation."

      ---

      ## Guardrails

      - **Propose, don't extract.** Give concrete options with a clear recommendation; don't make the user generate ideas from a blank prompt.
      - **Every recommendation must trace to an earlier answer.** Brief → feel → references → tokens. Never recommend at random; always say one line of why.
      - **One decision question per turn.** Use the \`AskUserQuestion\` tool. If it's not in your tool list, fall back to the text format defined in "Asking Style".
      - **Show phase progress.** Prefix every decision question with \`[Phase N — TopicName]\`. Same marker for follow-ups on the same topic.
      - **Free text only where it makes sense.** Brief, feel, and "what to adjust" follow-ups. Everything else is a decision question.
      - **No abstract metaphor questions.** No "what physical objects in this domain", no "single signature element", no "defaults to reject". The references handle that.
      - **Honor skip.** If the user chose "Skip references", don't try to backfill metaphors later — recommend from the feel description alone.
      - **One reflection line per answer.** Show the answer was used; don't lecture.
      - **Confirm before saving.** Always show the full preview block first.
    `,
  };
}
