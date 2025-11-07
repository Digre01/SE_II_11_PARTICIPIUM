import { AppError } from "./AppError.js";
export class BadRequestError extends AppError {
  constructor(message) {
    super(message, 400, "BadRequestError");
  }
}
