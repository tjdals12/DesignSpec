export function isGlobPattern(pattern: string): boolean {
  return (
    pattern.includes("*") || pattern.includes("?") || pattern.includes("[")
  );
}
