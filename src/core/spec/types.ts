export type SpecKind = "page" | "component";

export interface SpecInfo {
  specName: string;
  kind: SpecKind;
  lastModified: Date;
}
