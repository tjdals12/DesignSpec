import { z } from "zod";

export const ProjectConfigSchema = z.looseObject({
  context: z.string().optional(),
  contextFiles: z.array(z.string()).optional(),
});

export type ProjectConfig = z.infer<typeof ProjectConfigSchema>;
