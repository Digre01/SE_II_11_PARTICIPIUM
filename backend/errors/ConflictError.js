import { AppError } from "./AppError.js";
export class ConflictError extends AppError {
  constructor(message) {
    super(message, 409, "ConflictError");
  }
}
