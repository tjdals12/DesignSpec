import { z } from "zod";

export const ArtifactSchema = z.object({
  id: z.string().min(1, { error: "Artifact ID is required" }),
  generates: z.string().min(1, { error: "generates field is required" }),
  description: z.string().optional(),
  template: z.string().min(1, { error: "template is required" }),
  instruction: z.string(),
  requires: z.array(z.string()).default([]),
});
export type Artifact = z.infer<typeof ArtifactSchema>;

export const ApplySchema = z.object({
  requires: z.array(z.string()).min(1, { error: "apply.requires must list at least one artifact" }),
  tracks: z.string().min(1, { error: "apply.tracks is required" }),
  instruction: z.string().min(1, { error: "apply.instruction is required" }),
});
export type Apply = z.infer<typeof ApplySchema>;

export const SchemaYamlSchema = z.object({
  name: z.string().min(1, { error: "Schema name is required" }),
  version: z.number().int().positive({ error: "Version must be a positive integer" }),
  description: z.string().optional(),
  artifacts: z.array(ArtifactSchema).min(1, { error: "At least one artifact required" }),
  apply: ApplySchema,
});
export type SchemaYaml = z.infer<typeof SchemaYamlSchema>;
