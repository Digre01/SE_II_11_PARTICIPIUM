import { AppError } from "../errors/AppError.js";

export function createAppError(err) {

  if (err instanceof AppError) {
    return {
      code: err.status,
      name: err.name,
      message: err.message
    };
  }

  return {
    code: 500,
    name: "InternalServerError",
    message: err?.message || "Internal Server Error"
  };
}
