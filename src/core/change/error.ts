export class ChangeValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ChangeValidationError";
  }
}
