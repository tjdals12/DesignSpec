import { AI_TOOLS } from "./config.js";
import { PALETTE } from "./ui.js";

/**
 * Prints a static welcome screen for the interactive `init` flow.
 *
 * It introduces DesignSpec, summarizes what `init` is about to do, and lists
 * the supported agents with a short description so the user knows what each
 * choice in the upcoming selection prompt means.
 */
export function showWelcomeScreen(): void {
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

  console.log(lines.join("\n"));
}
