import Joi from "joi";

export const ocrSchema = Joi.object({
  file: Joi.any(),
});