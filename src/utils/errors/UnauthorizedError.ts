import { AppError } from "../../middleware/errorHandler";

export class UnauthorizedError extends AppError {
  constructor(message: string = "Unauthorized") {
    super(message);
    this.name = "UnauthorizedError";
    this.statusCode = 401;
  }
}
