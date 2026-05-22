import Joi from "joi";

export const kharchiSchema = Joi.object({
  userId: Joi.string().required(),
  amount: Joi.number().required(),
  reason: Joi.string().optional(),
});