import { CERROR } from "../utils/logger.js";
import { ERROR } from "../utils/response.js";

export function errorHandler(err, req, res, next) {
  CERROR("ERROR:", err.message, err.type, err.details);

  return ERROR(
    res,
    err.message || "Internal Server Error",
    err.statusCode || 500,
    {
      type: err.type || "UNKNOWN_ERROR",
      details: err.details || null,
    }
  );
}