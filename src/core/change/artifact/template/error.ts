export class TemplateLoadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TemplateLoadError";
  }
}
