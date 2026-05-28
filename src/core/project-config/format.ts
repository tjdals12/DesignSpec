import type { ProjectContext } from "./types.js";

export function formatProjectContext(ctx: ProjectContext): string {
  const sections: string[] = [];

  if (ctx.context) {
    sections.push(`<context>\n${ctx.context}\n</context>`);
  }

  if (ctx.contextFiles && ctx.contextFiles.length > 0) {
    const entries = ctx.contextFiles.map((f) => `[from ${f.path}]\n${f.content}`).join("\n\n");
    sections.push(`<context_files>\n${entries}\n</context_files>`);
  }

  if (ctx.style) {
    sections.push(`<style>\n${ctx.style}\n</style>`);
  }

  return sections.join("\n\n");
}
