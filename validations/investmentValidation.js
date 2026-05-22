import Joi from "joi";

export const addInvestmentSchema = Joi.object({
  title: Joi.string().required(),
  amount: Joi.number().required(),
});