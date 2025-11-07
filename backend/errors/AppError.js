export class AppError extends Error {
  constructor(message, status = 500, name = "AppError") {
    super(message);
    this.status = status;
    this.name = name;
    Error.captureStackTrace(this, this.constructor);
  }
}
