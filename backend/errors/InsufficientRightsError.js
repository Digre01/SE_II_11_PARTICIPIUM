import { AppError } from "./AppError.js";
export class InsufficientRightsError extends AppError {
  constructor(message) {
    super(message, 403, "InsufficientRightsError");
  }
}
