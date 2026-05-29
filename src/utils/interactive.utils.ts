export interface InteractiveOptions {
  /**
   * Commander-style negated option: `--no-interactive` sets this to `false`.
   * When omitted or `true`, prompting is allowed if the environment supports it.
   */
  interactive?: boolean | undefined;
}

/**
 * Resolves whether the CLI may show interactive prompts.
 *
 * Prompting is disabled when:
 * - the caller explicitly passed `--no-interactive` (`interactive === false`),
 * - the `DESIGN_SPEC_INTERACTIVE` env var is set to `"0"`,
 * - a `CI` env var is present (GitHub Actions, GitLab CI, Travis, etc.), or
 * - stdin is not a TTY (piped input, non-interactive shell).
 */
export function isInteractive(options?: InteractiveOptions): boolean {
  if (options?.interactive === false) return false;
  if (process.env.DESIGN_SPEC_INTERACTIVE === "0") return false;
  if ("CI" in process.env) return false;
  return Boolean(process.stdin.isTTY);
}
