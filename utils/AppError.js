import { ERROR_CODES } from "./errorCodes.js";

export class AppError extends Error {
  constructor({
    message = "Something went wrong",
    statusCode = ERROR_CODES.SERVER_ERROR,
    type = "SERVER_ERROR",
    details = null
  }) {
    super(message);
    this.statusCode = statusCode;
    this.type = type;       // unique error identifiers
    this.details = details;
    this.isOperational = true;
  }
}