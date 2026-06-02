import { AppError } from "../../middleware/errorHandler";

export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found') {
    super(message);
    this.name = 'NotFoundError';
    this.statusCode = 404;
  }
}