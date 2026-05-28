<p align="center">
  <img src="assets/banner.webp" alt="DesignSpec" width="100%">
</p>

<p align="center">
  <a href="README.md">English</a> | <a href="README.ko.md">한국어</a>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@tjdals12/design-spec"><img src="https://img.shields.io/npm/v/@tjdals12/design-spec" alt="npm version"></a>
  <a href="https://www.npmjs.com/package/@tjdals12/design-spec"><img src="https://img.shields.io/npm/dm/@tjdals12/design-spec" alt="downloads"></a>
  <a href="https://github.com/tjdals12/DesignSpec/actions/workflows/ci.yml"><img src="https://github.com/tjdals12/DesignSpec/actions/workflows/ci.yml/badge.svg?branch=main" alt="CI"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-blue.svg" alt="License: MIT"></a>
</p>

<p align="center">
  <strong>Does your agent build the same screen differently every time?</strong>
</p>

Hand a front-end task to an AI agent and you notice it quickly: ask for the same thing twice and you get two different screens. What information shows up, which buttons appear, how the layout comes together — it all shifts from one run to the next.

DesignSpec makes the result predictable. You pin down what a screen should be before any code is written, so the agent builds to that spec instead of improvising. Decide up front what to show, what users can do, and how it's laid out, and the screen you pictured is the screen you get.

It also locks in the visual style — color, spacing, typography — so screens don't drift apart from one to the next.

## Getting Started

**Requires Node.js 22.13 or higher.**

Install DesignSpec globally:

```bash
npm install -g @tjdals12/design-spec
```

For prerelease versions:

```bash
npm install -g @tjdals12/design-spec@next
```

Move into your project and initialize it:

```bash
cd your-project
design-spec init --tools=all
```

Use `--tools` to choose which agents to set up — `all` for every agent, or a comma-separated list like `claude,codex` for a subset. Supported agents:

| Agent       | `--tools` value |
| ----------- | --------------- |
| Claude Code | `claude`        |
| Codex       | `codex`         |

`init` generates the slash commands your agent will use. See [Workflow](#workflow) for how a change actually flows.

## Workflow

Say you're building a sign-up screen.

**Once:**

```text
/desx:style-init
```

**When you need it:**

```text
/desx:explore
```

**Per change:**

```text
/desx:new → (/desx:continue | /desx:ff) → /desx:apply → /desx:verify → /desx:sync → /desx:archive
```

Start with `/desx:style-init` to set the project's style guideline once — everything afterward follows it.

If you're not yet sure what to build, `/desx:explore` lets you think it through first.

`/desx:new` starts a change, and you capture each screen's requirements as artifacts — `/desx:continue` to go one at a time, or `/desx:ff` to generate them in a single pass. A sign-up change ends up looking like this:

```text
design-spec/changes/add-signup/
├── proposal.md
├── screens.md
├── pages/
│   └── signup.md
├── components/
│   └── signup-form.md
└── tasks.md
```

Once the requirements are in place, `/desx:apply` implements them and `/desx:verify` checks the result against the artifacts. Finally, `/desx:sync` folds the change's specs into the master specs and `/desx:archive` files the finished change away.

Because the requirements are fixed before implementation starts, the screen comes out the way you intended.

## Structure

DesignSpec keeps everything under `design-spec/`, split into two areas:

- `changes/` — work in progress. One change is one unit of work, holding the related screens and shared components together.
- `specs/` — where confirmed design specs accumulate. When a change is done, its result lands here and becomes the project's current design baseline.

A single change is made up of these artifacts:

```text
design-spec/changes/<change-name>/
├── proposal.md      # why this change is needed
├── screens.md       # which pages and shared components are included
├── pages/           # design requirements per page
│   └── <page>.md
├── components/      # design requirements per shared component
│   └── <component>.md
└── tasks.md         # implementation checklist
```

- **proposal.md** — why the change is needed, kept light: Why / What Changes / Impact.
- **screens.md** — the list of pages and shared components included in the change.
- **pages/\*.md** — per-page requirements: what to show, what actions to offer, how it's laid out, and which states to handle.
- **components/\*.md** — requirements for components shared across pages.
- **tasks.md** — an implementation checklist built from the artifacts above.

## Project Context

`init` also creates `design-spec/config.yaml`. Use it for the background an agent should know when designing and building screens — what the service is, the domain it lives in, and so on. Anything you put here is injected into the context every time an artifact is written or implemented. Tech stack and coding rules belong better in files like `CLAUDE.md` or `AGENTS.md`.

- `context` — short notes written directly in the file. A service overview, domain terms, and the like.
- `contextFiles` — paths to existing markdown files, pulled in as-is.

```yaml
context: |
  A budgeting app. Users log expenses and manage a monthly budget.
  Key terms: transaction, category, budget.

contextFiles:
  - docs/service-overview.md
```

Run `design-spec context` to see the resolved result.

## Commands & Skills

You invoke these in your AI assistant's chat. Each one ships as both a slash command and a skill; the name in parentheses is the matching skill.

### `/desx:style-init`

Builds the project's style guideline through a conversation. It settles on color, spacing, and typography, saves them under `design-spec/styles/`, and injects them into every artifact and implementation afterward. Run once per project. (skill: `designspec-style-init`)

```text
/desx:style-init
```

### `/desx:explore`

Think through ideas and sharpen requirements when you're not yet sure what to build. (skill: `designspec-explore`)

```text
/desx:explore [topic]
```

### `/desx:new`

Starts a new change — creates the directory that will hold its screens and components. (skill: `designspec-new-change`)

```text
/desx:new [change-name or description]
```

### `/desx:continue`

Writes the change's next artifact, one at a time. (skill: `designspec-continue-change`)

```text
/desx:continue [change-name]
```

### `/desx:ff`

Generates the needed artifacts in a single pass. (skill: `designspec-ff-change`)

```text
/desx:ff [change-name or description]
```

### `/desx:apply`

Implements the screens against the artifacts and the style guideline. (skill: `designspec-apply-change`)

```text
/desx:apply [change-name]
```

### `/desx:verify`

Checks the implementation against the artifacts' requirements. (skill: `designspec-verify-change`)

```text
/desx:verify [change-name]
```

### `/desx:sync`

Folds the change's page and component specs into the master specs. (skill: `designspec-sync-specs`)

```text
/desx:sync [change-name]
```

### `/desx:archive`

Archives a finished change. (skill: `designspec-archive-change`)

```text
/desx:archive [change-name]
```

## CLI

The `design-spec` CLI provides terminal commands for initializing a project, creating and inspecting changes, and printing artifact instructions and context. It works alongside the slash commands covered in [Commands & Skills](#commands--skills). Every command takes a target path and defaults to the current directory.

### `design-spec init`

Initializes the project and generates the skills and slash commands.

```text
design-spec init [path] --tools <tools>
```

| Option            | Description                                                                               |
| ----------------- | ----------------------------------------------------------------------------------------- |
| `--tools <tools>` | Agents to set up: `all`, `none`, or a comma-separated list like `claude,codex` (required) |

### `design-spec list`

Lists active changes and specs.

```text
design-spec list [path] [options]
```

| Option      | Description                                      |
| ----------- | ------------------------------------------------ |
| `--changes` | List changes (the default when no flag is given) |
| `--specs`   | List specs                                       |
| `--json`    | Output as JSON                                   |

### `design-spec status`

Shows artifact completion status for a change.

```text
design-spec status [path] --change <id>
```

| Option          | Description    |
| --------------- | -------------- |
| `--change <id>` | Target change  |
| `--json`        | Output as JSON |

### `design-spec new`

Creates a new change.

```text
design-spec new [path] --change <id>
```

| Option          | Description                  |
| --------------- | ---------------------------- |
| `--change <id>` | Name of the change to create |

### `design-spec artifact-instructions`

Prints the instructions for writing a specific artifact.

```text
design-spec artifact-instructions [path] --change <id> --artifact <id>
```

| Option            | Description                                |
| ----------------- | ------------------------------------------ |
| `--change <id>`   | Target change                              |
| `--artifact <id>` | Artifact name (e.g. `proposal`, `screens`) |
| `--json`          | Output as JSON                             |

### `design-spec apply-instructions`

Prints the instructions for the implementation step.

```text
design-spec apply-instructions [path] --change <id>
```

| Option          | Description    |
| --------------- | -------------- |
| `--change <id>` | Target change  |
| `--json`        | Output as JSON |

### `design-spec context`

Prints the resolved project context and style system.

```text
design-spec context [path]
```

| Option   | Description    |
| -------- | -------------- |
| `--json` | Output as JSON |

## License

Released under the MIT License. See [LICENSE](LICENSE) for the full text.
