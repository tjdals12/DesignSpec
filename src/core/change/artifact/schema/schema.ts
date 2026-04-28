import { z } from "zod";

export const ArtifactSchema = z.object({
  id: z.string().min(1, { error: "Artifact ID is required" }),
  generates: z.string().min(1, { error: "generates field is required" }),
  description: z.string().optional(),
  template: z.string().min(1, { error: "template is required" }),
  instruction: z.string().optional(),
  requires: z.array(z.string()).default([]),
});
export type Artifact = z.infer<typeof ArtifactSchema>;

export const SchemaYamlSchema = z.object({
  name: z.string().min(1, { error: "Schema name is required" }),
  version: z
    .number()
    .int()
    .positive({ error: "Version must be a positive integer" }),
  description: z.string().optional(),
  artifacts: z
    .array(ArtifactSchema)
    .min(1, { error: "At least one artifact required" }),
});
export type SchemaYaml = z.infer<typeof SchemaYamlSchema>;
