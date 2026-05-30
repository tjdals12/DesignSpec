import chalk from "chalk";

import { PALETTE } from "./ui.js";
import { WELCOME_ANIMATION, WELCOME_PEAK_FRAME_INDEX } from "./ascii-patterns.js";

// Minimum terminal width for the side-by-side (logo + text) layout.
const MIN_WIDTH = 60;
// Fixed width of the logo column, including the gap before the text column.
const ART_COLUMN_WIDTH = 18;
// Left margin applied to every rendered line.
const MARGIN = "  ";

// Brightness ramp for the logo, dark → white, so the window comes into focus
// as it is drawn. Indexed by frame; clamped to the last shade.
const BRIGHTNESS = [
  PALETTE.darkGray,
  PALETTE.darkGray,
  PALETTE.midGray,
  PALETTE.midGray,
  PALETTE.lightGray,
  PALETTE.white,
  PALETTE.white,
];

// Quick-start commands shown after setup. Names are padded to align their
// one-line descriptions in a column.
const QUICK_START: Array<{ command: string; description: string }> = [
  { command: "/desx:style-init", description: "Set the style guideline (once)" },
  { command: "/desx:new", description: "Start a change" },
  { command: "/desx:continue", description: "Write the next artifact" },
  { command: "/desx:apply", description: "Implement to spec" },
];

/**
 * Welcome text shown in the right column. Mostly monochrome to match
 * DesignSpec's white-on-black wireframe brand, with command names in yellow
 * and the Enter hint in cyan.
 *
 * The agent list is intentionally left out — the very next screen lets the
 * user pick agents (with descriptions), so repeating them here would be
 * redundant and would grow this screen as agents are added.
 */
function getWelcomeText(): string[] {
  const commandWidth = Math.max(...QUICK_START.map(({ command }) => command.length));

  return [
    PALETTE.white("DesignSpec"),
    PALETTE.midGray("Predictable UI for AI coding agents"),
    "",
    PALETTE.white("init will:"),
    PALETTE.midGray("  • Create the design-spec/ workspace"),
    PALETTE.midGray("  • Generate skills and /desx:* slash commands"),
    "",
    PALETTE.white("Quick start after setup:"),
    ...QUICK_START.map(({ command, description }) => {
      const paddedCommand = chalk.yellow(command.padEnd(commandWidth));
      return `  ${paddedCommand}  ${PALETTE.midGray(description)}`;
    }),
    "",
    chalk.cyan("Press Enter to continue… "),
  ];
}

/** Renders one animation frame: logo column (colored) beside the text column. */
function renderFrame(
  artLines: string[],
  textLines: string[],
  color: (s: string) => string,
): string {
  const maxLines = Math.max(artLines.length, textLines.length);
  const lines: string[] = [];

  for (let i = 0; i < maxLines; i++) {
    const artLine = artLines[i] ?? "";
    const textLine = textLines[i] ?? "";
    const paddedArt = artLine.padEnd(ART_COLUMN_WIDTH);
    // \x1b[2K clears the line first so a previous frame leaves no residue.
    lines.push(`\x1b[2K${MARGIN}${color(paddedArt)}${textLine}`);
  }

  return lines.join("\n");
}

/** Whether the terminal can render the ANSI animation meaningfully. */
function canAnimate(): boolean {
  if (!process.stdout.isTTY) return false;
  if (process.env.NO_COLOR) return false;
  if (process.env.DESIGN_SPEC_INTERACTIVE === "0") return false;
  const columns = process.stdout.columns ?? 80;
  if (columns < MIN_WIDTH) return false;
  return true;
}

/** Waits for the user to press Enter. Resolves immediately outside a TTY. */
function waitForEnter(): Promise<void> {
  return new Promise((resolve) => {
    const { stdin } = process;

    if (!stdin.isTTY) {
      resolve();
      return;
    }

    const wasRaw = stdin.isRaw;
    stdin.setRawMode(true);
    stdin.resume();

    const onData = (data: Buffer): void => {
      const char = data.toString();
      if (char === "\r" || char === "\n" || char === "\u0003") {
        stdin.removeListener("data", onData);
        stdin.setRawMode(wasRaw);
        stdin.pause();
        // Ctrl+C: exit cleanly instead of falling through to the prompt.
        if (char === "\u0003") {
          process.stdout.write("\n");
          process.exit(0);
        }
        resolve();
      }
    };

    stdin.on("data", onData);
  });
}

/** Erases `lineCount` rendered lines above the cursor, leaving a clean view. */
function clearRenderedArea(lineCount: number): void {
  if (!process.stdout.isTTY) return;
  process.stdout.write(`\x1b[${lineCount}A`);
  for (let i = 0; i < lineCount; i++) {
    process.stdout.write("\x1b[2K\n");
  }
  process.stdout.write(`\x1b[${lineCount}A`);
}

/**
 * Shows the welcome screen for the interactive `init` flow.
 *
 * Animates the DesignSpec wireframe logo beside an intro of what `init` does
 * and the supported agents, waits for Enter, then erases what it drew so the
 * tool-selection prompt starts on a clean view. Degrades to a static frame
 * when the terminal can't animate, and is a no-op-ish print outside a TTY.
 */
export async function showWelcomeScreen(): Promise<void> {
  const textLines = getWelcomeText();
  const contentHeight = Math.max(WELCOME_ANIMATION.frames[0]!.length, textLines.length);
  // One leading newline + the rendered block.
  const totalHeight = contentHeight + 1;

  if (!canAnimate()) {
    const peakFrame = WELCOME_ANIMATION.frames[WELCOME_PEAK_FRAME_INDEX]!;
    process.stdout.write("\n" + renderFrame(peakFrame, textLines, PALETTE.white) + "\n");
    await waitForEnter();
    clearRenderedArea(totalHeight);
    return;
  }

  let frameIndex = 0;
  let isFirstRender = true;

  process.stdout.write("\n");

  const interval = setInterval(() => {
    const frame = WELCOME_ANIMATION.frames[frameIndex]!;
    const color = BRIGHTNESS[frameIndex] ?? PALETTE.white;

    if (!isFirstRender) {
      process.stdout.write(`\x1b[${contentHeight}A`);
    }
    isFirstRender = false;

    process.stdout.write(renderFrame(frame, textLines, color) + "\n");
    frameIndex = (frameIndex + 1) % WELCOME_ANIMATION.frames.length;
  }, WELCOME_ANIMATION.interval);

  await waitForEnter();

  clearInterval(interval);
  clearRenderedArea(totalHeight);
}
