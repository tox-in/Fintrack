import { AppError } from "../../middleware/errorHandler";

export class ValidationError extends AppError {
  public errors: any[];

  constructor(message: string = 'Validation failed', errors: any[] = []) {
    super(message);
    this.name = 'ValidationError';
    this.statusCode = 400;
    this.errors = errors;
  }
}