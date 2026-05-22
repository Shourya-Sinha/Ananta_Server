import Joi from "joi";
import { AppError } from "./AppError.js";
import { ERROR_CODES } from "./errorCodes.js";

export function validate(schema) {
  return (req, res, next) => {
    const data = { ...req.body, ...req.params, ...req.query };
    const { error } = schema.validate(data);

    if (error) {
      throw new AppError({
        message: error.details[0].message,
        statusCode: ERROR_CODES.VALIDATION_ERROR,
        type: "VALIDATION_ERROR",
      });
    }

    next();
  };
}