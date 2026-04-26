import type { AIToolOption } from "../config.js";
import { ClaudeAdapter } from "./adapters/claude.adapter.js";
import { CodexAdapter } from "./adapters/codex.adapter.js";
import type { SlashCommandAdapter } from "./slash-command-adapter.js";

export class SlashCommandAdatperRegistry {
  private static adapters: Map<string, SlashCommandAdapter> = new Map();

  static {
    this.register(new ClaudeAdapter());
    this.register(new CodexAdapter());
  }

  static register(adapter: SlashCommandAdapter): void {
    this.adapters.set(adapter.toolId, adapter);
  }

  static get(toolId: AIToolOption["value"]): SlashCommandAdapter | undefined {
    const adapter = this.adapters.get(toolId);
    return adapter;
  }
}
