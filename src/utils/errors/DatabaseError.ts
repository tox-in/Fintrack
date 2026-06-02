import { AppError } from "../../middleware/errorHandler";

export class DatabaseError extends AppError {
    constructor(message: string = "Database operation failed") {
        super(message);
        this.name = "DatabaseError";
        this.statusCode = 500;
    }
}
