export class SchemaLoadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SchemaLoadError";
  }
}

export class SchemaParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SchemaParseError";
  }
}

export class SchemaValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SchemaValidationError";
  }
}
