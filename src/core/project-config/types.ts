import { z } from "zod";

export const ProjectConfigSchema = z.looseObject({
  context: z.string().optional(),
  contextFiles: z.array(z.string()).optional(),
});

export type ProjectConfig = z.infer<typeof ProjectConfigSchema>;

export interface ProjectContextFile {
  path: string;
  content: string;
}

export interface ProjectContext {
  context?: string;
  contextFiles?: ProjectContextFile[];
  style?: string;
}
