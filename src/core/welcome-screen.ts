import readline from "node:readline";

import { AI_TOOLS } from "./config.js";
import { PALETTE } from "./ui.js";

function buildWelcomeLines(): string[] {
  const lines: string[] = [];

  lines.push("");
  lines.push(`${PALETTE.white("▌")} ${PALETTE.white("DesignSpec")}`);
  lines.push("");
  lines.push(PALETTE.lightGray("  Pin down what a screen should be before any code is written,"));
  lines.push(PALETTE.lightGray("  so your agent builds to the spec instead of improvising."));
  lines.push("");
  lines.push(PALETTE.white("  init will:"));
  lines.push(PALETTE.lightGray("    • Create the design-spec/ workspace"));
  lines.push(
    PALETTE.lightGray("    • Generate skills and /desx:* slash commands for the agents you pick"),
  );
  lines.push("");
  lines.push(PALETTE.white("  Supported agents:"));
  for (const tool of AI_TOOLS) {
    const description = tool.description ? PALETTE.midGray(` — ${tool.description}`) : "";
    lines.push(`    ${PALETTE.lightGray("•")} ${PALETTE.lightGray(tool.name)}${description}`);
  }
  lines.push("");

  return lines;
}

function waitForEnter(): Promise<void> {
  return new Promise((resolve) => {
    // Outside a TTY there is no one to press Enter; don't block.
    if (!process.stdin.isTTY) {
      resolve();
      return;
    }

    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question(PALETTE.midGray("  Press Enter to continue… "), () => {
      rl.close();
      resolve();
    });
  });
}

/**
 * Shows the welcome screen for the interactive `init` flow, then waits for the
 * user to press Enter and clears the screen before the tool-selection prompt.
 *
 * It introduces DesignSpec, summarizes what `init` is about to do, and lists
 * the supported agents with a short description so the user knows what each
 * choice in the upcoming selection prompt means.
 */
export async function showWelcomeScreen(): Promise<void> {
  console.log(buildWelcomeLines().join("\n"));

  await waitForEnter();

  // Clear the welcome screen so the selection prompt starts on a clean view.
  // No-op when stdout is not a TTY.
  console.clear();
}
