import dedent from "dedent";
import type { SkillTemplate } from "../skill-templates.js";

export function getStyleInitSkillTemplate(): SkillTemplate {
  return {
    name: "desx-style-init",
    description:
      "Initialize the project's style system by guiding through intentional design decisions — visual personality, tokens, and foundational primitives — and saving the result to design-spec/styles/style.md.",
    instructions: dedent`
    Initialize the project's style system. Guide the user through intentional design decisions and save the result to \`design-spec/styles/style.md\`.

    **This is a structured conversation, not a form to fill out.** Each decision must be grounded in this product's needs and intended experience. Familiar patterns and defaults are valid when they fit; explain that fit rather than choosing them solely because they are common.

    ---

    ## Saved Document

    \`style.md\` is the project's current, reusable style guide. Save the style rules, concrete values, and concise rationale needed to apply them consistently in future UI work. Place useful rationale next to the relevant rule rather than in a separate decision log.

    Conversation history, delegation and approval details, work dates, phase-by-phase narration, self-check reports, and explanations of the workflow's scope belong in the conversation, not in the saved guide.

    Describe the design choices and constraints directly. Do not present unverified facts about users or research as established facts, or replace useful style guidance with general disclaimers about how the document was produced.

    ---

    ## Conversation and Delegation

    By default, guide the user through style decisions with relevant questions and concrete recommendations. Use information already provided in the conversation and project context. Do not ask about decisions that are already settled.

    If the user delegates some or all style decisions, make those decisions using the available context without asking for further confirmation. Delegation may be given or changed at any point in the conversation; apply it only to the delegated scope. Do not ask the user to select a conversation mode.

    The question and confirmation steps in every phase below apply only when the decision is neither settled nor delegated. Continue through settled and delegated topics without requiring an answer. Delegation covers style decisions, not product functionality, permissions, or business policy.

    Design delegation and permission to create or update the style file are separate. Follow the user's requested file operation; delegation alone does not authorize replacing an existing system.

    ---

    ## Asking Style (read this first)

    **When asking, ask exactly ONE question per turn. Wait for the user's answer. Then ask the next.**

    Each phase is organized by **topics**, not by question count. A topic might take 1 question or 5 — whatever it takes to nail down. The progress marker reflects topics, not questions.

    - Never bundle multiple questions in one message.
    - Never present a list of questions and expect the user to answer all of them at once.
    - **Show progress on every question.** Prefix each question with a topic-based marker so the user knows where they are. Format: \`[Phase N — Topic K/total: TopicName]\`. Example: \`[Phase 1 — Topic 2/3: What]\`. For open-ended phases (Phase 5), use \`[Phase 5 — TopicName]\` without K/total.
    - **The marker tracks topic, not question.** If a follow-up is needed on the same topic, the marker stays the same. The marker advances when you move to the next topic.
    - **Ask for a decision-relevant reason.** Before asking a follow-up, identify the unresolved style choice that the answer would inform. When the available information supports a grounded proposal, present that proposal and move forward.
    - The bullet points are optional prompts, not a checklist. Use one at a time only when the answer would inform an unresolved style choice. Do not request more detail solely to make a description more vivid. If the user does not know, offer examples or concrete proposals without inventing facts about users.
    - After each answer, briefly reflect what you heard (one line) before asking the next question.

    ---

    ## Question Modes

    When a question is needed, choose between these two kinds by the shape of the answer space — not by phase difficulty:

    - **Open** (Phases 1, 2, 5): start with a plain-language question and accept the user's own wording. If they need help, offer examples or concrete proposals. When presenting a choice, follow the Choice rules.
    - **Choice** (Step 0, Phases 3, 4, 6, 7): the answers are enumerable. Give options with exactly one marked "(Recommended)" and a one-line reason per option drawn from this conversation. If you have an interactive question tool (Claude Code: \`AskUserQuestion\`, Grok Build: \`ask_user_question\`) you must use it rather than typing the options as prose; otherwise use the numbered-list form below. A set of options is still one question, and free-form answers always win.

    Numbered-list form, for agents without a question tool:

    \`\`\`
    [Phase 4 — Topic 2/6: Depth]
    What depth strategy fits this direction?

    1. **borders-only** ⭐ Recommended — keeps the compact groups from Phase 1 distinct without adding elevation
    2. subtle-shadows — adds elevation the proposed flat layout does not need
    3. layered-shadows — adds stronger layering than the task hierarchy requires

    Reply with a number or in your own words.
    \`\`\`

    ---

    ## Step 0: Establish the Goal and Check Existing Styles

    First, use the conversation and project context to establish whether the user wants to document existing styles, create a new direction, or preserve specific parts while changing others.

    If this is unclear, ask one question and wait for the answer:
    "Do you want to document the existing visual style, or establish a new style direction?"

    Do not repeat a question already answered. If the user has delegated this choice, decide within that scope. Delegating individual design choices does not by itself establish whether existing styles should be preserved.

    Check for an existing guide:

    \`\`\`bash
    cat design-spec/styles/style.md 2>/dev/null
    \`\`\`

    The existence of a guide or implemented UI does not imply that its styles should be retained. Do not choose between updating and starting fresh based on the guide's length.

    Inspect style sources according to the established goal:
    - Document existing styles: inspect the existing guide and relevant UI styles, tokens, and primitives.
    - Create a new direction: design from the service context and desired experience; do not adopt existing styles as defaults.
    - Preserve specific parts: inspect and reuse only the parts identified for preservation.

    Honor the requested file operation. Only overwrite when updating or replacing the file is already authorized; do not ask again for authorization already given.

    Briefly announce the relevant remaining topics and save step, then continue with the applicable phases.

    ---

    ## Phase 1: Intent

    Topics: \`Who\`, \`What\`, \`Impression\`. Use \`[Phase 1 — Topic K/3: TopicName]\` as the progress marker.

    Use the service description and established context to make each topic concrete. Do not invent facts about the product or its users. For unresolved style decisions, offer a recommendation and ask one question at a time, or decide directly when delegated.

    ### Topic 1: Who uses this service?

    Understand the intended users' roles and relevant usage conditions. An ordinary description such as "administrators processing orders on a desktop" is useful. Do not require a vivid personal scenario.

    Follow-up questions, only when needed for a style decision:
    - What role do the main users have?
    - Which devices will they primarily use?
    - Are there usage constraints that should affect the design?

    Ask about time, place, or emotional state only when relevant to a specific design decision. Do not infer them from a user's role.

    ### Topic 2: What must they accomplish?

    Not "use the app." The verb.

    Follow-up questions, only when needed for a style decision:
    - What single action are they completing?
    - What does success look like for them?
    - What does failure cost them?

    ### Topic 3: What impression should the interface convey?

    Accept ordinary preferences such as "clean," "modern," or "professional" as useful starting points.

    Translate those preferences into concrete proposals for density, hierarchy, typography, color, and emphasis. Explain the connection and clarify only the choices that remain uncertain.

    Metaphors are welcome when the user finds them helpful, but are not required. Do not steer the user toward a particular emotional description or make them supply design terminology.

    ---

    ## Phase 2: Domain Exploration

    Topics: \`Concepts\`, \`Colors\`, \`Signature\`, \`Patterns to reconsider\`. Use \`[Phase 2 — Topic K/4: TopicName]\`.

    This is where direction emerges. Explore each topic using the available context. When clarification is needed for a decision the user has not delegated, probe one question at a time; otherwise develop the direction directly.

    Proceed when the exploration provides concrete reasons for the proposed palette, density, typography, and overall direction. Do not generate extra items merely to satisfy a count.

    Use domain metaphors and emotional associations as optional aids. Do not require the user to invent them. The agent may propose relevant visual references and explain their design implications. Ask a follow-up only when it helps resolve a style choice.

    ### Topic 1: Domain concepts

    Explore concepts, metaphors, and vocabulary that can inform the style direction. Use relevant examples without requiring a fixed count.

    Optional prompts, only when relevant to an unresolved style choice:
    - What language do people in this field use day-to-day?
    - What physical objects exist in this domain?
    - What mental models do users bring from outside the app?

    ### Topic 2: Color world

    Explore colors and visual associations relevant to the product and intended experience. Use them to explain palette choices without requiring a fixed count or a literal physical-world metaphor.

    Optional prompts, only when relevant to an unresolved style choice:
    - What materials, environments, or objects define this domain?
    - Propose palette examples and explain the impression each creates in plain language. Ask which fits the desired experience only when that preference is unresolved.

    ### Topic 3: Signature element

    Consider whether a distinctive visual, structural, or interaction element would improve the product experience. Adopt one when useful; do not invent one merely to make the product unique.

    Optional prompts, only when relevant to an unresolved style choice:
    - What metaphor from the domain could become a UI element?
    - What interaction would feel native to how users think?

    ### Topic 4: Patterns to reconsider

    Identify familiar visual or structural patterns that would work poorly for this product, and explain why. Retain suitable patterns; do not require a fixed number of rejections.

    ---

    ## Phase 3: Direction Proposal

    Nothing to probe here. You synthesize. Show your reasoning in this format:

    \`\`\`
    Domain: [concepts from exploration that shaped this]
    Color world: [colors that exist in this domain]
    Signature, if adopted: [element and the benefit it provides]
    Patterns reconsidered, if any: [pattern] → [alternative and reason]

    Direction: [approach that connects the above]
    \`\`\`

    Omit the optional Signature and Patterns reconsidered lines when they do not apply.

    If the direction is neither settled nor delegated, ask as a choice question: adopt this direction / adjust something (name what feels off) — recommending adoption with a one-line reason tying it back to the Phase 1-2 context.

    Wait for the answer when asking. If the user redirects, update the direction. When the direction is settled or delegated, explain the rationale and proceed to Phase 4 without another confirmation.

    ---

    ## Phase 4: Token Decisions

    Topics: \`Palette\`, \`Depth\`, \`Surfaces\`, \`Typography\`, \`Spacing\`, \`Radius\`. Use \`[Phase 4 — Topic K/6: TopicName]\`.

    Reuse settled token decisions. For each remaining topic, derive concrete values from the established direction. If the decision is delegated, choose and explain the values directly. Otherwise, ask a **choice question** with 2-4 candidates, recommend one, and explain why each fits or falls short; the user may choose or answer free-form. Record both the value AND the reason it fits — each decision must connect back to Phase 1 (the user, the task, the intended impression) or Phase 2 (the domain).

    For adopted tokens and scales, define concrete values (including units where required) and their intended roles or usage. Use defined token references where appropriate. Carry these decisions into the saved guide; do not leave values only in the conversation or invent an unused token catalog to fill the template.

    ### Topic 1: Palette

    Build the palette (foreground, secondary, muted, faint, accent) from Phase 2's color world. When asking, propose 2-3 candidates and describe the register each carries. When settled or delegated, proceed with the chosen values.

    Record the adopted color names, values, and roles. Include additional roles, such as status colors, only when the chosen system needs them.

    ### Topic 2: Depth strategy

    Options: borders-only / subtle shadows / layered shadows. Recommend the one the direction implies.

    Define the border widths, styles, and color references used by the chosen strategy, and any shadow values and their usage. Record an intentional absence, such as no shadows, explicitly. The strategy name alone is not enough to reproduce the result.

    ### Topic 3: Surfaces

    Propose candidate background-layer and elevation scales that match the chosen depth strategy.

    For each adopted surface layer, record its background value or defined color reference and where it is used. Map any elevation to the corresponding depth definitions.

    ### Topic 4: Typography

    Propose 2-4 suitable typeface options with scale and weights, including the system default when appropriate. Compare their fit for the product's language, reading tasks, information density, and intended impression.

    Define the font family and fallback stack, and the size, weight, and line-height for the text roles the system uses. Preserve any additional typography decisions, such as letter-spacing, when adopted.

    ### Topic 5: Spacing

    Options: 4px base / 8px base, each with a scale. Recommend by density — connect to the Phase 1 tasks and intended impression.

    ### Topic 6: Radius

    Options: sharp / soft / rounded, with concrete values. Say what each would communicate about this product.

    ---

    ## Phase 5: Foundational Primitives

    Open-ended. Use \`[Phase 5 — PrimitiveName]\` as the marker when asking — the topic is the primitive currently being defined. Let the user refine the set, or choose a sufficient small set when delegated.

    **Scope: primitives only, not feature components.** This phase defines the reusable atoms every screen is built from — button, input, card, badge, and any signature element adopted in Phase 2. It does NOT enumerate feature components like a sign-up form or a transaction list. Those don't exist yet; they emerge per change, where each screen's requirements are captured. What you define here is the seed those changes reuse and extend — not a complete catalog.

    Why this phase exists: the Phase 4 tokens (spacing, radius, type scale) are abstract until something is built from them. Defining a few primitives proves the tokens compose, and gives every future change fixed dimensions to reuse instead of reinventing them — which is the drift this whole system prevents. If a signature element was adopted, define where and how it appears in the primitives. Phase 6 checks that application.

    Propose the primitive set — the handful of atoms this product leans on most, plus any adopted signature — and concrete dimensions based on the direction and tokens. Reuse settled decisions and make delegated decisions directly. For unresolved decisions the user has not delegated, ask one at a time:

    "For [primitive], what are the height, padding, radius, font (size + weight), and any domain-specific behavior? And why does it fit the direction?"

    Express primitive styles using the adopted tokens and typography roles where possible. Save any additional primitive-specific values that were chosen, and ensure referenced tokens are defined in the guide.

    Keep the set small. Stop once the core primitives and any adopted signature are defined — feature-level components are the job of changes, not this phase.

    ---

    ## Phase 6: Self-check (The Mandate)

    Document check topics: \`Typography\`, \`Surfaces and depth\`, \`Signature\`, \`Tokens\`. Use \`[Phase 6 — Check K/4: TestName]\` for these checks.

    Before saving, complete the document checks below. Report what was checked and the evidence for each result.

    ### Check 1: Typography

    Check that font families, fallbacks, and the size, weight, and line-height of adopted text roles are defined and consistent. This does not establish actual rendered readability.

    ### Check 2: Surfaces and depth

    Check that surface layers, borders, and shadows are defined and consistent with the chosen depth strategy. Intentional absences, such as no shadows, must be explicit.

    ### Check 3: Signature

    If adopted, check that its application is defined in the primitives. Otherwise, report not applicable.

    ### Check 4: Tokens

    Check that roles are clear, usage is consistent, and referenced tokens are defined. Semantic names such as \`--foreground\` and \`--accent\` are valid.

    Missing required values, undefined references, and contradictory rules are failures, not unverified results.

    ### Additional visual verification

    When an inspectable rendering reflects the proposed style, review its actual readability and visual hierarchy, including the squint test where useful. Identify the rendering reviewed.

    Do not use an existing screen that does not reflect the proposed style as evidence. Do not implement application code solely to satisfy this check.

    If no relevant rendering is available, report visual verification as not verified. Do not infer a visual pass from the document alone.

    Report measurements only when actually performed, stating the method, criterion, and result.

    ### Results

    - **Pass**: The stated criterion was checked and supported by evidence.
    - **Fail**: A specific omission, contradiction, or unmet criterion was found.
    - **Not verified**: The evidence needed to judge the result was unavailable.
    - **Not applicable**: The check has no target, such as an unadopted signature.

    Summarize in the conversation, not in \`style.md\`:

    \`\`\`
    Document checks:
    - Typography: [pass | fail — evidence]
    - Surfaces and depth: [pass | fail — evidence]
    - Signature: [pass | fail | not applicable — evidence or reason]
    - Tokens: [pass | fail — evidence]

    Additional verification:
    - Visual review: [pass | fail | not verified — artifact and scope, or reason]
    - Measurements, if relevant: [pass | fail | not verified — method and result, or reason]
    \`\`\`

    Resolve document failures before saving. Revise and recheck within the delegated scope; otherwise clarify the unresolved decision with the user. Report a blocker if it cannot be resolved within that scope.

    Unavailable visual evidence alone does not block saving a complete and consistent guide. Report the unverified scope explicitly.

    For a confirmed visual or measurement failure, revise the relevant decision and recheck, or obtain the user's explicit acceptance of the remaining issue. Delegation alone is not acceptance of failure.

    ---

    ## Phase 7: Save

    Present the complete style system before saving. If the user has already authorized creating or updating the file and the applicable style decisions are settled or delegated, save without asking for the same authorization again. Otherwise, ask as a choice question: save to \`design-spec/styles/style.md\` (recommended) / adjust something first.

    Before writing, confirm that the document checks are complete and report additional verification separately. Saving the guide does not mean its rendered UI has been verified.

    Before writing, review the document against the Saved Document rules. Keep only applicable style guidance and useful rationale; remove process records, self-check reports, and unsupported claims about users or research. Keep necessary explanations in the conversation.

    Compare the document with the decisions made in Phases 4-5. Preserve every adopted value and its usage, including surface layers, border and shadow definitions, typography roles, and primitive-specific choices. Resolve undefined token references and missing values before saving, following the Conversation and Delegation rules.

    Use the structure below, adding concise rationale beside the relevant rule where it helps future UI decisions. The Spacing rationale illustrates placement; omit rationale that adds no useful guidance.

    Include only the tokens, layers, and text roles actually adopted. Add fields for other chosen values when needed; omit unused fields and subsections. Record intentional absences explicitly rather than filling them with invented values.

    Once saving is authorized, create \`design-spec/styles/\` if it doesn't exist, then write:

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
    Rationale: [why this spacing fits the intended density and use]

    ### Colors
    | Token | Value | Usage |
    |-------|-------|-------|
    | [adopted color name] | [value] | [role] |

    ### Surfaces
    | Layer | Background | Usage |
    |-------|------------|-------|
    | [adopted layer] | [value or defined color reference] | [where used; depth reference if applicable] |

    ### Depth
    Borders: [adopted named widths, styles, color references, and usage; or none]
    Shadows: [adopted named shadow values and usage; or none]

    ### Radius
    Scale: [values]

    ### Typography
    Font family: [name or stack]
    Fallbacks: [fallback stack]

    | Text role | Size | Weight | Line-height | Usage |
    |-----------|------|--------|-------------|-------|
    | [adopted role] | [value] | [value] | [value] | [where used] |

    ## Primitives

    ### [Primitive Name]
    - Height: [value]
    - Padding: [value]
    - Radius: [value]
    - Font: [defined typography role or family, size, weight, and line-height]
    - Usage: [when and how]
    - Additional styles: [other adopted values or defined token references, when needed]
    \`\`\`

    Confirm: "Style system saved to \`design-spec/styles/style.md\`. It will be injected into all future artifact generation."

    ---

    ## Guardrails

    - **One question per turn** — When asking, ask exactly one question and wait for the answer. Never bundle. Never list multiple questions in one message.
    - **Reuse decisions and honor delegation** — Apply the Conversation and Delegation rules throughout every phase. Ask only about unresolved decisions outside the delegated scope.
    - **Always show topic progress** — Prefix every question with \`[Phase N — Topic K/total: TopicName]\` (or \`[Phase N — TopicName]\` for open-ended phases) so the user knows where they are.
    - **Track topics, not question count** — Multiple questions on the same topic share the same marker. Advance the marker only when the topic is genuinely complete.
    - **Ask only useful follow-ups** — Identify the style choice an answer would inform. Proceed with a grounded proposal when enough information is available; do not seek detail merely for a vivid description.
    - **Prompts are optional** — Use one relevant follow-up at a time, never the whole list. Help with examples or concrete proposals when needed.
    - **Choice questions** — One "(Recommended)" option and a reason each; use the question tool if you have one (Claude Code: \`AskUserQuestion\`, Grok Build: \`ask_user_question\`), else a numbered list. Free-form answers always win.
    - **Justify choices** — Explain how each choice fits the product. Familiar patterns and defaults are acceptable; popularity alone is not a sufficient reason.
    - **Don't rush** — This conversation sets the foundation. Spend time on it.
    - **Don't fake specificity** — Do not invent product or user facts. Clarify unresolved decisions outside the delegated scope; make grounded style choices within it.
    - **Do connect decisions to intent** — Every token traces back to Phase 1 or Phase 2.
    - **Save a guide, not a process report** — Apply the Saved Document rules before writing. Keep useful rationale beside the relevant rule and report work history and self-check results in the conversation.
    - **Honor save authorization** — Show the full system before writing the file, and follow Phase 7 without repeating authorization already given.
    - **Do offer to extend later** — The system grows. Primitives can be added after the fact.
    `,
  };
}
