import { AppError } from "./AppError.js";
export class NotFoundError extends AppError {
  constructor(message) {
    super(message, 404, "NotFoundError");
  }
}
