import { AppError } from "../utils/AppError.js";
import { ERROR_CODES } from "../utils/errorCodes.js";

export const allowRoles = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role))
      throw new AppError({
        message: "Access denied",
        statusCode: ERROR_CODES.FORBIDDEN,
        type: "ROLE_NOT_ALLOWED",
      });

    next();
  };
};