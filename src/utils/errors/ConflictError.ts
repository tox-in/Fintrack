import { AppError } from "../../middleware/errorHandler";

export class ConflictError extends AppError {
  constructor(message: string = 'Resource already exists') {
    super(message);
    this.name = 'ConflictError';
    this.statusCode = 409;
  }
}