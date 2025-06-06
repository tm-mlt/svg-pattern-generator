export class FieldError extends Error {
  constructor(message: string, value: any) {
    super(message);
  }
}