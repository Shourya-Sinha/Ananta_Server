import Joi from "joi";

export const uploadSchema = Joi.object({
  file: Joi.any(),
});