export interface SlashCommandTemplate {
  name: string;
  description: string;
  instructions: string;
  category?: string;
  tags?: string[];
}
